const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get initial data for booking page
router.get('/initial-data', async (req, res) => {
  try {
    const [services, staff] = await Promise.all([
      pool.query("SELECT service_id, service_name, category, price, duration_min FROM services WHERE active = true ORDER BY service_name"),
      pool.query("SELECT staff_id, staff_name, role, commission_type, commission_value FROM staff WHERE active = true ORDER BY staff_name")
    ]);
    res.json({ success: true, services: services.rows, staff: staff.rows, statuses: ["booked", "done", "cancelled", "no_show"] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const { booking_date, booking_time, customer_name, phone, instagram, service_id, staff_id, status, notes } = req.body;

    if (!booking_date || !booking_time || !customer_name || !service_id || !staff_id) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    // Find service & staff names
    const [svcRes, staffRes] = await Promise.all([
      pool.query('SELECT service_name FROM services WHERE service_id = $1', [service_id]),
      pool.query('SELECT staff_name FROM staff WHERE staff_id = $1', [staff_id])
    ]);

    // Get or create customer
    let customerId = null;
    if (phone) {
      const existing = await pool.query('SELECT customer_id, customer_name FROM customers WHERE phone = $1 LIMIT 1', [phone]);
      if (existing.rows.length > 0) {
        customerId = existing.rows[0].customer_id;
      } else {
        const newCust = await pool.query(
          'INSERT INTO customers (customer_name, phone, instagram) VALUES ($1, $2, $3) RETURNING customer_id',
          [customer_name, phone, instagram || '']
        );
        customerId = newCust.rows[0].customer_id;
      }
    }

    const result = await pool.query(
      `INSERT INTO bookings (booking_date, booking_time, customer_id, customer_name, service_id, service_name, staff_id, staff_name, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING booking_id`,
      [booking_date, booking_time, customerId, customer_name, service_id, svcRes.rows[0]?.service_name || '',
       staff_id, staffRes.rows[0]?.staff_name || '', status || 'booked', notes || '']
    );

    res.json({ success: true, booking_id: result.rows[0].booking_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get bookings by date
router.get('/by-date/:date', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT booking_id, booking_date, booking_time, customer_name, service_name, staff_name, status, notes
       FROM bookings WHERE booking_date = $1 ORDER BY booking_time`,
      [req.params.date]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status wajib diisi' });

    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_id = $2 RETURNING booking_id',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

    res.json({ success: true, message: 'Status berhasil diubah' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
