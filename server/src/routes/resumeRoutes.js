const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getResumes,
  uploadResume,
  getResume,
  setDefaultResume,
  renameResume,
  deleteResume
} = require('../controllers/resumeController');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../storage/resumes');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (PDF only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.use(protect);
router.use(requireRole('STUDENT'));

router.route('/')
  .get(getResumes)
  .post(upload.single('resume'), uploadResume);

router.route('/:id')
  .get(getResume)
  .patch(renameResume)
  .delete(deleteResume);

router.patch('/:id/default', setDefaultResume);

module.exports = router;
