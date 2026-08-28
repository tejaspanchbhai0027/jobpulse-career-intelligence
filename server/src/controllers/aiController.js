const asyncHandler = require('express-async-handler');
const aiService = require('../services/aiService');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// @desc    Analyze a Job Description
// @route   POST /api/ai/analyze-jd
// @access  Private
const analyzeJD = asyncHandler(async (req, res) => {
  const { jobDescription } = req.body;
  if (!jobDescription) {
    res.status(400);
    throw new Error('jobDescription is required');
  }

  const analysis = await aiService.analyzeJD(jobDescription);
  res.status(200).json({ success: true, data: analysis });
});

// @desc    Match Resume against a Job Description
// @route   POST /api/ai/match-resume
// @access  Private
const matchResume = asyncHandler(async (req, res) => {
  const { jobDescription } = req.body;
  if (!jobDescription) {
    res.status(400);
    throw new Error('jobDescription is required');
  }

  const user = await User.findById(req.user._id);
  const matchData = await aiService.matchResume(jobDescription, user.resumeText);
  res.status(200).json({ success: true, data: matchData });
});

// @desc    Summarize notes
// @route   POST /api/ai/summarize-notes
// @access  Private
const summarizeNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  if (!notes) {
    res.status(400);
    throw new Error('notes is required');
  }

  const summary = await aiService.summarizeNotes(notes);
  res.status(200).json({ success: true, data: summary });
});

// @desc    Chat with JobPulse Copilot
// @route   POST /api/ai/copilot
// @access  Private
const copilotChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400);
    throw new Error('message is required');
  }

  // Gather user context
  const userId = req.user._id;
  const user = await User.findById(userId).select('-password');
  const applications = await Application.find({ user: userId }).select('company role status dateApplied salary isPriority needsFollowUp source');
  const interviews = await Interview.find({ user: userId }).populate('application', 'company role');

  const contextData = {
    user: { name: user.name, goal: user.jobSearchGoal },
    totalApplications: applications.length,
    activeApplications: applications.filter(a => a.status !== 'Rejected').length,
    interviewsScheduled: interviews.length,
    applicationsList: applications.slice(0, 50), // Send latest 50 to avoid token limits
    interviewsList: interviews
  };

  const reply = await aiService.chatCopilot(message, contextData);
  res.status(200).json({ success: true, data: reply });
});

module.exports = {
  analyzeJD,
  matchResume,
  summarizeNotes,
  copilotChat,
};
