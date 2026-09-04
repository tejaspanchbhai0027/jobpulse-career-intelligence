const express = require('express');
const router = express.Router();
const { getInterventions, updateInterventionStatus } = require('../controllers/adminInterventionController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'MENTOR'));
router.use(requireInstitutionAccess);

router.get('/', getInterventions);
router.patch('/:id/status', updateInterventionStatus);

module.exports = router;
