const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/placementAuditController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'));
router.use(requireInstitutionAccess);

router.get('/', getAuditLogs);

module.exports = router;
