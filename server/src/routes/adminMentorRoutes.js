const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getMentors, createMentor, updateMentor, deactivateMentor } = require('../controllers/adminMentorController');

router.use(protect);
router.use(requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'));

router.route('/')
  .get(getMentors)
  .post(createMentor);

router.route('/:id')
  .patch(updateMentor)
  .delete(deactivateMentor);

module.exports = router;
