// ============================================================
// Auth Routes - login, profile, user management
// ============================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken, verifyToken, requireRole } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND active = true', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { userId: user.user_id, username: user.username, fullName: user.full_name, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me - get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, full_name, role, active, created_at FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// Admin-only: User management
// ============================================================

// GET /api/auth/users - list all users (admin only)
router.get('/users', verifyToken, requireRole('owner'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, full_name, role, active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List users error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/users - create user (admin only)
router.post('/users', verifyToken, requireRole('owner'), async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    // Check duplicate
    const existing = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, full_name, role, active, created_at',
      [username, hash, full_name || '', role || 'kasir']
    );
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/users/:id - update user (admin only)
router.put('/users/:id', verifyToken, requireRole('owner'), async (req, res) => {
  try {
    const { full_name, role, active, password } = req.body;
    const userId = req.params.id;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role), active = COALESCE($3, active), password_hash = $4 WHERE user_id = $5',
        [full_name, role, active, hash, userId]
      );
    } else {
      await pool.query(
        'UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role), active = COALESCE($3, active) WHERE user_id = $4',
        [full_name, role, active, userId]
      );
    }

    const result = await pool.query(
      'SELECT user_id, username, full_name, role, active, created_at FROM users WHERE user_id = $1',
      [userId]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/auth/users/:id - delete user (admin only, cannot delete self)
router.delete('/users/:id', verifyToken, requireRole('owner'), async (req, res) => {
  try {
    const userId = req.params.id;
    // Prevent deleting yourself
    if (userId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
    }
    await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
    res.json({ success: true, message: 'Pengguna dihapus' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
