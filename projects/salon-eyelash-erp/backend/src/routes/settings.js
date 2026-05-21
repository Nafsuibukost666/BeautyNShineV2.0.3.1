const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY setting_key');
    const map = {};
    result.rows.forEach(r => map[r.setting_key] = r.setting_value);
    res.json({ success: true, data: map });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2',
        [key, String(value)]
      );
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
