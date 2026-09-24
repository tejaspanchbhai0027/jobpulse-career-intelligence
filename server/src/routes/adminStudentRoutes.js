const express = require('express');
const router = express.Router();
const { 
  getStudents, 
  getStudentById, 
  assignMentor, 
  bulkAssignMentor, 
  createFeedback, 
  getFeedback,
  createStudent,
  updateStudent,
  deactivateStudent 
} = require('../controllers/adminStudentController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'MENTOR'));
router.use(requireInstitutionAccess);

router.route('/')
  .get(getStudents)
  .post(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'), createStudent);

router.post('/bulk-assignment', requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'), bulkAssignMentor);

router.route('/:id')
  .get(getStudentById)
  .patch(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'), updateStudent)
  .delete(requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'), deactivateStudent);

router.patch('/:id/mentor', requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'), assignMentor);
router.post('/:id/feedback', createFeedback);
router.get('/:id/feedback', getFeedback);

module.exports = router;
