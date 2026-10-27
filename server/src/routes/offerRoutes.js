const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, requireRole } = require('../middleware/authMiddleware');
const offerController = require('../controllers/offerController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../storage/offers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// All routes require authentication
router.use(protect);

// Student routes
router.post('/student', requireRole('STUDENT'), upload.single('proofFile'), offerController.createOfferClaim);
router.get('/student', requireRole('STUDENT'), offerController.getStudentOffers);
router.get('/student/:id', requireRole('STUDENT'), offerController.getStudentOfferById);

// Mentor routes
router.get('/mentor/pending', requireRole('MENTOR'), offerController.getMentorPendingOffers);
router.get('/mentor/:id', requireRole('MENTOR'), offerController.getMentorOfferById);
router.patch('/mentor/:id/approve', requireRole('MENTOR'), offerController.approveOffer);
router.patch('/mentor/:id/reject', requireRole('MENTOR'), offerController.rejectOffer);

// Officer routes
router.get('/officer/pending', requireRole('PLACEMENT_OFFICER'), offerController.getOfficerPendingOffers);
router.get('/officer/verified', requireRole('PLACEMENT_OFFICER'), offerController.getOfficerVerifiedOffers);
router.patch('/officer/:id/approve', requireRole('PLACEMENT_OFFICER'), offerController.approveOffer);
router.patch('/officer/:id/reject', requireRole('PLACEMENT_OFFICER'), offerController.rejectOffer);

// Download/View offer proof
router.get('/:id/proof', offerController.downloadProof);

module.exports = router;
