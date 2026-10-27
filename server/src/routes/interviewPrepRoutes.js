const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getUpcomingPrep,
  getInterviewPrepContext,
  generateQuestions,
  startMockInterview,
  submitAnswer,
  completeMockSession,
  getHistory,
  getIntroduction
} = require('../controllers/interviewPrepController');

// All prep routes are student only
router.use(protect);
router.use(requireRole('STUDENT'));

router.get('/upcoming', getUpcomingPrep);
router.get('/history', getHistory);
router.post('/questions', generateQuestions);
router.post('/mock/start', startMockInterview);
router.post('/mock/:sessionId/answer', submitAnswer);
router.post('/mock/:sessionId/complete', completeMockSession);
router.post('/introduction', getIntroduction);
router.get('/:id', getInterviewPrepContext); // Keep this at the bottom due to :id parameter

module.exports = router;
