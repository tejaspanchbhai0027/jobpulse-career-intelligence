const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getOverview, getDNA, getDiagnosis, getOpportunities, getResumePerformance, getForecast, getInterviewPrep, getJdEvolution, getRecruiterNetwork, getMarketIntelligence, getCareerTwin, getStrategyAutopilot, submitRecommendationFeedback, getKnowledgeGraph } = require('../controllers/intelligenceController');

router.use(protect);
router.use(requireRole('STUDENT'));

router.get('/overview', getOverview);
router.get('/dna', getDNA);
router.get('/diagnosis', getDiagnosis);
router.get('/opportunities', getOpportunities);
router.get('/resume-performance', getResumePerformance);
router.get('/forecast', getForecast);
router.get('/interview-prep/:id', getInterviewPrep);
router.get('/jd-evolution/:id', getJdEvolution);
router.get('/recruiter-network', getRecruiterNetwork);
router.get('/market', getMarketIntelligence);
router.get('/twin', getCareerTwin);
router.get('/autopilot', getStrategyAutopilot);
router.get('/knowledge-graph', getKnowledgeGraph);
router.post('/recommendations/:id/feedback', submitRecommendationFeedback);

module.exports = router;
