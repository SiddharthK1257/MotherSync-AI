const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mockStore = require('../models/mockStore');
const { isMockMode } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mothersync_ai_super_secret_jwt_key_2026_clinical_grade';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      if (isMockMode()) {
        const found = mockStore.users.find(u => String(u._id) === String(decoded.id) || u.email === decoded.email);
        if (found) {
          req.user = found;
          return next();
        }
      } else {
        try {
          const user = await User.findById(decoded.id).select('-password');
          if (user) {
            req.user = user;
            return next();
          }
        } catch (dbErr) {
          // If ObjectId casting fails or temporary DB lookup issue, check in-memory fallback
          const found = mockStore.users.find(u => String(u._id) === String(decoded.id) || u.email === decoded.email);
          if (found) {
            req.user = found;
            return next();
          }
        }
      }

      return res.status(401).json({ success: false, message: 'User not found or session expired. Please log in again.' });
    } catch (error) {
      console.error('🔒 [AuthMiddleware] Token verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired session token. Please log in again.' });
    }
  }

  return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: `Access forbidden: Requires ${role} role.` });
    }
    next();
  };
};

module.exports = { protect, requireRole, JWT_SECRET };
