const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: '/tmp/uploads/' });

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY product_name');
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { product_name, category, sku, cost_price, selling_price, stock_qty, min_stock, unit } = req.body;
    const result = await pool.query(
      `INSERT INTO products (product_name, category, sku, cost_price, selling_price, stock_qty, min_stock, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING product_id`,
      [product_name, category || '', sku || '', cost_price || 0, selling_price || 0, stock_qty || 0, min_stock || 5, unit || 'pcs']
    );
    res.json({ success: true, product_id: result.rows[0].product_id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { product_name, category, sku, cost_price, selling_price, stock_qty, min_stock, unit, active } = req.body;
    await pool.query(
      `UPDATE products SET product_name=$1, category=$2, sku=$3, cost_price=$4, selling_price=$5, stock_qty=$6, min_stock=$7, unit=$8, active=$9, updated_at=NOW() WHERE product_id=$10`,
      [product_name, category, sku, cost_price, selling_price, stock_qty, min_stock, unit, active !== false, req.params.id]
    );
    res.json({ success: true, message: 'Product updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/products/bulk - bulk upload from CSV
router.post('/bulk', upload.single('file'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File CSV wajib diupload' });
    filePath = req.file.path;
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    let inserted = 0, errors = 0;
    for (const row of records) {
      if (!row.product_name && !row['Nama Produk'] && !row['product_name']) { errors++; continue; }
      const name = row.product_name || row['Nama Produk'] || row['nama_produk'] || '';
      const cat = row.category || row['Kategori'] || row.category || '';
      const skuVal = row.sku || row['SKU'] || row.sku || '';
      const cp = parseInt(row.cost_price || row['Harga Beli'] || row.cost_price || 0);
      const sp = parseInt(row.selling_price || row['Harga Jual'] || row.selling_price || 0);
      const sq = parseInt(row.stock_qty || row['Stok'] || row.stock_qty || 0);
      const ms = parseInt(row.min_stock || row['Min Stok'] || row.min_stock || 5);
      const u = row.unit || row['Unit'] || row.unit || 'pcs';
      try {
        await pool.query(
          `INSERT INTO products (product_name, category, sku, cost_price, selling_price, stock_qty, min_stock, unit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
          [name, cat, skuVal, cp, sp, sq, ms, u]
        );
        inserted++;
      } catch { errors++; }
    }
    res.json({ success: true, message: `Upload selesai: ${inserted} produk ditambahkan, ${errors} gagal` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal parse CSV: ' + err.message });
  } finally {
    if (filePath) try { fs.unlinkSync(filePath); } catch {}
  }
});

module.exports = router;
