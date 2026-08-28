const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { analyzeJD, matchResume, summarizeNotes, copilotChat } = require('../controllers/aiController');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const jdSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
});

const notesSchema = z.object({
  notes: z.string().min(5, 'Notes must be at least 5 characters'),
});

router.post('/analyze-jd', protect, validate(jdSchema), analyzeJD);
router.post('/match-resume', protect, validate(jdSchema), matchResume);
router.post('/summarize-notes', protect, validate(notesSchema), summarizeNotes);

module.exports = router;
