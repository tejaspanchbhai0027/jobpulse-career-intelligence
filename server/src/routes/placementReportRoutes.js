const express = require('express');
const router = express.Router();
const { getReports } = require('../controllers/placementReportController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'));
router.use(requireInstitutionAccess);

// Since frontend wants Company-wise, Drive-wise, Department-wise, we can return all in one robust payload, 
// or have different endpoints. Let's do one endpoint that returns all report data for simplicity and performance.
router.get('/', getReports);

module.exports = router;
