const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect middleware — verifies JWT and attaches user to req ────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Check cookies first, fallback to Auth header
    if (req.cookies && req.cookies.jwt && req.cookies.jwt !== 'none') {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401);
      return next(new Error('Not authorized — no token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      return next(new Error('Not authorized — user no longer exists'));
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next(new Error('Not authorized — invalid or expired token'));
  }
};
// ── RBAC Middleware — verifies user role ────────────────────────────────────────
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      res.status(401);
      return next(new Error('Not authorized — user role missing'));
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Forbidden — requires one of roles: ${roles.join(', ')}`));
    }
    
    next();
  };
};

// ── RBAC Middleware — verifies institution access ──────────────────────────────
const requireInstitutionAccess = (req, res, next) => {
  if (!req.user || !req.user.institutionId) {
    res.status(403);
    return next(new Error('Forbidden — user is not assigned to an institution'));
  }
  
  // Note: For actual endpoints, you might also compare req.user.institutionId
  // with req.params.institutionId depending on the API design. 
  // For now, this simply ensures the admin HAS an institution bound.
  next();
};

module.exports = { protect, requireRole, requireInstitutionAccess };
