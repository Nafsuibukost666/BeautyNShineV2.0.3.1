// ============================================================
// Auth Middleware - JWT verification
// ============================================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'salon-eyelash-secret-key-2024';

function generateToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, role: user.role, fullName: user.full_name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token from Authorization header
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized - no token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized - invalid token' });
  }
}

// Optional auth — doesn't block, just sets req.user if token present
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // ignore
    }
  }
  next();
}

// Role-based access
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden - insufficient role' });
    }
    next();
  };
}

module.exports = { generateToken, verifyToken, optionalAuth, requireRole };
