const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE active = true ORDER BY service_name');
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { service_name, category, price, duration_min } = req.body;
    const result = await pool.query(
      'INSERT INTO services (service_name, category, price, duration_min) VALUES ($1, $2, $3, $4) RETURNING service_id',
      [service_name, category || '', price || 0, duration_min || 60]
    );
    res.json({ success: true, service_id: result.rows[0].service_id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { service_name, category, price, duration_min, active } = req.body;
    await pool.query(
      'UPDATE services SET service_name=$1, category=$2, price=$3, duration_min=$4, active=$5, updated_at=NOW() WHERE service_id=$6',
      [service_name, category, price, duration_min, active !== false, req.params.id]
    );
    res.json({ success: true, message: 'Service updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
