const express = require('express');
const router = express.Router();
const { getOpportunities, getOpportunity, trackOpportunity } = require('../controllers/opportunityController');
const { protect } = require('../middleware/authMiddleware');

// All opportunity routes require authentication
router.use(protect);

router.route('/')
  .get(getOpportunities);

router.route('/recommended')
  .get(require('../controllers/opportunityController').getRecommendedOpportunities);

router.route('/:id')
  .get(getOpportunity);

router.route('/:id/track')
  .post(trackOpportunity);

router.route('/:id/untrack')
  .delete(require('../controllers/opportunityController').untrackOpportunity);

module.exports = router;
