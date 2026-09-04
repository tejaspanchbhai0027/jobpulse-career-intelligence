const express = require('express');
const router = express.Router();
const { getInstitutionalIntelligence } = require('../controllers/adminIntelligenceController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'));
router.use(requireInstitutionAccess);

router.get('/', getInstitutionalIntelligence);

module.exports = router;
