const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const readinessController = require('../controllers/readinessController');

// ── @route  GET /api/readiness ───────────────────────────────────────────────
// ── @desc   Get comprehensive career readiness metrics for the student
// ── @access Private (Student only)
router.get('/', protect, requireRole('STUDENT'), readinessController.getStudentReadiness);

module.exports = router;
