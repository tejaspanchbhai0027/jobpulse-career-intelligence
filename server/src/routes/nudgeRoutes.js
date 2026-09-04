const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { runFollowUpCheck } = require('../jobs/followUpJob');

// ── @route  POST /api/nudge/run ───────────────────────────────────────────────
// ── @desc   Manually trigger the follow-up check for the logged-in user
//            (great for demos and testing without waiting for the daily cron)
// ── @access Private
router.use(protect);
router.use(requireRole('STUDENT'));

router.post('/run', async (req, res, next) => {
  try {
    const result = await runFollowUpCheck(req.user.id);

    res.status(200).json({
      success: true,
      message: result.totalFlagged === 0
        ? 'No stale applications found — you\'re all caught up! ✅'
        : `${result.totalFlagged} application(s) flagged. ${result.totalEmailed > 0 ? 'Email sent!' : 'Set RESEND_API_KEY to enable email.'}`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// ── @route  GET /api/nudge/status ─────────────────────────────────────────────
// ── @desc   Get current follow-up status for the logged-in user
// ── @access Private
router.get('/status', async (req, res, next) => {
  try {
    const Application = require('../models/Application');
    const count = await Application.countDocuments({
      user: req.user.id,
      needsFollowUp: true,
    });
    res.status(200).json({ success: true, needsFollowUpCount: count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
