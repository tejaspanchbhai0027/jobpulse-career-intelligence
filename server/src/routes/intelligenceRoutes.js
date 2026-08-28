const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getOverview, getDNA, getDiagnosis, getOpportunities, getResumePerformance, getForecast, getInterviewPrep, getJdEvolution, getRecruiterNetwork, getMarketIntelligence, getCareerTwin, getStrategyAutopilot } = require('../controllers/intelligenceController');

router.use(protect);

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

module.exports = router;
