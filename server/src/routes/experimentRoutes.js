const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { 
  getExperiments, 
  getExperiment, 
  createExperiment, 
  assignApplication, 
  deleteExperiment 
} = require('../controllers/experimentController');

router.use(protect);
router.use(requireRole('STUDENT'));

router.route('/')
  .get(getExperiments)
  .post(createExperiment);

router.route('/:id')
  .get(getExperiment)
  .delete(deleteExperiment);

router.post('/:id/applications', assignApplication);

module.exports = router;
