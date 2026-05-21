const express = require('express');
const router = express.Router();
const pool = require('../db');

// List all customers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT 
      c.customer_id, c.customer_name, c.phone, c.instagram, c.birthday, c.notes, c.active, c.created_at, c.updated_at,
      COALESCE(tx_stats.total_transactions, 0) AS total_transactions,
      COALESCE(tx_stats.total_spent, 0) AS total_spent
    FROM customers c
    LEFT JOIN (
      SELECT customer_id, COUNT(*) AS total_transactions, COALESCE(SUM(grand_total), 0) AS total_spent
      FROM transactions GROUP BY customer_id
    ) tx_stats ON tx_stats.customer_id = c.customer_id`;
    const params = [];

    if (search) {
      query += ' WHERE customer_name ILIKE $1 OR phone ILIKE $1';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get customer by ID with visit history
router.get('/:id', async (req, res) => {
  try {
    const [custRes, txRes, bookingRes] = await Promise.all([
      pool.query('SELECT * FROM customers WHERE customer_id = $1', [req.params.id]),
      pool.query('SELECT transaction_code, transaction_date, grand_total, payment_status FROM transactions WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.id]),
      pool.query('SELECT booking_id, booking_date, booking_time, service_name, staff_name, status FROM bookings WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.id])
    ]);

    if (custRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });

    res.json({
      success: true,
      customer: custRes.rows[0],
      transactions: txRes.rows,
      bookings: bookingRes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const { customer_name, phone, instagram, birthday, notes } = req.body;
    if (!customer_name) return res.status(400).json({ success: false, message: 'Nama customer wajib diisi' });

    const result = await pool.query(
      `INSERT INTO customers (customer_name, phone, instagram, birthday, notes) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id`,
      [customer_name, phone || '', instagram || '', birthday || null, notes || '']
    );
    res.json({ success: true, customer_id: result.rows[0].customer_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { customer_name, phone, instagram, birthday, notes, active } = req.body;
    const result = await pool.query(
      `UPDATE customers SET customer_name = $1, phone = $2, instagram = $3, birthday = $4, notes = $5, active = $6, updated_at = NOW() WHERE customer_id = $7 RETURNING customer_id`,
      [customer_name, phone, instagram, birthday, notes, active !== false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
    res.json({ success: true, message: 'Customer berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
