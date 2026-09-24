const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const MentorFeedback = require('../models/MentorFeedback');
const Task = require('../models/Task');
const InterventionSignal = require('../models/InterventionSignal');
const copilotService = require('../services/intelligence/mentorCopilotService');

// ── @route  GET /api/mentor/dashboard ──────────────────────────────────────────
const getDashboardMetrics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;

    if (!institutionId) {
      res.status(403);
      return next(new Error('Mentor is not bound to an institution'));
    }

    // 1. Total Students
    const totalStudents = await User.countDocuments({ institutionId, mentorId, role: 'STUDENT' });

    // 2. Active Students & Pipeline
    const allStudents = await User.find({ institutionId, mentorId, role: 'STUDENT' }).select('_id privacySettings');
    const studentIds = allStudents.map(s => s._id);

    const optInStudentIds = allStudents
      .filter(s => s.privacySettings?.applicationProgress !== false)
      .map(s => s._id);

    const statsPipeline = [
      { $match: { user: { $in: optInStudentIds } } },
      {
        $group: {
          _id: '$user',
          totalApps: { $sum: 1 },
          totalInterviews: {
            $sum: { $cond: [{ $eq: ['$status', 'Interview'] }, 1, 0] }
          },
          totalOffers: {
            $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] }
          }
        }
      }
    ];

    const applicationStats = await Application.aggregate(statsPipeline);

    let totalApplications = 0;
    let totalInterviews = 0;
    let totalOffers = 0;
    const activeSeekers = new Set();

    applicationStats.forEach(stat => {
      totalApplications += stat.totalApps;
      totalInterviews += stat.totalInterviews;
      totalOffers += stat.totalOffers;
      if (stat.totalApps > 0) activeSeekers.add(stat._id.toString());
    });

    const tasks = await Task.find({ user: { $in: studentIds } }).lean();
    const interventions = await InterventionSignal.find({ student: { $in: studentIds }, status: 'OPEN' }).lean();

    const now = new Date();
    
    // Calculate Overdue Tasks
    const studentsWithOverdueTasks = new Set();
    tasks.forEach(t => {
      if (!t.completed && t.dueDate && new Date(t.dueDate) < now) {
        studentsWithOverdueTasks.add(t.user.toString());
      }
    });

    // Calculate Requiring Attention
    const studentsRequiringAttention = new Set();
    interventions.forEach(i => {
      studentsRequiringAttention.add(i.student.toString());
    });
    studentsWithOverdueTasks.forEach(id => studentsRequiringAttention.add(id));

    // Calculate Recently Active (within 7 days)
    const recentlyActiveStudents = new Set();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    applicationStats.forEach(stat => {
      // Simplification: we check if they are in activeSeekers.
      // For true recent activity, we'd need to check updatedAt of latest events.
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        activeStudents: activeSeekers.size,
        applications: totalApplications,
        interviews: totalInterviews,
        offers: totalOffers,
        studentsWithOverdueTasks: studentsWithOverdueTasks.size,
        studentsRequiringAttention: studentsRequiringAttention.size,
        openInterventions: interventions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/mentor/applications ───────────────────────────────────────
const getApplications = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;

    const students = await User.find({ institutionId, mentorId, role: 'STUDENT' }).select('_id privacySettings');
    const optInStudentIds = students
      .filter(s => s.privacySettings?.applicationProgress !== false)
      .map(s => s._id);

    const applications = await Application.find({ user: { $in: optInStudentIds } })
      .populate('user', 'name email batch department')
      .sort({ appliedDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/mentor/interviews ─────────────────────────────────────────
const getInterviews = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;

    const students = await User.find({ institutionId, mentorId, role: 'STUDENT' }).select('_id');
    const studentIds = students.map(s => s._id);

    const interviews = await Interview.find({ user: { $in: studentIds } })
      .populate('user', 'name email batch department')
      .populate('application', 'company role status')
      .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/mentor/interventions ─────────────────────────────────────
const getInterventions = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;

    // Fetch manually created or persisted interventions
    const interventions = await InterventionSignal.find({ 
      institutionId, 
      mentorId 
    })
    .populate('student', 'name email batch department')
    .sort({ createdAt: -1 })
    .lean();

    res.status(200).json({ success: true, count: interventions.length, data: interventions });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/mentor/analytics ──────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;

    const totalStudents = await User.countDocuments({ institutionId, mentorId, role: 'STUDENT' });
    const students = await User.find({ institutionId, mentorId, role: 'STUDENT' }).select('_id');
    const studentIds = students.map(s => s._id);

    const apps = await Application.find({ user: { $in: studentIds } }).lean();
    
    let totalInterviews = 0;
    let totalOffers = 0;
    let totalApplied = apps.length;

    apps.forEach(a => {
      if (a.status === 'Interview') totalInterviews++;
      if (a.status === 'Offer') {
        totalInterviews++;
        totalOffers++;
      }
    });

    const activeStudents = [...new Set(apps.map(a => a.user.toString()))].length;
    const placementRate = totalStudents > 0 ? ((totalOffers / totalStudents) * 100).toFixed(1) : 0;
    const interviewConversion = totalApplied > 0 ? ((totalInterviews / totalApplied) * 100).toFixed(1) : 0;
    const offerConversion = totalInterviews > 0 ? ((totalOffers / totalInterviews) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        applications: totalApplied,
        interviews: totalInterviews,
        offers: totalOffers,
        placed: totalOffers,
        placementRate,
        interviewConversion,
        offerConversion
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/mentor/notes ──────────────────────────────────────────────
const getNotes = async (req, res, next) => {
  try {
    const mentorId = req.user._id;
    // We fetch notes of type 'NOTE' created by this mentor
    const notes = await MentorFeedback.find({ mentorId, type: 'NOTE' })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notes.length, data: notes });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/mentor/notes ─────────────────────────────────────────────
const createNote = async (req, res, next) => {
  try {
    const mentorId = req.user._id;
    const institutionId = req.user.institutionId;
    const { studentId, content, actionItem, nextFollowUpDate } = req.body;

    // Verify student belongs to mentor
    const student = await User.findOne({ _id: studentId, mentorId, institutionId, role: 'STUDENT' });
    if (!student) {
      res.status(403);
      return next(new Error('Student not found or not assigned to you'));
    }

    const note = await MentorFeedback.create({
      studentId,
      mentorId,
      content,
      actionItem,
      nextFollowUpDate,
      type: 'NOTE'
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/mentor/notes/:id ──────────────────────────────────────────
const updateNote = async (req, res, next) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;
    const { content, actionItem, nextFollowUpDate } = req.body;

    let note = await MentorFeedback.findOne({ _id: id, mentorId, type: 'NOTE' });
    if (!note) {
      res.status(404);
      return next(new Error('Note not found or unauthorized'));
    }

    note.content = content !== undefined ? content : note.content;
    note.actionItem = actionItem !== undefined ? actionItem : note.actionItem;
    note.nextFollowUpDate = nextFollowUpDate !== undefined ? nextFollowUpDate : note.nextFollowUpDate;

    await note.save();

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/mentor/notes/:id ───────────────────────────────────────
const deleteNote = async (req, res, next) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;

    const note = await MentorFeedback.findOne({ _id: id, mentorId, type: 'NOTE' });
    if (!note) {
      res.status(404);
      return next(new Error('Note not found or unauthorized'));
    }

    await note.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/mentor/intelligence/copilot ─────────────────────────────
const queryCopilot = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;
    const { message } = req.body;

    if (!message) {
      res.status(400);
      return next(new Error('Message is required'));
    }

    const response = await copilotService.queryCopilot(message, institutionId, mentorId);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/mentor/interventions ──────────────────────────────────
const createIntervention = async (req, res, next) => {
  try {
    const mentorId = req.user._id;
    const institutionId = req.user.institutionId;
    const { studentId, title, type, priority, reason, evidence, suggestedSupport, dueDate } = req.body;

    const student = await User.findOne({ _id: studentId, mentorId, institutionId, role: 'STUDENT' });
    if (!student) {
      res.status(403);
      return next(new Error('Student not found or not assigned to you'));
    }

    const intervention = await InterventionSignal.create({
      student: studentId,
      institutionId,
      mentorId,
      title,
      type: type || 'OTHER',
      category: priority === 'HIGH' ? 'HIGH ATTENTION' : 'WATCH', // legacy compatibility
      priority: priority || 'MEDIUM',
      reason,
      evidence: evidence || '',
      suggestedSupport: suggestedSupport || '',
      dueDate,
      status: 'OPEN'
    });

    res.status(201).json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/mentor/interventions/:id ─────────────────────────────
const updateIntervention = async (req, res, next) => {
  try {
    const mentorId = req.user._id;
    const { id } = req.params;
    const { status, priority, dueDate, followUpDate, mentorNotes, title, reason, suggestedSupport } = req.body;

    const intervention = await InterventionSignal.findOne({ _id: id });
    if (!intervention) {
      res.status(404);
      return next(new Error('Intervention not found'));
    }

    // Verify mentor owns this student
    const student = await User.findOne({ _id: intervention.student, mentorId });
    if (!student) {
      res.status(403);
      return next(new Error('Unauthorized'));
    }

    if (status) intervention.status = status;
    if (priority) intervention.priority = priority;
    if (dueDate !== undefined) intervention.dueDate = dueDate;
    if (followUpDate !== undefined) intervention.followUpDate = followUpDate;
    if (mentorNotes !== undefined) intervention.mentorNotes = mentorNotes;
    if (title) intervention.title = title;
    if (reason) intervention.reason = reason;
    if (suggestedSupport) intervention.suggestedSupport = suggestedSupport;

    if (status === 'RESOLVED' || status === 'CANCELLED') {
      if (!intervention.resolvedAt) intervention.resolvedAt = new Date();
    } else {
      intervention.resolvedAt = null;
    }

    await intervention.save();
    res.status(200).json({ success: true, data: intervention });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getApplications,
  getInterviews,
  getInterventions,
  getAnalytics,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  queryCopilot,
  createIntervention,
  updateIntervention
};
