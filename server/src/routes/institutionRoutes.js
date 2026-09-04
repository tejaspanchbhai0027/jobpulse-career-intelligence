const express = require('express');
const router = express.Router();
const { getMyInstitution, updateMyInstitution } = require('../controllers/institutionController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

// Base middleware for all institution routes:
// 1. Must be logged in (protect)
// 2. Must have a valid institution bound to their account (requireInstitutionAccess)
// 3. Must be an admin type (we allow PLACEMENT_OFFICER, INSTITUTION_ADMIN, SUPER_ADMIN to read)
router.use(protect);
router.use(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'));
router.use(requireInstitutionAccess);

// ── GET: Read institution profile (All admin types)
router.get('/me', getMyInstitution);

// ── PUT: Update institution profile (Only INSTITUTION_ADMIN or SUPER_ADMIN)
router.put('/me', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'), updateMyInstitution);

module.exports = router;
