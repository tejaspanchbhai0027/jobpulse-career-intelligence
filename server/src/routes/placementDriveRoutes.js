const express = require('express');
const router = express.Router();
const {
  createDrive,
  getDrives,
  getDriveById,
  updateDrive,
  updateDriveStatus,
  getAvailableDrives,
  registerForDrive,
  getDriveStatistics,
  deleteDrive
} = require('../controllers/placementDriveController');
const { protect, requireRole, requireInstitutionAccess } = require('../middleware/authMiddleware');

// ── Protect all routes ───────────────────────────────────────────────────────
router.use(protect);
router.use(requireInstitutionAccess);

// ── Student Routes ───────────────────────────────────────────────────────────
// Students can fetch available drives (filtered by eligibility) and register
router.get('/available', requireRole('STUDENT'), getAvailableDrives);
router.post('/:id/register', requireRole('STUDENT'), registerForDrive);

// ── Shared GET Routes ────────────────────────────────────────────────────────
// Admin, PO, and Mentor can view listing and details
router.get('/', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER', 'MENTOR'), getDrives);
router.get('/:id/statistics', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER'), getDriveStatistics);
router.get('/:id', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER', 'MENTOR', 'STUDENT'), getDriveById);

// ── Admin & PO Write Routes ──────────────────────────────────────────────────
// Only Admin can create a new drive
router.post('/', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'), createDrive);

// Admin and the Assigned PO can update drive details & status
router.patch('/:id', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER'), updateDrive);
router.patch('/:id/status', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN', 'PLACEMENT_OFFICER'), updateDriveStatus);
router.delete('/:id', requireRole('INSTITUTION_ADMIN', 'SUPER_ADMIN'), deleteDrive);

module.exports = router;
