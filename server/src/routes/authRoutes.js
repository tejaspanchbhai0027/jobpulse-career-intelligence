const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const { register, login, logout, getMe, updateSettings } = require('../controllers/authController');
const { protect }        = require('../middleware/authMiddleware');
const { validate }       = require('../middleware/validate');
const { registerSchema, loginSchema, updateSettingsSchema } = require('../validators/schemas');

// ── Auth-specific rate limiter ─────────────────────────────────────────────────
// Much stricter than the global limiter: 15 attempts per 15 minutes per IP.
// Protects against brute-force login and registration flooding.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // Only count failed attempts against the limit
});

// @route  POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), register);

// @route  POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), login);

// @route  POST /api/auth/logout
router.post('/logout', protect, logout);

// @route  GET  /api/auth/me
router.get('/me', protect, getMe);

// @route  PATCH /api/auth/settings
router.patch('/settings', protect, validate(updateSettingsSchema), updateSettings);

module.exports = router;
