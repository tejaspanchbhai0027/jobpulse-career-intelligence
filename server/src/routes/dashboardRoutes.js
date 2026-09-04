const express    = require('express');
const router     = require('express').Router();
const mongoose   = require('mongoose');
const { protect, requireRole } = require('../middleware/authMiddleware');
const Application = require('../models/Application');
const Interview   = require('../models/Interview');
const MentorFeedback = require('../models/MentorFeedback');
const { getStudentRecommendations, studentUpdateRecommendationStatus } = require('../controllers/mentorRecommendationController');

// ── @route  GET /api/dashboard/stats ─────────────────────────────────────────
// ── @desc   Return aggregated analytics for the authenticated user
// ── @access Private
router.use(protect);
router.use(requireRole('STUDENT'));

router.get('/stats', async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // ── 1. Status breakdown ──────────────────────────────────────────────────
    const statusAgg = await Application.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const STATUS_LABELS = ['Wishlist', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];
    const byStatus = {};
    STATUS_LABELS.forEach(s => (byStatus[s] = 0));
    statusAgg.forEach(({ _id, count }) => {
      if (byStatus[_id] !== undefined) byStatus[_id] = count;
    });

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    // ── 2. Applications over time (last 12 months) ───────────────────────────
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await Application.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill in zero-count months so the chart has a continuous x-axis
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const byMonth = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed
      const found = monthlyAgg.find(m => m._id.year === year && m._id.month === month);
      byMonth.push({
        label: `${MONTH_NAMES[month - 1]} '${String(year).slice(2)}`,
        count: found ? found.count : 0,
        year,
        month,
      });
    }

    // ── 3. Computed rates ────────────────────────────────────────────────────
    const applied    = byStatus['Applied'] + byStatus['Assessment'] + byStatus['Interview'] + byStatus['Offer'] + byStatus['Rejected'];
    const progressed = byStatus['Interview'] + byStatus['Offer'];
    const offers     = byStatus['Offer'];

    const responseRate    = applied > 0 ? Math.round((progressed / applied) * 100) : 0;
    const interviewRate   = applied > 0 ? Math.round((byStatus['Interview'] / applied) * 100) : 0;
    const offerRate       = applied > 0 ? Math.round((offers / applied) * 100) : 0;

    // ── 4. Follow-up & pipeline ──────────────────────────────────────────────
    const followUpCount = await Application.countDocuments({ user: userId, needsFollowUp: true });
    const activeCount   = total - byStatus['Rejected'] - byStatus['Offer'];

    // ── 5. Source breakdown ──────────────────────────────────────────────────
    const sourceAgg = await Application.aggregate([
      { $match: { user: userId, source: { $exists: true, $ne: '' } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const bySource = sourceAgg.map(({ _id, count }) => ({ source: _id, count }));

    // ── 6. Ghost count & avg days-to-response & market benchmark ───────────────
    const ghostedCount = await Application.countDocuments({ user: userId, isGhosted: true });

    const MARKET_MEDIAN_DAYS_TO_OFFER = 108;

    // Avg days from dateApplied to today for apps still in "Applied" (rough proxy for response time)
    const avgDaysAgg = await Application.aggregate([
      { $match: { user: userId, status: { $in: ['Interview', 'Assessment', 'Offer'] } } },
      {
        $project: {
          daysToResponse: {
            $divide: [
              { $subtract: [new Date(), '$dateApplied'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$daysToResponse' } } },
    ]);
    const avgDaysToResponse = avgDaysAgg.length > 0 ? Math.round(avgDaysAgg[0].avg) : null;

    // ── 7. Interview stats ─────────────────────────────────────────────────
    const totalInterviews = await Interview.countDocuments({ user: userId });

    const now14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const upcomingInterviewCount = await Interview.countDocuments({
      user:        userId,
      scheduledAt: { $gte: new Date(), $lte: now14 },
      result:      { $in: ['Scheduled', 'Rescheduled'] },
    });

    // Avg days from dateApplied to first Interview-status-change
    const avgDaysToInterviewAgg = await Application.aggregate([
      { $match: { user: userId, status: { $in: ['Interview', 'Offer'] } } },
      {
        $project: {
          days: {
            $divide: [
              { $subtract: ['$updatedAt', '$dateApplied'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$days' } } },
    ]);
    const avgDaysToInterview = avgDaysToInterviewAgg.length > 0
      ? Math.round(avgDaysToInterviewAgg[0].avg) : null;

    // Avg days from dateApplied to Offer
    const avgDaysToOfferAgg = await Application.aggregate([
      { $match: { user: userId, status: 'Offer' } },
      {
        $project: {
          days: {
            $divide: [
              { $subtract: ['$updatedAt', '$dateApplied'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$days' } } },
    ]);
    const avgDaysToOffer = avgDaysToOfferAgg.length > 0
      ? Math.round(avgDaysToOfferAgg[0].avg) : null;

    // ── 8. Per-source conversion breakdown ──────────────────────────────
    const sourceConversionAgg = await Application.aggregate([
      { $match: { user: userId, source: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id:       '$source',
          total:     { $sum: 1 },
          responses: { $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer', 'Rejected']] }, 1, 0] } },
          interviews:{ $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] } },
          offers:    { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);
    const sourceConversion = sourceConversionAgg.map(s => ({
      source:       s._id,
      total:        s.total,
      responses:    s.responses,
      interviews:   s.interviews,
      offers:       s.offers,
      responseRate: s.total > 0 ? Math.round((s.responses / s.total) * 100) : 0,
      offerRate:    s.total > 0 ? Math.round((s.offers    / s.total) * 100) : 0,
    }));

    // ── 9. Weekly activity (last 7 days) ──────────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyApps = await Application.countDocuments({ user: userId, createdAt: { $gte: sevenDaysAgo } });
    const weeklyInterviews = await Interview.countDocuments({ user: userId, scheduledAt: { $gte: sevenDaysAgo } });
    const weeklyOffers = await Application.countDocuments({ user: userId, status: 'Offer', updatedAt: { $gte: sevenDaysAgo } });

    res.status(200).json({
      success: true,
      stats: {
        total,
        byStatus,
        byMonth,
        responseRate,
        interviewRate,
        offerRate,
        followUpCount,
        activeCount,
        bySource,
        ghostedCount,
        avgDaysToResponse,
        marketBenchmarkDays: MARKET_MEDIAN_DAYS_TO_OFFER,
        // New interview stats
        totalInterviews,
        upcomingInterviewCount,
        avgDaysToInterview,
        avgDaysToOffer,
        sourceConversion,
        weekly: {
          applications: weeklyApps,
          interviews:   weeklyInterviews,
          offers:       weeklyOffers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── @route  GET /api/dashboard/feedback ──────────────────────────────────────
// ── @desc   Return mentor feedback for the student
// ── @access Private
router.get('/feedback', async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const query = { studentId: userId };
    if (req.query.applicationId) {
      query.applicationId = req.query.applicationId;
    }

    const feedback = await MentorFeedback.find(query)
      .populate('mentorId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: feedback });
  } catch (err) {
    next(err);
  }
});

// ── @route  GET /api/dashboard/recommendations ───────────────────────────────
// ── @desc   Return support recommendations for the authenticated student
// ── @access Private
router.get('/recommendations', getStudentRecommendations);

// ── @route  PATCH /api/dashboard/recommendations/:id/status ──────────────────
// ── @desc   Update status of a recommendation by student
// ── @access Private
router.patch('/recommendations/:id/status', studentUpdateRecommendationStatus);

module.exports = router;
