const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff WHERE active = true ORDER BY staff_name');
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { staff_name, role, phone, commission_type, commission_value } = req.body;
    const result = await pool.query(
      'INSERT INTO staff (staff_name, role, phone, commission_type, commission_value) VALUES ($1, $2, $3, $4, $5) RETURNING staff_id',
      [staff_name, role || 'Therapist', phone || '', commission_type || 'percentage', commission_value || 0]
    );
    res.json({ success: true, staff_id: result.rows[0].staff_id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { staff_name, role, phone, commission_type, commission_value, active } = req.body;
    await pool.query(
      'UPDATE staff SET staff_name=$1, role=$2, phone=$3, commission_type=$4, commission_value=$5, active=$6, updated_at=NOW() WHERE staff_id=$7',
      [staff_name, role, phone, commission_type, commission_value, active !== false, req.params.id]
    );
    res.json({ success: true, message: 'Staff updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
