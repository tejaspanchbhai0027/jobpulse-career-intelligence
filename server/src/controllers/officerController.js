const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const copilotService = require('../services/intelligence/officerCopilotService');

// ── @route  GET /api/officer/dashboard ─────────────────────────────────────────
const getDashboardMetrics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;

    if (!institutionId) {
      res.status(403);
      return next(new Error('Placement Officer is not bound to an institution'));
    }

    // 1. Total Students
    const totalStudents = await User.countDocuments({ institutionId, placementOfficerId, role: 'STUDENT' });

    // 2. Total Mentors
    const totalMentors = await User.countDocuments({ institutionId, placementOfficerId, role: 'MENTOR' });

    // 3. Unassigned Students (No mentor)
    const unassignedStudents = await User.countDocuments({
      institutionId,
      placementOfficerId,
      role: 'STUDENT',
      $or: [{ mentorId: null }, { mentorId: { $exists: false } }]
    });

    const assignedStudents = totalStudents - unassignedStudents;

    // 5. Aggregate Applications, Interviews, Offers for students of this PO
    const allStudents = await User.find({ institutionId, placementOfficerId, role: 'STUDENT' }).select('_id privacySettings');
    const optInStudentIds = allStudents
      .filter(s => s.privacySettings?.applicationProgress !== false)
      .map(s => s._id);

    const appsPipeline = await Application.find({ user: { $in: optInStudentIds } }).lean();
    
    // Active students (applied in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeStudentIds = new Set(
      appsPipeline.filter(a => new Date(a.createdAt) > thirtyDaysAgo).map(a => a.user.toString())
    );
    const activeStudents = activeStudentIds.size;

    let totalInterviews = 0;
    let totalOffers = 0;
    let totalApps = appsPipeline.length;

    appsPipeline.forEach(a => {
      if (a.status === 'Interview') totalInterviews++;
      if (a.status === 'Offer') {
        totalInterviews++; // Offers imply interviews
        totalOffers++;
      }
    });

    const placementRate = totalStudents > 0 ? ((totalOffers / totalStudents) * 100).toFixed(1) : 0;

    // Attention signals (Unassigned mentors)
    const attentionSignals = [];
    
    // Get unassigned students details
    const unassignedList = await User.find({
      institutionId,
      placementOfficerId,
      role: 'STUDENT',
      $or: [{ mentorId: null }, { mentorId: { $exists: false } }]
    }).select('name email lastActive').limit(5).lean();

    unassignedList.forEach(s => {
      attentionSignals.push({
        student: s,
        type: 'UNASSIGNED',
        priority: 'HIGH',
        reason: 'Student does not have a mentor assigned.',
        action: 'Assign Mentor'
      });
    });

    // Pipeline Data
    const pipelineData = [
      { name: 'Total Students', value: totalStudents },
      { name: 'Active Job Seekers', value: activeStudents },
      { name: 'Applications', value: totalApps },
      { name: 'Interviews', value: totalInterviews },
      { name: 'Offers Received', value: totalOffers }
    ];

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          activeStudents,
          totalMentors,
          unassignedStudents,
          applications: totalApps,
          interviews: totalInterviews,
          offers: totalOffers,
          placementRate: parseFloat(placementRate),
          needsAttention: unassignedStudents // Will expand as we add more signals
        },
        pipeline: pipelineData,
        attentionSignals
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/mentors ───────────────────────────────────────────
const getMentors = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;

    if (!institutionId) {
      res.status(403);
      return next(new Error('Placement Officer is not bound to an institution'));
    }

    const pipeline = [
      { $match: { institutionId, placementOfficerId, role: 'MENTOR' } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'mentorId',
          as: 'students'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          isActive: 1,
          department: 1,
          studentCount: { $size: '$students' },
          studentIds: '$students._id'
        }
      }
    ];

    let mentors = await User.aggregate(pipeline);

    for (let mentor of mentors) {
      if (mentor.studentCount > 0) {
        const statsAgg = await Application.aggregate([
          { $match: { user: { $in: mentor.studentIds } } },
          {
            $group: {
              _id: null,
              totalApps: { $sum: 1 },
              totalInterviews: { $sum: { $cond: [{ $eq: ['$status', 'Interview'] }, 1, 0] } },
              totalOffers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
            }
          }
        ]);
        const stats = statsAgg[0] || { totalApps: 0, totalInterviews: 0, totalOffers: 0 };
        mentor.applications = stats.totalApps;
        mentor.interviews = stats.totalInterviews;
        mentor.offers = stats.totalOffers;
        // Placed logic can be Offers > 0 but we'll leave this to frontend or exact field if present
      } else {
        mentor.applications = 0;
        mentor.interviews = 0;
        mentor.offers = 0;
      }
      delete mentor.studentIds;
    }

    res.status(200).json({ success: true, count: mentors.length, data: mentors });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/mentors/:id ───────────────────────────────────────
const getMentorById = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;
    const { id } = req.params;

    const mentor = await User.findOne({ _id: id, institutionId, placementOfficerId, role: 'MENTOR' })
      .select('name email department createdAt isActive');

    if (!mentor) {
      res.status(404);
      return next(new Error('Mentor not found or unauthorized'));
    }

    res.status(200).json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/officer/mentors ──────────────────────────────────────────
const createMentor = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;
    
    if (!institutionId) {
      res.status(403);
      return next(new Error('Placement Officer is not bound to an institution'));
    }

    const { name, email, password } = req.body;
    
    if (!name || !email) {
      res.status(400);
      return next(new Error('Name and email are required'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      return next(new Error('An account with that email already exists'));
    }

    // Use provided password or default secure password
    const mentorPassword = password || 'JobPulse@123';

    const mentor = await User.create({
      name,
      email,
      password: mentorPassword,
      role: 'MENTOR',
      institutionId,
      placementOfficerId
    });

    res.status(201).json({ success: true, data: { _id: mentor._id, name: mentor.name, email: mentor.email } });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/applications ────────────────────────────────────────
const getApplications = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;

    // Get all students under this PO who haven't explicitly hidden their apps
    const students = await User.find({ 
      institutionId, 
      placementOfficerId, 
      role: 'STUDENT',
      'privacySettings.applicationProgress': { $ne: false } 
    }).select('_id');
    const studentIds = students.map(s => s._id);

    const applications = await Application.find({ user: { $in: studentIds } })
      .populate({
        path: 'user',
        select: 'name email batch department mentorId',
        populate: { path: 'mentorId', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/interviews ────────────────────────────────────────
const getInterviews = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;

    // Get all students under this PO who haven't explicitly hidden their apps
    const students = await User.find({ 
      institutionId, 
      placementOfficerId, 
      role: 'STUDENT',
      'privacySettings.applicationProgress': { $ne: false } 
    }).select('_id');
    const studentIds = students.map(s => s._id);

    // Find applications that have an interview for these students
    const interviews = await Interview.find({ student: { $in: studentIds } })
      .populate('student', 'name email batch department mentorId')
      .populate('application', 'company role status')
      .populate({
        path: 'student',
        populate: { path: 'mentorId', select: 'name' }
      })
      .sort({ date: 1 });

    res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/interventions ─────────────────────────────────────
const getInterventions = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;

    // Get all students under this PO
    const students = await User.find({ institutionId, placementOfficerId, role: 'STUDENT' })
      .populate('mentorId', 'name email')
      .lean();
    
    // Split students into those sharing apps and those not
    const sharingAppStudents = students.filter(s => s.privacySettings?.applicationProgress !== false);
    const sharingAppIds = sharingAppStudents.map(s => s._id);

    // Only fetch apps and interviews for students who consent
    const applications = await Application.find({ user: { $in: sharingAppIds } }).lean();
    const interviews = await Interview.find({ student: { $in: sharingAppIds } }).lean();

    const signals = [];

    const now = new Date();

    for (let student of students) {
      // Signal: Unassigned (Applies to all students, even private ones, because it's a platform operational signal)
      if (!student.mentorId) {
        signals.push({
          student,
          type: 'UNASSIGNED',
          priority: 'HIGH',
          reason: 'Student does not have a mentor assigned.',
          detectedAt: now
        });
      }

      // The following signals only apply if the student is sharing application progress
      if (student.privacySettings?.applicationProgress !== false) {
        const studentApps = applications.filter(a => a.user.toString() === student._id.toString());
        const studentInterviews = interviews.filter(i => i.student.toString() === student._id.toString());

        // Signal: No activity
        if (studentApps.length === 0 && student.mentorId) {
          signals.push({
            student,
            type: 'NO_ACTIVITY',
            priority: 'MEDIUM',
            reason: 'Student has not submitted any applications.',
            detectedAt: now
          });
        }

        // Signal: Skill Gap
        if (studentApps.length >= 10 && studentInterviews.length === 0) {
          signals.push({
            student,
            type: 'SKILL_GAP',
            priority: 'HIGH',
            reason: 'Student has submitted many applications but secured 0 interviews.',
            detectedAt: now
          });
        }
        
        // Signal: Upcoming Interview
        const upcoming = studentInterviews.filter(i => new Date(i.date) > now && new Date(i.date) < new Date(now.getTime() + 48*60*60*1000));
        for (let ui of upcoming) {
           signals.push({
            student,
            type: 'UPCOMING_INTERVIEW',
            priority: 'LOW',
            reason: 'Student has an interview in the next 48 hours.',
            detectedAt: now
          });
        }
      }
    }

    // Sort by priority (HIGH first)
    const priorityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    signals.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    res.status(200).json({ success: true, count: signals.length, data: signals });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/analytics ─────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;

    const totalStudents = await User.countDocuments({ institutionId, placementOfficerId, role: 'STUDENT' });
    const students = await User.find({ institutionId, placementOfficerId, role: 'STUDENT' }).select('_id department privacySettings');
    
    // Only include apps for students who haven't opted out of sharing application progress
    const sharingAppStudents = students.filter(s => s.privacySettings?.applicationProgress !== false);
    const sharingAppIds = sharingAppStudents.map(s => s._id);

    const apps = await Application.find({ user: { $in: sharingAppIds } }).lean();
    
    let totalInterviews = 0;
    let totalOffers = 0;
    let totalApplied = apps.length;

    apps.forEach(a => {
      if (a.status === 'Interview') totalInterviews++;
      if (a.status === 'Offer') {
        totalInterviews++; // Assume offer came after interview
        totalOffers++;
      }
    });

    const placementRate = totalStudents > 0 ? ((totalOffers / totalStudents) * 100).toFixed(1) : 0;
    const interviewConversion = totalApplied > 0 ? ((totalInterviews / totalApplied) * 100).toFixed(1) : 0;
    const offerConversion = totalInterviews > 0 ? ((totalOffers / totalInterviews) * 100).toFixed(1) : 0;

    // --- RECHARTS DATA PREPARATION ---

    // 1. Department Stats (Bar Chart)
    const departmentMap = {};
    students.forEach(s => {
      const dept = s.department || 'Unknown';
      if (!departmentMap[dept]) departmentMap[dept] = { department: dept, students: 0, applications: 0, offers: 0 };
      departmentMap[dept].students++;
    });

    apps.forEach(a => {
      const student = students.find(s => s._id.toString() === a.user.toString());
      if (student) {
        const dept = student.department || 'Unknown';
        if (departmentMap[dept]) {
          departmentMap[dept].applications++;
          if (a.status === 'Offer') departmentMap[dept].offers++;
        }
      }
    });
    
    const departmentStats = Object.values(departmentMap).sort((a, b) => b.applications - a.applications);

    // 2. Time Series Data (Line Chart - Last 30 Days)
    const timeSeriesMap = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      timeSeriesMap[dateStr] = { date: dateStr, applications: 0, interviews: 0, offers: 0 };
    }

    apps.forEach(a => {
      if (!a.createdAt) return;
      const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
      if (timeSeriesMap[dateStr]) {
        timeSeriesMap[dateStr].applications++;
        if (a.status === 'Interview') timeSeriesMap[dateStr].interviews++;
        if (a.status === 'Offer') {
          timeSeriesMap[dateStr].interviews++;
          timeSeriesMap[dateStr].offers++;
        }
      }
    });

    // Formatting dates for X-axis
    const timeSeriesData = Object.values(timeSeriesMap).map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        applications: totalApplied,
        interviews: totalInterviews,
        offers: totalOffers,
        placed: totalOffers,
        placementRate,
        interviewConversion,
        offerConversion,
        departmentStats,
        timeSeriesData
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/officer/intelligence/copilot ───────────────────────────
const queryCopilot = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const placementOfficerId = req.user._id;
    const { message } = req.body;

    if (!message) {
      res.status(400);
      return next(new Error('Message is required'));
    }

    const response = await copilotService.queryCopilot(message, institutionId, placementOfficerId);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getMentors,
  getMentorById,
  createMentor,
  getInterviews,
  getApplications,
  getInterventions,
  getAnalytics,
  queryCopilot
};
