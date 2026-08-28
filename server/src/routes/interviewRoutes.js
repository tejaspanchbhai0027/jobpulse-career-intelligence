const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getInterviews, 
  getUpcomingInterviews, 
  createInterview, 
  updateInterview, 
  deleteInterview, 
  submitReflection, 
  getQuestionBank, 
  addQuestion 
} = require('../controllers/interviewController');

router.use(protect);

// @route  GET /api/interviews/upcoming
router.get('/upcoming', getUpcomingInterviews);

// @route  GET  /api/interviews          — all interviews (dashboard)
// @route  GET  /api/interviews?applicationId=:id  — filtered by application
// @route  POST /api/interviews
router.get('/', getInterviews);
router.post('/', createInterview);

// @route  PUT    /api/interviews/:id
// @route  DELETE /api/interviews/:id
router.put('/:id', updateInterview);
router.delete('/:id', deleteInterview);

// Phase E: Reflection and Question Bank
router.post('/:id/reflection', submitReflection);
router.get('/questions/bank', getQuestionBank);
router.post('/questions/bank', addQuestion);

module.exports = router;
