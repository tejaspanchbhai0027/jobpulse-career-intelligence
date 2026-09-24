const express = require('express');
const router = express.Router();
const { 
  getDashboardMetrics,
  getApplications,
  getInterviews,
  getInterventions,
  getAnalytics,
  queryCopilot,
  createIntervention,
  updateIntervention,
  getNotes,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/mentorController');
const { getStudents, getStudentById } = require('../controllers/adminStudentController');
const { getStudentOverview, getStudentActivityTimeline } = require('../controllers/mentorStudentController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');
const { createRecommendation, getMentorRecommendations, updateRecommendationStatus } = require('../controllers/mentorRecommendationController');

router.use(protect);
router.use(requireRole('MENTOR'));
router.use(requireInstitutionAccess);

// @route   GET /api/mentor/dashboard
router.get('/dashboard', getDashboardMetrics);

// @route   GET /api/mentor/students
router.get('/students', getStudents);

// @route   GET /api/mentor/students/:id
router.get('/students/:id', getStudentById);

// @route   GET /api/mentor/students/:studentId/overview
router.get('/students/:studentId/overview', getStudentOverview);

// @route   GET /api/mentor/students/:studentId/activity
router.get('/students/:studentId/activity', getStudentActivityTimeline);

// @route   GET /api/mentor/applications
router.get('/applications', getApplications);

// @route   GET /api/mentor/interviews
router.get('/interviews', getInterviews);

// @route   GET /api/mentor/interventions
router.get('/interventions', getInterventions);

// @route   POST /api/mentor/interventions
router.post('/interventions', createIntervention);

// @route   PATCH /api/mentor/interventions/:id
router.patch('/interventions/:id', updateIntervention);

// @route   GET /api/mentor/analytics
router.get('/analytics', getAnalytics);



// Existing Recommendation endpoints
// @route   POST /api/mentor/students/:studentId/recommendations
router.post('/students/:studentId/recommendations', createRecommendation);

// @route   GET /api/mentor/students/:studentId/recommendations
router.get('/students/:studentId/recommendations', getMentorRecommendations);

// @route   PATCH /api/mentor/recommendations/:id/status
router.patch('/recommendations/:id/status', updateRecommendationStatus);

// @route   POST /api/mentor/intelligence/copilot
router.post('/intelligence/copilot', queryCopilot);

// ── Mentorship Notes ─────────────────────────────────────────
// @route   GET /api/mentor/notes
router.get('/notes', getNotes);

// @route   POST /api/mentor/notes
router.post('/notes', createNote);

// @route   PUT /api/mentor/notes/:id
router.put('/notes/:id', updateNote);

// @route   DELETE /api/mentor/notes/:id
router.delete('/notes/:id', deleteNote);

module.exports = router;
