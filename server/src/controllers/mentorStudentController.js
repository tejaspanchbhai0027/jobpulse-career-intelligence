const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Task = require('../models/Task');
const InterventionSignal = require('../models/InterventionSignal');

/**
 * Helper to calculate Student Condition Status based on hard data.
 */
const calculateStudentCondition = (student, applications, interviews, tasks, interventions) => {
  const now = new Date();
  
  // 1. Unresolved HIGH priority interventions?
  const hasOpenHighIntervention = interventions.some(i => i.status === 'OPEN' && i.priority === 'HIGH');
  if (hasOpenHighIntervention) {
    return { status: 'NEEDS_ATTENTION', reason: 'High priority intervention is currently open.' };
  }

  // 2. Overdue tasks?
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now);
  if (overdueTasks.length > 0) {
    return { status: 'NEEDS_ATTENTION', reason: `${overdueTasks.length} overdue task(s).` };
  }

  // 3. Complete Inactivity (No apps, no tasks, no interviews)
  if (applications.length === 0 && interviews.length === 0 && tasks.length === 0) {
    // Determine how long they've been registered
    const daysSinceRegistration = (now - new Date(student.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceRegistration > 14) {
      return { status: 'INACTIVE', reason: 'No career activity recorded in the first 14+ days.' };
    } else {
      return { status: 'NO_DATA', reason: 'Student recently onboarded. No data yet.' };
    }
  }

  // 4. Stale Activity
  let lastActivityDate = new Date(student.createdAt);
  
  applications.forEach(app => {
    if (new Date(app.updatedAt) > lastActivityDate) lastActivityDate = new Date(app.updatedAt);
  });
  tasks.forEach(task => {
    if (new Date(task.updatedAt) > lastActivityDate) lastActivityDate = new Date(task.updatedAt);
  });
  
  const daysSinceLastActivity = (now - lastActivityDate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastActivity > 30) {
    return { status: 'INACTIVE', reason: `No application or task activity in over 30 days.` };
  }

  // 5. Upcoming interview prep
  const upcomingInterviews = interviews.filter(i => new Date(i.scheduledAt) > now);
  if (upcomingInterviews.length > 0) {
    return { status: 'INTERVIEW_PREPARATION_REQUIRED', reason: `Student has ${upcomingInterviews.length} upcoming interview(s) to prepare for.` };
  }

  // 6. Active pipeline
  const activeApps = applications.filter(a => ['Applied', 'Assessment', 'Interview'].includes(a.status));
  if (activeApps.length > 0) {
    return { status: 'ACTIVE', reason: `Student is actively pursuing ${activeApps.length} opportunity(ies).` };
  }

  return { status: 'FOLLOW_UP_REQUIRED', reason: 'Pipeline is currently empty. Student needs to apply.' };
};


// ── @route  GET /api/mentor/students/:studentId/overview ───────────────────────
const getStudentOverview = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;
    const { studentId } = req.params;

    // Verify assignment
    const student = await User.findOne({ _id: studentId, mentorId, institutionId, role: 'STUDENT' }).lean();
    
    if (!student) {
      res.status(403);
      return next(new Error('Student not found or not assigned to this mentor.'));
    }

    // Fetch related data
    const [applications, interviews, tasks, interventions] = await Promise.all([
      Application.find({ user: studentId }).lean(),
      Interview.find({ user: studentId }).populate('application', 'company role').lean(),
      Task.find({ user: studentId }).lean(),
      InterventionSignal.find({ student: studentId }).lean()
    ]);

    // Compute condition
    const condition = calculateStudentCondition(student, applications, interviews, tasks, interventions);

    // Aggregate Pipeline
    const pipeline = {
      total: applications.length,
      applied: applications.filter(a => a.status === 'Applied').length,
      assessment: applications.filter(a => a.status === 'Assessment').length,
      interview: applications.filter(a => a.status === 'Interview').length,
      offer: applications.filter(a => a.status === 'Offer').length,
      rejected: applications.filter(a => a.status === 'Rejected').length,
    };

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          batch: student.batch,
          department: student.department,
          profileCompletion: student.profileCompletionScore || 0,
          lastUpdated: student.updatedAt || student.createdAt,
        },
        condition,
        pipeline,
        currentTasks: tasks.filter(t => !t.completed).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)),
        upcomingInterviews: interviews.filter(i => new Date(i.scheduledAt) > new Date()).sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
      }
    });
  } catch (error) {
    next(error);
  }
};


// ── @route  GET /api/mentor/students/:studentId/activity ───────────────────────
const getStudentActivityTimeline = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const mentorId = req.user._id;
    const { studentId } = req.params;

    // Verify assignment
    const student = await User.findOne({ _id: studentId, mentorId, institutionId, role: 'STUDENT' }).select('_id');
    
    if (!student) {
      res.status(403);
      return next(new Error('Student not found or not assigned to this mentor.'));
    }

    const [applications, interviews, tasks] = await Promise.all([
      Application.find({ user: studentId }).select('company role status createdAt updatedAt').lean(),
      Interview.find({ user: studentId }).populate('application', 'company').lean(),
      Task.find({ user: studentId, completed: true }).select('title completedAt').lean()
    ]);

    const timeline = [];

    applications.forEach(app => {
      timeline.push({ type: 'APPLICATION_CREATED', date: app.createdAt, details: `Applied to ${app.role} at ${app.company}` });
      if (app.updatedAt.toString() !== app.createdAt.toString()) {
         timeline.push({ type: 'APPLICATION_UPDATED', date: app.updatedAt, details: `Application for ${app.company} moved to ${app.status}` });
      }
    });

    interviews.forEach(interview => {
      timeline.push({ type: 'INTERVIEW_SCHEDULED', date: interview.createdAt, details: `Interview scheduled with ${interview.application?.company || 'Company'}` });
      if (new Date(interview.scheduledAt) < new Date()) {
         timeline.push({ type: 'INTERVIEW_COMPLETED', date: interview.scheduledAt, details: `Completed interview with ${interview.application?.company || 'Company'}` });
      }
    });

    tasks.forEach(task => {
      if (task.completedAt) {
         timeline.push({ type: 'TASK_COMPLETED', date: task.completedAt, details: `Completed task: ${task.title}` });
      }
    });

    // Sort descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getStudentOverview,
  getStudentActivityTimeline
};
