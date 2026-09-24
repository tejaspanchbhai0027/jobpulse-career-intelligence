const express = require('express');
const router = express.Router();
const { getVerificationAlerts } = require('../controllers/placementVerificationController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'));
router.use(requireInstitutionAccess);

router.get('/', getVerificationAlerts);

module.exports = router;
