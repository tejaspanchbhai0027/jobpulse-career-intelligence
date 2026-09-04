const express = require('express');
const router = express.Router();
const {
  getOfficers,
  inviteOfficer,
  updateOfficer,
  removeOfficer,
  getOrganizationHierarchy,
  getOfficerById
} = require('../controllers/adminOfficerController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('INSTITUTION_ADMIN'));
router.use(requireInstitutionAccess);

router.route('/')
  .get(getOfficers)
  .post(inviteOfficer);

router.get('/organization', getOrganizationHierarchy);

router.route('/:id')
  .get(getOfficerById)
  .patch(updateOfficer)
  .delete(removeOfficer);

module.exports = router;
