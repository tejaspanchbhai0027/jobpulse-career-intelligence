const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const placementUpdatesController = require('../controllers/placementUpdatesController');

// All routes are protected and restricted to STUDENT role
router.use(protect);
router.use(requireRole('STUDENT'));

router.get('/', placementUpdatesController.getPlacementUpdates);

module.exports = router;
