const User = require('../models/User');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const Task = require('../models/Task');
const Interview = require('../models/Interview');


const buildCareerCopilotContext = async (studentId, institutionId) => {
  const [
    student,
    primaryResume,
    applications,
    tasks,
    interviews,
    readinessData
  ] = await Promise.all([
    User.findOne({ _id: studentId, institutionId }).select('name department batch currentSkills targetRoles jobSearchGoal profileCompleteness'),
    Resume.findOne({ studentId, isPrimary: true }).select('atsScore matchScore skills extractedSkills'),
    Application.find({ student: studentId }).select('company role status followUpDate needsFollowUp isWishlist type'),
    Task.find({ student: studentId, status: { $ne: 'Completed' } }).select('title priority dueDate status'),
    Interview.find({ student: studentId }).select('application type scheduledAt result').populate('application', 'company role')
  ]);

  return {
    student: {
      name: student?.name,
      department: student?.department,
      batch: student?.batch,
      targetRoles: student?.targetRoles,
      jobSearchGoal: student?.jobSearchGoal,
      currentSkills: student?.currentSkills
    },
    readiness: {
      score: student?.profileCompleteness || 0,
      missingFields: [],
      recommendedAction: null
    },
    primaryResume: primaryResume ? {
      hasPrimaryResume: true,
      atsScore: primaryResume.atsScore,
      skills: primaryResume.extractedSkills || primaryResume.skills
    } : { hasPrimaryResume: false },
    applicationsSummary: {
      total: applications.length,
      wishlist: applications.filter(a => a.status === 'Wishlist').length,
      inProgress: applications.filter(a => ['Applied', 'Assessment', 'Interview'].includes(a.status)).length,
      offers: applications.filter(a => a.status === 'Offer').length,
      needsFollowUp: applications.filter(a => a.needsFollowUp).length
    },
    upcomingInterviews: interviews.filter(i => new Date(i.scheduledAt) > new Date() && i.result === 'Scheduled').map(i => ({
      company: i.application?.company,
      role: i.application?.role,
      type: i.type,
      scheduledAt: i.scheduledAt
    })),
    pendingTasks: tasks.map(t => ({
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status
    }))
  };
};

module.exports = {
  buildCareerCopilotContext
};
