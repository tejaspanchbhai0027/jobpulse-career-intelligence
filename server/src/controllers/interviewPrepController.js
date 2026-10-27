const asyncHandler = require('express-async-handler');
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const InterviewPracticeSession = require('../models/InterviewPracticeSession');
const { generatePracticeQuestions, evaluateInterviewAnswer, generateIntroduction } = require('../services/aiService');

// ── Context Builder Helper ───────────────────────────────────────────────────
const buildPrepContext = async (studentId, interviewId, applicationId) => {
  let context = { role: 'General Software Engineer' };
  
  if (interviewId) {
    const interview = await Interview.findOne({ _id: interviewId, user: studentId }).populate('application');
    if (interview) {
      context.interviewStage = interview.interviewType;
      context.role = interview.application?.role || context.role;
      context.company = interview.application?.company;
      context.jobDescription = interview.application?.jobDescription;
    }
  } else if (applicationId) {
    const application = await Application.findOne({ _id: applicationId, user: studentId });
    if (application) {
      context.role = application.role;
      context.company = application.company;
      context.jobDescription = application.jobDescription;
    }
  }

  // Add primary resume info
  const resume = await Resume.findOne({ studentId, isPrimary: true });
  if (resume) {
    context.skills = resume.extractedSkills || resume.skills || [];
    context.projects = resume.projects || [];
    context.experience = resume.experience || [];
    context.education = resume.education || [];
  }

  return context;
};

// @desc    Get upcoming interviews with preparation data
// @route   GET /api/student/interview-prep/upcoming
// @access  Private
const getUpcomingPrep = asyncHandler(async (req, res) => {
  const now = new Date();
  const interviews = await Interview.find({
    user: req.user._id,
    scheduledAt: { $gte: now },
    result: { $in: ['Scheduled', 'Rescheduled'] }
  })
  .populate('application', 'company role status')
  .sort({ scheduledAt: 1 })
  .limit(10);

  // Map to include preparation progress summary
  const data = interviews.map(i => {
    let checkedCount = 0;
    let totalChecklist = 0;
    if (i.preparation && i.preparation.checklist) {
      totalChecklist = i.preparation.checklist.length;
      checkedCount = i.preparation.checklist.filter(c => c.completed).length;
    }
    const progress = totalChecklist === 0 ? 0 : Math.round((checkedCount / totalChecklist) * 100);

    return {
      _id: i._id,
      application: i.application,
      interviewType: i.interviewType,
      scheduledAt: i.scheduledAt,
      preparationProgress: progress,
    };
  });

  res.status(200).json({ success: true, data });
});

// @desc    Get specific interview prep context
// @route   GET /api/student/interview-prep/:id
// @access  Private
const getInterviewPrepContext = asyncHandler(async (req, res) => {
  const context = await buildPrepContext(req.user._id, req.params.id, req.query.applicationId);
  res.status(200).json({ success: true, data: context });
});

// @desc    Generate questions for specific mode
// @route   POST /api/student/interview-prep/questions
// @access  Private
const generateQuestions = asyncHandler(async (req, res) => {
  const { interviewId, applicationId, mode, difficulty, count } = req.body;
  const context = await buildPrepContext(req.user._id, interviewId, applicationId);
  
  const result = await generatePracticeQuestions(context, mode || 'Technical', difficulty || 'Medium', count || 5);
  res.status(200).json({ success: true, data: result.questions });
});

// @desc    Start Mock Interview Session
// @route   POST /api/student/interview-prep/mock/start
// @access  Private
const startMockInterview = asyncHandler(async (req, res) => {
  const { interviewId, applicationId, interviewType, difficulty, count } = req.body;
  
  const context = await buildPrepContext(req.user._id, interviewId, applicationId);
  const result = await generatePracticeQuestions(context, interviewType || 'Mixed', difficulty || 'Medium', count || 5);

  const session = await InterviewPracticeSession.create({
    student: req.user._id,
    interview: interviewId || null,
    application: applicationId || null,
    role: context.role,
    interviewType: interviewType || 'Mixed',
    difficulty: difficulty || 'Medium',
    mode: 'Mock',
    questions: result.questions.map(q => ({
      question: q.question,
      topic: q.topic,
      difficulty: q.difficulty,
      relevance: q.relevance
    })),
    status: 'In Progress'
  });

  res.status(201).json({ success: true, data: session });
});

// @desc    Submit answer in Mock/Practice Session
// @route   POST /api/student/interview-prep/mock/:sessionId/answer
// @access  Private
const submitAnswer = asyncHandler(async (req, res) => {
  const session = await InterviewPracticeSession.findOne({ _id: req.params.sessionId, student: req.user._id });
  
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  const { answer, questionIndex } = req.body;
  
  if (questionIndex >= session.questions.length) {
    res.status(400);
    throw new Error('Invalid question index');
  }

  const question = session.questions[questionIndex];
  question.studentAnswer = answer;

  // Evaluate
  const evalResult = await evaluateInterviewAnswer({
    question: question.question,
    topic: question.topic,
    difficulty: question.difficulty,
    role: session.role
  }, answer);

  question.evaluation = evalResult;

  // Update overall score if mock
  if (session.mode === 'Mock') {
    const answeredCount = session.questions.filter(q => q.evaluation?.score != null).length;
    const totalScore = session.questions.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0);
    session.score = Math.round(totalScore / answeredCount);
  }

  await session.save();
  res.status(200).json({ success: true, data: question });
});

// @desc    Complete Mock Session
// @route   POST /api/student/interview-prep/mock/:sessionId/complete
// @access  Private
const completeMockSession = asyncHandler(async (req, res) => {
  const session = await InterviewPracticeSession.findOne({ _id: req.params.sessionId, student: req.user._id });
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }
  
  session.status = 'Completed';
  session.completedAt = new Date();
  
  // Calculate average metrics
  const evaluated = session.questions.filter(q => q.evaluation?.score != null);
  if (evaluated.length > 0) {
    const totalScore = evaluated.reduce((acc, q) => acc + (q.evaluation.score || 0), 0);
    const tech = evaluated.reduce((acc, q) => acc + (q.evaluation.technicalAccuracy || 0), 0);
    const clear = evaluated.reduce((acc, q) => acc + (q.evaluation.clarity || 0), 0);
    const comp = evaluated.reduce((acc, q) => acc + (q.evaluation.completeness || 0), 0);
    const rel = evaluated.reduce((acc, q) => acc + (q.evaluation.relevance || 0), 0);

    session.score = Math.round(totalScore / evaluated.length);
    session.metrics = {
      technicalKnowledge: Math.round(tech / evaluated.length),
      communication: Math.round(clear / evaluated.length),
      completeness: Math.round(comp / evaluated.length),
      relevance: Math.round(rel / evaluated.length)
    };
  }

  await session.save();
  res.status(200).json({ success: true, data: session });
});

// @desc    Get Practice History
// @route   GET /api/student/interview-prep/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
  const sessions = await InterviewPracticeSession.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
    
  res.status(200).json({ success: true, data: sessions });
});

// @desc    Generate Introduction
// @route   POST /api/student/interview-prep/introduction
// @access  Private
const getIntroduction = asyncHandler(async (req, res) => {
  const { interviewId, applicationId } = req.body;
  const context = await buildPrepContext(req.user._id, interviewId, applicationId);
  const result = await generateIntroduction(context);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  getUpcomingPrep,
  getInterviewPrepContext,
  generateQuestions,
  startMockInterview,
  submitAnswer,
  completeMockSession,
  getHistory,
  getIntroduction
};
