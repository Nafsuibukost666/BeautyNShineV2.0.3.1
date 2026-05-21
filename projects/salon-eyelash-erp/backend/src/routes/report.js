const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get daily sales report
router.get('/daily/:date', async (req, res) => {
  try {
    const date = req.params.date;

    // Get transactions for the date
    const txRes = await pool.query(
      `SELECT * FROM transactions WHERE transaction_date::date = $1 ORDER BY transaction_date`,
      [date]
    );
    const transactions = txRes.rows;

    if (transactions.length === 0) {
      return res.json({
        success: true, date, summary: { transaction_count: 0, subtotal: 0, discount: 0, tax: 0, grand_total: 0, total_paid: 0, unpaid_amount: 0 },
        payment_breakdown: [], therapist_breakdown: [], commission_breakdown: [], service_breakdown: [], transactions: []
      });
    }

    const txIds = transactions.map(t => t.transaction_id);

    // Get items & payments for these transactions
    const itemsRes = await pool.query(
      `SELECT * FROM transaction_items WHERE transaction_id = ANY($1)`,
      [txIds]
    );
    const paymentsRes = await pool.query(
      `SELECT * FROM payments WHERE transaction_id = ANY($1)`,
      [txIds]
    );

    const items = itemsRes.rows;
    const payments = paymentsRes.rows;

    // Summary
    let subtotal = 0, discount = 0, tax = 0, grandTotal = 0, totalPaid = 0;
    transactions.forEach(tx => {
      subtotal += Number(tx.subtotal) || 0;
      discount += Number(tx.discount) || 0;
      tax += Number(tx.tax) || 0;
      grandTotal += Number(tx.grand_total) || 0;
    });
    payments.forEach(p => { totalPaid += Number(p.amount) || 0; });

    // Payment breakdown
    const pmtMap = {};
    payments.forEach(p => {
      const method = p.method || 'Tidak diketahui';
      if (!pmtMap[method]) pmtMap[method] = { method, count: 0, amount: 0 };
      pmtMap[method].count += 1;
      pmtMap[method].amount += Number(p.amount) || 0;
    });

    // Therapist breakdown
    const thMap = {};
    items.forEach(item => {
      const name = item.staff_name || 'Tanpa Therapist';
      if (!thMap[name]) thMap[name] = { staff_name: name, transaction_ids: new Set(), service_qty: 0, revenue: 0 };
      thMap[name].transaction_ids.add(item.transaction_id);
      thMap[name].service_qty += Number(item.qty) || 0;
      thMap[name].revenue += Number(item.line_total) || 0;
    });

    // Commission breakdown
    const staffRes = await pool.query('SELECT staff_id, staff_name, commission_type, commission_value FROM staff');
    const staffComm = {};
    staffRes.rows.forEach(s => { staffComm[s.staff_id] = s; });

    const commMap = {};
    items.forEach(item => {
      const staffId = item.staff_id;
      const staffName = item.staff_name || 'Tanpa Therapist';
      const qty = Number(item.qty) || 0;
      const revenue = Number(item.line_total) || 0;
      const rule = staffComm[staffId] || { commission_type: 'percentage', commission_value: 0 };
      const isPct = String(rule.commission_type || '').toLowerCase().match(/percentage|percent|persen/);
      const val = Number(rule.commission_value) || 0;
      const amount = isPct ? revenue * val / 100 : val * qty;
      const key = staffId || staffName;
      if (!commMap[key]) commMap[key] = { staff_id: staffId, staff_name: staffName, commission_type: rule.commission_type, commission_value: val, service_qty: 0, revenue: 0, commission_amount: 0 };
      commMap[key].service_qty += qty;
      commMap[key].revenue += revenue;
      commMap[key].commission_amount += amount;
    });

    // Service breakdown
    const svcMap = {};
    items.forEach(item => {
      const name = item.item_name || 'Tanpa Nama';
      if (!svcMap[name]) svcMap[name] = { item_name: name, qty: 0, revenue: 0 };
      svcMap[name].qty += Number(item.qty) || 0;
      svcMap[name].revenue += Number(item.line_total) || 0;
    });

    // Payment map for transactions list
    const txPmtMap = {};
    payments.forEach(p => {
      const tid = p.transaction_id;
      if (!txPmtMap[tid]) txPmtMap[tid] = { amount: 0, methods: [] };
      txPmtMap[tid].amount += Number(p.amount) || 0;
      if (p.method) txPmtMap[tid].methods.push(p.method);
    });

    res.json({
      success: true, date,
      summary: {
        transaction_count: transactions.length, subtotal, discount, tax,
        grand_total: grandTotal, total_paid: totalPaid, unpaid_amount: grandTotal - totalPaid
      },
      payment_breakdown: Object.values(pmtMap),
      therapist_breakdown: Object.values(thMap).map(t => ({
        staff_name: t.staff_name, transaction_count: t.transaction_ids.size, service_qty: t.service_qty, revenue: t.revenue
      })),
      commission_breakdown: Object.values(commMap),
      service_breakdown: Object.values(svcMap),
      transactions: transactions.map(tx => {
        const pmt = txPmtMap[tx.transaction_id] || { amount: 0, methods: [] };
        return {
          transaction_id: tx.transaction_code,
          transaction_date: tx.transaction_date,
          customer_name: tx.customer_name,
          staff_name: tx.staff_name,
          grand_total: tx.grand_total,
          paid_amount: pmt.amount,
          payment_methods: pmt.methods.join(', '),
          payment_status: tx.payment_status
        };
      })
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Ping
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Koneksi Backend berhasil! ✅' });
});

// Inline formatter
const _fmt = (v) => 'Rp' + Number(v || 0).toLocaleString('id-ID');

// Profit-loss summary (fallback kalo Python service mati)
router.get('/profit-loss', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'start_date dan end_date wajib diisi' });
    }
    const [txRes, expRes] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(grand_total),0) AS val FROM transactions WHERE transaction_date::date >= $1 AND transaction_date::date <= $2', [start_date, end_date]),
      pool.query('SELECT COALESCE(SUM(amount),0) AS val FROM expenses WHERE expense_date::date >= $1 AND expense_date::date <= $2', [start_date, end_date])
    ]);
    const revenue = Number(txRes.rows[0]?.val || 0);
    const expenses = Number(expRes.rows[0]?.val || 0);
    const profit = revenue - expenses;
    res.json({ success: true, data: { revenue, expenses, profit, revenue_fmt: _fmt(revenue), expenses_fmt: _fmt(expenses), profit_fmt: _fmt(profit) } });
  } catch (err) {
    console.error('[Report ProfitLoss Error]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get range summary (start_date - end_date)
router.get('/range', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'start_date dan end_date wajib diisi' });
    }
    const result = await pool.query(
      `SELECT COUNT(*) AS transaction_count, COALESCE(SUM(grand_total), 0) AS grand_total
       FROM transactions WHERE transaction_date::date >= $1 AND transaction_date::date <= $2`,
      [start_date, end_date]
    );
    res.json({ success: true, ...result.rows[0] });
  } catch (err) {
    console.error('[Report Range Error]', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
