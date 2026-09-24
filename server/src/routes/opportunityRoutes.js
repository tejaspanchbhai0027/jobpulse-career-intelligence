const express = require('express');
const router = express.Router();
const { getOpportunities, getOpportunity, trackOpportunity } = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');

// All opportunity routes require authentication
router.use(protect);

router.route('/')
  .get(getOpportunities);

router.route('/:id')
  .get(getOpportunity);

router.route('/:id/track')
  .post(trackOpportunity);

module.exports = router;
