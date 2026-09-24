const express    = require('express');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const { register, login, logout, getMe, updateSettings, deleteAccount, validateInstitutionCode, getPlacementOfficers, getMentors, forgotPassword, resetPassword, connectInstitution, sendVerificationEmail, verifyEmail } = require('../controllers/authController');
const { protect }        = require('../middleware/authMiddleware');
const { validate }       = require('../middleware/validate');
const { registerSchema, loginSchema, updateSettingsSchema } = require('../validators/schemas');

// ── Auth-specific rate limiter ─────────────────────────────────────────────────
// Much stricter than the global limiter: 15 attempts per 15 minutes per IP.
// Protects against brute-force login and registration flooding.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 15,
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

// @route  POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, forgotPassword);

// @route  PUT /api/auth/reset-password/:token
router.put('/reset-password/:token', authLimiter, resetPassword);

// @route  POST /api/auth/send-verification
router.post('/send-verification', protect, authLimiter, sendVerificationEmail);

// @route  POST /api/auth/verify-email
router.post('/verify-email', authLimiter, verifyEmail);

// @route  POST /api/auth/connect-institution
router.post('/connect-institution', protect, connectInstitution);

// @route  GET  /api/auth/me
router.get('/me', protect, getMe);

// @route  PATCH /api/auth/settings
router.patch('/settings', protect, validate(updateSettingsSchema), updateSettings);

// @route  DELETE /api/auth/me
router.delete('/me', protect, deleteAccount);

// @route  GET /api/auth/institutions/validate
router.get('/institutions/validate', validateInstitutionCode);

// @route  GET /api/auth/institutions/:institutionId/placement-officers
router.get('/institutions/:institutionId/placement-officers', getPlacementOfficers);

// @route  GET /api/auth/placement-officers/:officerId/mentors
router.get('/placement-officers/:officerId/mentors', getMentors);

module.exports = router;
