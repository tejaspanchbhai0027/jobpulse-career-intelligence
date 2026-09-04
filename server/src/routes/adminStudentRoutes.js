const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, assignMentor, bulkAssignMentor, createFeedback, getFeedback } = require('../controllers/adminStudentController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'MENTOR'));
router.use(requireInstitutionAccess);

router.get('/', getStudents);
router.post('/bulk-assignment', requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'), bulkAssignMentor);
router.get('/:id', getStudentById);
router.patch('/:id/mentor', requireRole('PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'), assignMentor);
router.post('/:id/feedback', createFeedback);
router.get('/:id/feedback', getFeedback);

module.exports = router;
