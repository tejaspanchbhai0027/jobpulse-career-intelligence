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

module.exports = { protect };
