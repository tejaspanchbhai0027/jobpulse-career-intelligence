const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getMentors } = require('../controllers/adminMentorController');

router.use(protect);
router.use(requireRole('INSTITUTION_ADMIN'));

router.get('/', getMentors);

module.exports = router;
