const express = require('express');
const router = express.Router();
const { getAnalytics, exportAnalytics } = require('../controllers/adminAnalyticsController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'MENTOR'));
router.use(requireInstitutionAccess);

router.get('/', getAnalytics);
router.get('/export', exportAnalytics);

module.exports = router;
