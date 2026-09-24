const User = require('../models/User');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Task = require('../models/Task');

// ── @route  GET /api/readiness ───────────────────────────────────────────────
// ── @desc   Get comprehensive career readiness metrics for the student
// ── @access Private (Student only)
exports.getStudentReadiness = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ── 1. Profile Readiness ────────────────────────────────────────────────
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Define 10 key fields for profile completeness
    const profileFields = [
      { key: 'name', label: 'Full Name' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'location', label: 'Location' },
      { key: 'linkedinUrl', label: 'LinkedIn URL' },
      { key: 'githubUrl', label: 'GitHub URL' },
      { key: 'professionalBio', label: 'Professional Summary' },
      { key: 'targetRoles', label: 'Target Roles', isArray: true },
      { key: 'jobSearchGoal', label: 'Career Goal' },
      { key: 'department', label: 'Department' },
      { key: 'batch', label: 'Graduation Year' },
    ];

    let filledCount = 0;
    const missingFields = [];

    profileFields.forEach(field => {
      let isFilled = false;
      if (field.isArray) {
        isFilled = Array.isArray(user[field.key]) && user[field.key].length > 0;
      } else {
        isFilled = user[field.key] !== null && user[field.key] !== undefined && user[field.key] !== '';
      }

      if (isFilled) {
        filledCount++;
      } else {
        missingFields.push(field.label);
      }
    });

    const profilePercentage = Math.round((filledCount / profileFields.length) * 100);

    // ── 2. Resume Readiness & Skills ────────────────────────────────────────
    const resumes = await Resume.find({ user: userId }).lean();
    
    let resumeReady = false;
    let defaultResumeExists = false;
    let targetRoleDefined = false;
    let studentSkills = [];

    if (resumes.length > 0) {
      resumeReady = true;
      const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
      if (resumes.find(r => r.isDefault)) defaultResumeExists = true;
      if (defaultResume.targetRole && defaultResume.targetRole !== 'General') {
        targetRoleDefined = true;
      }
      if (defaultResume.skills && defaultResume.skills.length > 0) {
        studentSkills = defaultResume.skills;
      }
    }

    const resumeChecklist = [
      { id: 'uploaded', label: 'Resume uploaded', done: resumeReady },
      { id: 'default', label: 'Default resume selected', done: defaultResumeExists },
      { id: 'target', label: 'Target role defined', done: targetRoleDefined },
    ];
    
    const resumePercentage = Math.round((resumeChecklist.filter(c => c.done).length / resumeChecklist.length) * 100);

    // ── 3. Application Activity ─────────────────────────────────────────────
    const appAgg = await Application.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    let totalApps = 0;
    let activeApps = 0;
    let interviewsCount = 0;
    let offersCount = 0;
    let rejectionsCount = 0;

    appAgg.forEach(({ _id, count }) => {
      totalApps += count;
      if (_id === 'Offer') offersCount = count;
      if (_id === 'Rejected') rejectionsCount = count;
      if (_id === 'Interview') interviewsCount = count;
      if (!['Rejected', 'Offer'].includes(_id)) activeApps += count;
    });

    // ── 4. Interview Preparation ────────────────────────────────────────────
    const interviews = await Interview.find({ user: userId }).lean();
    
    const now = new Date();
    const upcomingInterviews = interviews.filter(i => new Date(i.scheduledAt) >= now && ['Scheduled', 'Rescheduled'].includes(i.result));
    const completedInterviews = interviews.filter(i => new Date(i.scheduledAt) < now || ['Passed', 'Rejected'].includes(i.result));

    let totalChecklistItems = 0;
    let completedChecklistItems = 0;

    upcomingInterviews.forEach(interview => {
      if (interview.preparation && interview.preparation.checklist) {
        interview.preparation.checklist.forEach(item => {
          totalChecklistItems++;
          if (item.completed) completedChecklistItems++;
        });
      }
    });

    const prepPercentage = totalChecklistItems > 0 
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100) 
      : (upcomingInterviews.length > 0 ? 0 : null); // null means no upcoming interviews requiring prep

    // ── 5. Task Completion ──────────────────────────────────────────────────
    const taskAgg = await Task.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    let pendingTasks = 0;
    let completedTasks = 0;
    
    taskAgg.forEach(({ _id, count }) => {
      if (_id === 'Completed') completedTasks += count;
      else if (_id !== 'Cancelled') pendingTasks += count;
    });

    const totalTasks = pendingTasks + completedTasks;
    const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;
    
    const overdueTasks = await Task.countDocuments({ 
      user: userId, 
      dueDate: { $lt: now }, 
      status: { $nin: ['Completed', 'Cancelled'] } 
    });

    // ── Next Recommended Action Logic ───────────────────────────────────────
    let recommendedAction = null;
    let actionBtnText = 'View';
    let actionLink = '/dashboard';

    if (missingFields.length > 0 && profilePercentage < 50) {
      recommendedAction = `Complete your profile (missing ${missingFields[0]})`;
      actionBtnText = 'Update Profile';
      actionLink = '/settings';
    } else if (!resumeReady) {
      recommendedAction = 'Upload your first resume to start tracking.';
      actionBtnText = 'Go to Resume Hub';
      actionLink = '/resumes';
    } else if (overdueTasks > 0) {
      recommendedAction = `You have ${overdueTasks} overdue task(s) to complete.`;
      actionBtnText = 'Review Tasks';
      actionLink = '/tasks';
    } else if (upcomingInterviews.length > 0 && prepPercentage !== null && prepPercentage < 100) {
      recommendedAction = 'Continue preparation for your upcoming interview.';
      actionBtnText = 'Prepare Now';
      actionLink = '/applications';
    } else if (totalApps === 0) {
      recommendedAction = 'Start tracking your first job application.';
      actionBtnText = 'Add Application';
      actionLink = '/applications';
    } else if (missingFields.length > 0) {
      recommendedAction = `Finish your profile (missing ${missingFields[0]}).`;
      actionBtnText = 'Complete Profile';
      actionLink = '/settings';
    } else if (pendingTasks > 0) {
      recommendedAction = `Complete your pending tasks.`;
      actionBtnText = 'View Tasks';
      actionLink = '/tasks';
    } else {
      recommendedAction = "You're all caught up! Keep building your skills and networking.";
      actionBtnText = 'View Dashboard';
      actionLink = '/dashboard';
    }

    res.status(200).json({
      success: true,
      data: {
        profile: {
          percentage: profilePercentage,
          missing: missingFields
        },
        resume: {
          percentage: resumePercentage,
          count: resumes.length,
          checklist: resumeChecklist,
        },
        applications: {
          total: totalApps,
          active: activeApps,
          interviews: interviewsCount,
          offers: offersCount,
          rejections: rejectionsCount
        },
        interviews: {
          upcoming: upcomingInterviews.length,
          completed: completedInterviews.length,
          preparationProgress: prepPercentage,
          upcomingList: upcomingInterviews.map(i => ({ _id: i._id, application: i.application, scheduledAt: i.scheduledAt, result: i.result }))
        },
        tasks: {
          pending: pendingTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          percentage: taskPercentage
        },
        skills: studentSkills,
        recommendedAction: {
          text: recommendedAction,
          buttonText: actionBtnText,
          link: actionLink
        }
      }
    });

  } catch (err) {
    next(err);
  }
};
