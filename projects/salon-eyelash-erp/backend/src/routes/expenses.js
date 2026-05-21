const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, category } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (start_date) { params.push(start_date); query += ` AND expense_date >= $${params.length}`; }
    if (end_date) { params.push(end_date); query += ` AND expense_date <= $${params.length}`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }

    query += ' ORDER BY expense_date DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { expense_date, category, description, amount, payment_method, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO expenses (expense_date, category, description, amount, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING expense_id',
      [expense_date || new Date(), category, description || '', amount || 0, payment_method || 'Cash', notes || '']
    );
    res.json({ success: true, expense_id: result.rows[0].expense_id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { expense_date, category, description, amount, payment_method, notes } = req.body;
    await pool.query(
      'UPDATE expenses SET expense_date=$1, category=$2, description=$3, amount=$4, payment_method=$5, notes=$6 WHERE expense_id=$7',
      [expense_date, category, description, amount, payment_method, notes, req.params.id]
    );
    res.json({ success: true, message: 'Expense updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE expense_id = $1', [req.params.id]);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
