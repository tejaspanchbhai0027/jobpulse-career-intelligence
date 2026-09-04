const express = require('express');
const router = express.Router();
const { 
  getDashboardMetrics, 
  getMentors, 
  getMentorById,
  createMentor,
  getInterviews,
  getApplications,
  getInterventions,
  getAnalytics,
  queryCopilot
} = require('../controllers/officerController');
const { getStudents, getStudentById, assignMentor } = require('../controllers/adminStudentController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('PLACEMENT_OFFICER'));
router.use(requireInstitutionAccess);

// ── @route   GET /api/officer/dashboard
router.get('/dashboard', getDashboardMetrics);

// ── @route   GET /api/officer/mentors
router.get('/mentors', getMentors);

// ── @route   POST /api/officer/mentors
router.post('/mentors', createMentor);

// ── @route   GET /api/officer/mentors/:id
router.get('/mentors/:id', getMentorById);

// ── @route   GET /api/officer/students
// Reusing adminStudentController which correctly handles institution-scoping and privacy scrubbing
router.get('/students', getStudents);

// ── @route   GET /api/officer/students/:id
// Reusing adminStudentController which correctly handles privacy scrubbing
router.get('/students/:id', getStudentById);

// ── @route   PATCH /api/officer/students/:id/mentor
// Allow placement officers to assign mentors to students
router.patch('/students/:id/mentor', assignMentor);

// ── @route   GET /api/officer/applications
router.get('/applications', getApplications);

// ── @route   GET /api/officer/interviews
router.get('/interviews', getInterviews);

// ── @route   GET /api/officer/interventions
router.get('/interventions', getInterventions);

// ── @route   GET /api/officer/analytics
router.get('/analytics', getAnalytics);

// ── @route   POST /api/officer/intelligence/copilot
router.post('/intelligence/copilot', queryCopilot);

module.exports = router;
