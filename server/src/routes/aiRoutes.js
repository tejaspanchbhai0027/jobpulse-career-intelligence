const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { analyzeJD, matchResume, summarizeNotes, copilotChat, analyzeInterviewTranscript } = require('../controllers/aiController');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const jdSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
});

const notesSchema = z.object({
  notes: z.string().min(5, 'Notes must be at least 5 characters'),
});

const transcriptSchema = z.object({
  transcript: z.string().min(10, 'Transcript must be at least 10 characters'),
});

router.use(protect);
router.use(requireRole('STUDENT'));

router.post('/analyze-jd', validate(jdSchema), analyzeJD);
router.post('/match-resume', validate(jdSchema), matchResume);
router.post('/summarize-notes', validate(notesSchema), summarizeNotes);
router.post('/copilot', copilotChat);
router.post('/analyze-transcript', validate(transcriptSchema), analyzeInterviewTranscript);

module.exports = router;
