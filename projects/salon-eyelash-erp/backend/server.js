require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// PUBLIC FILES (login page, etc. — no auth needed)
// ============================================================
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// AUTH ROUTES (no auth needed for login)
// ============================================================
app.use('/api/auth', require('./src/routes/auth'));

// ============================================================
// PROTECTED ROUTES (require JWT)
// ============================================================
const { verifyToken } = require('./src/middleware/auth');

// POS
app.use('/api/pos', verifyToken, require('./src/routes/pos'));

// Booking
app.use('/api/booking', verifyToken, require('./src/routes/booking'));

// Report
app.use('/api/report', verifyToken, require('./src/routes/report'));

// Customers
app.use('/api/customers', verifyToken, require('./src/routes/customers'));

// Services
app.use('/api/services', verifyToken, require('./src/routes/services'));

// Staff
app.use('/api/staff', verifyToken, require('./src/routes/staff'));

// Expenses
app.use('/api/expenses', verifyToken, require('./src/routes/expenses'));

// Settings
app.use('/api/settings', verifyToken, require('./src/routes/settings'));

// Products
app.use('/api/products', verifyToken, require('./src/routes/products'));

// ============================================================
// FRONTEND SPA - serve index.html for all non-API routes
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Salon Eyelash ERP running on port ${PORT}`);
  console.log(`Open: http://localhost:${PORT}`);
});
