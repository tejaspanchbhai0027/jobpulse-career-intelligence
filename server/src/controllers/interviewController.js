const asyncHandler = require('express-async-handler');
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const InterviewQuestion = require('../models/InterviewQuestion');

// ── Helper: verify the application belongs to this user ──────────────────────
const verifyAppOwnership = async (appId, userId) => {
  const app = await Application.findOne({ _id: appId, user: userId });
  return app; // null if not found or doesn't belong to user
};

// ── @route  GET /api/interviews?applicationId=:id ─────────────────────────────
// ── @desc   Get all interviews for a specific application (or all if no filter)
// ── @access Private
const getInterviews = async (req, res, next) => {
  try {
    const { applicationId } = req.query;

    if (applicationId) {
      const app = await verifyAppOwnership(applicationId, req.user.id);
      if (!app) {
        res.status(404);
        return next(new Error('Application not found'));
      }
      const interviews = await Interview
        .find({ application: applicationId, user: req.user.id })
        .sort({ scheduledAt: 1 });
      return res.status(200).json({ success: true, count: interviews.length, data: interviews });
    }

    // No applicationId — return all interviews for this user (for dashboard)
    const interviews = await Interview
      .find({ user: req.user.id })
      .populate('application', 'company role status')
      .sort({ scheduledAt: 1 });
    return res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/interviews/upcoming ─────────────────────────────────────
// ── @desc   Get upcoming interviews in the next 14 days
// ── @access Private
const getUpcomingInterviews = async (req, res, next) => {
  try {
    const now      = new Date();
    const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const interviews = await Interview
      .find({
        user:        req.user.id,
        scheduledAt: { $gte: now, $lte: in14Days },
        result:      { $in: ['Scheduled', 'Rescheduled'] },
      })
      .populate('application', 'company role status')
      .sort({ scheduledAt: 1 })
      .limit(10);

    res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/interviews ──────────────────────────────────────────────
// ── @desc   Create a new interview for an application
// ── @access Private
const createInterview = async (req, res, next) => {
  try {
    const { applicationId, round, interviewType, scheduledAt, interviewerName, interviewerEmail, meetingUrl, notes } = req.body;

    if (!applicationId || !scheduledAt) {
      res.status(400);
      return next(new Error('applicationId and scheduledAt are required'));
    }

    // Verify the application belongs to this user
    const app = await verifyAppOwnership(applicationId, req.user.id);
    if (!app) {
      res.status(404);
      return next(new Error('Application not found'));
    }

    const interview = await Interview.create({
      user:             req.user.id,
      application:      applicationId,
      round:            round            || 1,
      interviewType:    interviewType    || 'Video',
      scheduledAt,
      interviewerName:  interviewerName  || '',
      interviewerEmail: interviewerEmail || '',
      meetingUrl:       meetingUrl       || '',
      notes:            notes            || '',
      result:           'Scheduled',
    });

    // Auto-advance application to Interview status if still in early stages
    if (['Applied', 'Assessment', 'Wishlist'].includes(app.status)) {
      await Application.findByIdAndUpdate(app._id, {
        status:          'Interview',
        needsFollowUp:   false,
        followUpNotified:false,
      });
    }

    res.status(201).json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/interviews/:id ───────────────────────────────────────────
// ── @desc   Update an interview (reschedule, add result, notes)
// ── @access Private
const updateInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user.id });
    if (!interview) {
      res.status(404);
      return next(new Error('Interview not found'));
    }

    const allowed = ['round', 'interviewType', 'scheduledAt', 'interviewerName', 'interviewerEmail', 'meetingUrl', 'notes', 'result'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) interview[field] = req.body[field];
    });

    await interview.save();
    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/interviews/:id ────────────────────────────────────────
// ── @desc   Delete an interview
// ── @access Private
const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    res.status(404);
    throw new Error('Interview not found');
  }

  // Ensure user owns this interview
  if (interview.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  await interview.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Submit Post-Interview Reflection
// @route   POST /api/interviews/:id/reflection
// @access  Private
const submitReflection = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    res.status(404);
    throw new Error('Interview not found');
  }
  if (interview.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const { confidence, topicsAsked, wentWell, wasDifficult, wouldChange } = req.body;

  interview.reflection = {
    completed: true,
    confidence: confidence || interview.reflection.confidence,
    topicsAsked: topicsAsked || interview.reflection.topicsAsked,
    wentWell: wentWell || interview.reflection.wentWell,
    wasDifficult: wasDifficult || interview.reflection.wasDifficult,
    wouldChange: wouldChange || interview.reflection.wouldChange
  };

  await interview.save();
  res.status(200).json({ success: true, data: interview });
});

// @desc    Get Question Bank
// @route   GET /api/interviews/questions/bank
// @access  Private
const getQuestionBank = asyncHandler(async (req, res) => {
  const questions = await InterviewQuestion.find({ user: req.user._id }).populate('interview', 'interviewType scheduledAt application');
  res.status(200).json({ success: true, data: questions });
});

// @desc    Add Question to Bank
// @route   POST /api/interviews/questions/bank
// @access  Private
const addQuestion = asyncHandler(async (req, res) => {
  // Support both single question object and an array of questions
  const payload = Array.isArray(req.body) ? req.body : [req.body];
  
  const createdQuestions = [];

  for (const item of payload) {
    const { question, topic, difficulty, myAnswer, betterAnswer, interviewId } = item;
    if (!question) continue; // skip invalid

    const newQuestion = await InterviewQuestion.create({
      user: req.user._id,
      question,
      topic,
      difficulty,
      myAnswer,
      betterAnswer,
      interview: interviewId || null
    });
    createdQuestions.push(newQuestion);
  }

  res.status(201).json({ 
    success: true, 
    data: Array.isArray(req.body) ? createdQuestions : createdQuestions[0] 
  });
});

// @desc    Update Interview Preparation
// @route   PUT /api/interviews/:id/preparation
// @access  Private
const updateInterviewPreparation = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
  
  if (!interview) {
    res.status(404);
    throw new Error('Interview not found');
  }

  const { notes, checklist, questions, topics } = req.body;
  
  if (!interview.preparation) {
    interview.preparation = {};
  }
  
  if (notes !== undefined) interview.preparation.notes = notes;
  if (checklist !== undefined) interview.preparation.checklist = checklist;
  if (questions !== undefined) interview.preparation.questions = questions;
  if (topics !== undefined) interview.preparation.topics = topics;

  await interview.save();
  res.status(200).json({ success: true, data: interview });
});

// @desc    Generate Interview Prep Kit (AI)
// @route   POST /api/interviews/:id/generate-prep
// @access  Private
const generateInterviewPrepKit = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id }).populate('application');
  
  if (!interview) {
    res.status(404);
    throw new Error('Interview not found');
  }
  
  if (!interview.application || !interview.application.jobDescription) {
    res.status(400);
    throw new Error('Associated application does not have a job description to analyze.');
  }

  const { generateInterviewPrep } = require('../services/aiService');
  const prepData = await generateInterviewPrep(interview.application.jobDescription, interview.application.role);

  // Merge generated data safely
  if (!interview.preparation) interview.preparation = {};
  
  // Merge checklist without overwriting existing checked items
  const existingChecklistTexts = new Set(interview.preparation.checklist?.map(c => c.text) || []);
  const newChecklist = [...(interview.preparation.checklist || [])];
  prepData.checklist.forEach(item => {
    if (!existingChecklistTexts.has(item.text)) {
      newChecklist.push(item);
    }
  });
  
  interview.preparation.checklist = newChecklist;
  interview.preparation.questions = Array.from(new Set([...(interview.preparation.questions || []), ...prepData.questions]));
  interview.preparation.topics = Array.from(new Set([...(interview.preparation.topics || []), ...prepData.topics]));

  await interview.save();
  res.status(200).json({ success: true, data: interview.preparation });
});

module.exports = {
  getInterviews,
  getUpcomingInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  submitReflection,
  getQuestionBank,
  addQuestion,
  updateInterviewPreparation,
  generateInterviewPrepKit,
};
