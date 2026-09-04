const express = require('express');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getPlatformMetrics, getInstitutions, createInstitution, createInstitutionAdmin, getInstitutionById, updateInstitutionStatus, getSystemSettings, sendTestEmailRoute } = require('../controllers/superAdminController');

const router = express.Router();

router.use(protect);
router.use(requireRole('SUPER_ADMIN'));

router.get('/dashboard/metrics', getPlatformMetrics);
router.route('/institutions')
  .get(getInstitutions)
  .post(createInstitution);

router.post('/institutions/:id/admin', createInstitutionAdmin);
router.get('/institutions/:id', getInstitutionById);
router.patch('/institutions/:id/status', updateInstitutionStatus);

router.get('/settings', getSystemSettings);
router.post('/settings/test-email', sendTestEmailRoute);

module.exports = router;
