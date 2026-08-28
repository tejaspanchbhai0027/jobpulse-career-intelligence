const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validate, validateQuery } = require('../middleware/validate');
const {
  createApplicationSchema,
  updateApplicationSchema,
  exportSchema,
} = require('../validators/schemas');
const {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationsNeedingFollowUp,
  exportApplications,
  getApplicationTimeline,
} = require('../controllers/applicationController');

// IMPORTANT: specific named routes must be declared BEFORE /:id to avoid param collision

// @route  GET /api/applications/needs-followup
router.get('/needs-followup', protect, getApplicationsNeedingFollowUp);

// @route  GET /api/applications/export?format=csv|json
router.get('/export', protect, validateQuery(exportSchema), exportApplications);

// @route  GET    /api/applications
// @route  POST   /api/applications
router
  .route('/')
  .get(protect, getApplications)
  .post(protect, validate(createApplicationSchema), createApplication);

// @route  PUT    /api/applications/:id
// @route  DELETE /api/applications/:id
router
  .route('/:id')
  .put(protect, validate(updateApplicationSchema), updateApplication)
  .delete(protect, deleteApplication);

// @route  GET    /api/applications/:id/timeline
router.get('/:id/timeline', protect, getApplicationTimeline);

module.exports = router;
