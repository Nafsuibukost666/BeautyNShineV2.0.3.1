const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get initial data for POS (services + staff + payment methods)
router.get('/initial-data', async (req, res) => {
  try {
    const [services, staff] = await Promise.all([
      pool.query("SELECT service_id, service_name, category, price, duration_min FROM services WHERE active = true ORDER BY service_name"),
      pool.query("SELECT staff_id, staff_name, role, commission_type, commission_value FROM staff WHERE active = true ORDER BY staff_name")
    ]);

    res.json({
      success: true,
      services: services.rows,
      staff: staff.rows,
      payment_methods: ["Cash", "QRIS", "Transfer", "Debit", "Credit"]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save new transaction (POS)
router.post('/transaction', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = req.body;
    const now = new Date();

    // Get or create customer
    let customerId = '00000000-0000-0000-0000-000000000000';
    let customerName = order.customer?.customer_name?.trim() || order.customer?.name?.trim() || 'Walk-in Customer';
    const phone = order.customer?.phone?.trim() || '';

    if (phone) {
      const existing = await client.query('SELECT customer_id, customer_name FROM customers WHERE phone = $1 LIMIT 1', [phone]);
      if (existing.rows.length > 0) {
        customerId = existing.rows[0].customer_id;
        customerName = existing.rows[0].customer_name;
      } else {
        const newCust = await client.query(
          'INSERT INTO customers (customer_name, phone, instagram) VALUES ($1, $2, $3) RETURNING customer_id, customer_name',
          [customerName, phone, order.customer?.instagram || '']
        );
        customerId = newCust.rows[0].customer_id;
        customerName = newCust.rows[0].customer_name;
      }
    }

    // Generate transaction code
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seqRes = await client.query("SELECT COALESCE(MAX(CAST(SPLIT_PART(transaction_code, '-', 3) AS INTEGER)), 0) + 1 AS next FROM transactions WHERE transaction_code LIKE $1", [`TRX-${dateStr}-%`]);
    const seq = String(seqRes.rows[0].next).padStart(4, '0');
    const txCode = `TRX-${dateStr}-${seq}`;

    // Calculate totals
    let subtotal = 0;
    const items = (order.items || []).map(item => {
      const qty = Number(item.qty) || 1;
      const unitPrice = Number(item.unit_price) || 0;
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;
      return { ...item, qty, unitPrice, lineTotal };
    });

    const discount = Number(order.discount) || 0;
    const tax = Number(order.tax) || 0;
    const grandTotal = subtotal - discount + tax;

    // Find staff
    let staffId = null, staffName = '';
    if (order.staff_id) {
      const staffRes = await client.query('SELECT staff_id, staff_name FROM staff WHERE staff_id = $1', [order.staff_id]);
      if (staffRes.rows[0]) {
        staffId = staffRes.rows[0].staff_id;
        staffName = staffRes.rows[0].staff_name;
      }
    }

    // Insert transaction
    const paymentAmount = Number(order.payment?.amount) || 0;
    let paymentStatus = 'unpaid';
    if (paymentAmount >= grandTotal) paymentStatus = 'paid';
    else if (paymentAmount > 0) paymentStatus = 'partial';

    const txRes = await client.query(
      `INSERT INTO transactions (transaction_code, customer_id, customer_name, staff_id, staff_name, subtotal, discount, tax, grand_total, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING transaction_id, transaction_code`,
      [txCode, customerId, customerName, staffId, staffName, subtotal, discount, tax, grandTotal, paymentStatus, order.notes || '']
    );
    const txId = txRes.rows[0].transaction_id;

    // Insert items
    for (const item of items) {
      let itemStaffId = staffId, itemStaffName = staffName;
      if (item.staff_id) {
        const sRes = await client.query('SELECT staff_id, staff_name FROM staff WHERE staff_id = $1', [item.staff_id]);
        if (sRes.rows[0]) {
          itemStaffId = sRes.rows[0].staff_id;
          itemStaffName = sRes.rows[0].staff_name;
        }
      }
      await client.query(
        `INSERT INTO transaction_items (transaction_id, item_type, item_id_ref, item_name, qty, unit_price, discount, line_total, staff_id, staff_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [txId, item.item_type || 'service', item.item_id_ref || '', item.item_name, item.qty, item.unitPrice, item.discount || 0, item.lineTotal, itemStaffId, itemStaffName]
      );
    }

    // Insert payment if any
    if (paymentAmount > 0) {
      await client.query(
        'INSERT INTO payments (transaction_id, method, amount, reference_no) VALUES ($1, $2, $3, $4)',
        [txId, order.payment?.method || 'Cash', paymentAmount, order.payment?.reference_no || '']
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      transaction_id: txCode,
      grand_total: grandTotal,
      payment_status: paymentStatus
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// Get receipt by transaction code
router.get('/receipt/:code', async (req, res) => {
  try {
    const txRes = await pool.query('SELECT * FROM transactions WHERE transaction_code = $1', [req.params.code]);
    if (txRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });

    const tx = txRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM transaction_items WHERE transaction_id = $1', [tx.transaction_id]);
    const paymentsRes = await pool.query('SELECT * FROM payments WHERE transaction_id = $1', [tx.transaction_id]);
    const settingsRes = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    settingsRes.rows.forEach(s => settings[s.setting_key] = s.setting_value);

    res.json({
      success: true,
      business_name: settings.business_name || 'Salon Eyelash',
      transaction_id: tx.transaction_code,
      transaction_date: tx.transaction_date,
      customer_name: tx.customer_name,
      staff_name: tx.staff_name,
      subtotal: tx.subtotal,
      discount: tx.discount,
      tax: tx.tax,
      grand_total: tx.grand_total,
      payment_status: tx.payment_status,
      items: itemsRes.rows.map(i => ({
        item_name: i.item_name, qty: i.qty, unit_price: i.unit_price,
        discount: i.discount, line_total: i.line_total, staff_name: i.staff_name
      })),
      payments: paymentsRes.rows.map(p => ({
        method: p.method, amount: p.amount, reference_no: p.reference_no, payment_date: p.payment_date
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
