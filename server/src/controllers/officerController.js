const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const InterventionSignal = require('../models/InterventionSignal');
const copilotService = require('../services/intelligence/officerCopilotService');

// ── @route  GET /api/officer/dashboard ─────────────────────────────────────────
const getDashboardMetrics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    if (!institutionId) {
      res.status(403);
      return next(new Error('Placement Officer is not bound to an institution'));
    }

    // 1. Total Students
    const totalStudents = await User.countDocuments({ institutionId, role: 'STUDENT' });

    // 2. Total Mentors
    const totalMentors = await User.countDocuments({ institutionId, role: 'MENTOR' });

    // 3. Unassigned Students (No mentor)
    const unassignedStudents = await User.countDocuments({
      institutionId,
      role: 'STUDENT',
      $or: [{ mentorId: null }, { mentorId: { $exists: false } }]
    });

    // 4. Efficient aggregation for students in this institution
    const allStudentIds = await User.find({ 
      institutionId, 
      role: 'STUDENT', 
      'privacySettings.shareProfileWithPlacement': { $ne: false } 
    }).distinct('_id');

    // Applications Pipeline
    const appsAggregation = await Application.aggregate([
      { $match: { user: { $in: allStudentIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    let totalApps = 0;
    let totalInterviews = 0;
    let totalOffers = 0;
    let shortlisted = 0;
    let rejected = 0;

    appsAggregation.forEach(a => {
      totalApps += a.count;
      if (a._id === 'Interview') totalInterviews += a.count;
      if (a._id === 'Offer') totalOffers += a.count;
      if (a._id === 'Assessment') shortlisted += a.count;
      if (a._id === 'Rejected') rejected += a.count;
    });
    
    // Offers imply interviews, so let's adjust if necessary (some systems consider Offer a separate count that didn't pass through Interview, but logically it did)
    // Actually, if status is exactly 'Offer', the document is no longer 'Interview'. So total past interviews = Interview + Offer
    const pipelineInterviews = totalInterviews + totalOffers + rejected; // Roughly

    // Active students (applied in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeAggregation = await Application.aggregate([
      { $match: { user: { $in: allStudentIds }, createdAt: { $gt: thirtyDaysAgo } } },
      { $group: { _id: '$user' } },
      { $count: 'activeCount' }
    ]);
    const activeStudents = activeAggregation.length > 0 ? activeAggregation[0].activeCount : 0;

    // 5. Interviews
    const interviewsAgg = await Interview.aggregate([
      { $match: { user: { $in: allStudentIds } } },
      { $group: {
          _id: { isUpcoming: { $gt: ['$scheduledAt', new Date()] } },
          count: { $sum: 1 }
        }
      }
    ]);
    
    let upcomingInterviews = 0;
    let completedInterviews = 0;
    interviewsAgg.forEach(i => {
      if (i._id.isUpcoming) upcomingInterviews += i.count;
      else completedInterviews += i.count;
    });

    // Overdue interventions
    const overdueInterventionsCount = await InterventionSignal.countDocuments({
      institutionId,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
      dueDate: { $lt: new Date() }
    });

    const placementRate = totalStudents > 0 ? ((totalOffers / totalStudents) * 100).toFixed(1) : 0;

    // 6. Attention signals
    const attentionSignals = [];
    
    // Unassigned students (Top 5)
    const unassignedList = await User.find({
      institutionId,
      role: 'STUDENT',
      $or: [{ mentorId: null }, { mentorId: { $exists: false } }]
    }).select('name email').limit(5).lean();

    unassignedList.forEach(s => {
      attentionSignals.push({
        student: s,
        type: 'UNASSIGNED',
        priority: 'HIGH',
        reason: 'Student does not have a mentor assigned.',
        action: 'Assign Mentor',
        route: `/officer/students` // Adding explicit route for the frontend
      });
    });

    // Overdue interventions (Top 5)
    const overdueList = await InterventionSignal.find({
      institutionId,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
      dueDate: { $lt: new Date() }
    }).populate('student', 'name email').limit(5).lean();

    overdueList.forEach(i => {
      if (i.student) {
        attentionSignals.push({
          student: i.student,
          type: 'OVERDUE_INTERVENTION',
          priority: 'HIGH',
          reason: `Intervention "${i.title}" is overdue by ${Math.floor((new Date() - new Date(i.dueDate))/(1000*60*60*24))} days.`,
          action: 'View Intervention',
          route: `/officer/interventions`
        });
      }
    });

    // Pipeline Data for funnel
    const pipelineData = [
      { name: 'Applied', value: totalApps },
      { name: 'Shortlisted', value: shortlisted },
      { name: 'Interviews', value: pipelineInterviews },
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
          upcomingInterviews,
          completedInterviews,
          offers: totalOffers,
          overdueInterventions: overdueInterventionsCount,
          placementRate: parseFloat(placementRate),
          needsAttention: unassignedStudents + overdueInterventionsCount,
          lastUpdated: new Date().toISOString()
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

    if (!institutionId) {
      res.status(403);
      return next(new Error('Placement Officer is not bound to an institution'));
    }

    const { search } = req.query;
    const matchStage = { institutionId, role: 'MENTOR' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStage.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'mentorId',
          as: 'students'
        }
      },
      {
        $lookup: {
          from: 'applications',
          localField: 'students._id',
          foreignField: 'user',
          as: 'allApplications'
        }
      },
      {
        $lookup: {
          from: 'interventionsignals',
          localField: '_id',
          foreignField: 'mentorId',
          as: 'interventions'
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
          applications: { $size: '$allApplications' },
          interviews: {
            $size: {
              $filter: {
                input: '$allApplications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'Interview'] }
              }
            }
          },
          offers: {
            $size: {
              $filter: {
                input: '$allApplications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'Offer'] }
              }
            }
          },
          openInterventions: {
            $size: {
              $filter: {
                input: '$interventions',
                as: 'sig',
                cond: { $in: ['$$sig.status', ['OPEN', 'IN_PROGRESS']] }
              }
            }
          },
          overdueInterventions: {
            $size: {
              $filter: {
                input: '$interventions',
                as: 'sig',
                cond: {
                  $and: [
                    { $in: ['$$sig.status', ['OPEN', 'IN_PROGRESS']] },
                    { $ne: ['$$sig.dueDate', null] },
                    { $lt: ['$$sig.dueDate', new Date()] }
                  ]
                }
              }
            }
          }
        }
      }
    ];

    let mentors = await User.aggregate(pipeline);

    res.status(200).json({ success: true, count: mentors.length, data: mentors });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/mentors/:id ───────────────────────────────────────
const getMentorById = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid mentor ID'));
    }

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id), institutionId, role: 'MENTOR' } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'mentorId',
          as: 'students'
        }
      },
      {
        $lookup: {
          from: 'applications',
          localField: 'students._id',
          foreignField: 'user',
          as: 'allApplications'
        }
      },
      {
        $lookup: {
          from: 'interventionsignals',
          localField: '_id',
          foreignField: 'mentorId',
          as: 'interventions'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          isActive: 1,
          department: 1,
          createdAt: 1,
          studentCount: { $size: '$students' },
          applications: { $size: '$allApplications' },
          interviews: {
            $size: {
              $filter: {
                input: '$allApplications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'Interview'] }
              }
            }
          },
          offers: {
            $size: {
              $filter: {
                input: '$allApplications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'Offer'] }
              }
            }
          },
          openInterventions: {
            $size: {
              $filter: {
                input: '$interventions',
                as: 'sig',
                cond: { $in: ['$$sig.status', ['OPEN', 'IN_PROGRESS']] }
              }
            }
          },
          overdueInterventions: {
            $size: {
              $filter: {
                input: '$interventions',
                as: 'sig',
                cond: {
                  $and: [
                    { $in: ['$$sig.status', ['OPEN', 'IN_PROGRESS']] },
                    { $ne: ['$$sig.dueDate', null] },
                    { $lt: ['$$sig.dueDate', new Date()] }
                  ]
                }
              }
            }
          }
        }
      }
    ];

    const mentor = await User.aggregate(pipeline);

    if (!mentor || mentor.length === 0) {
      res.status(404);
      return next(new Error('Mentor not found or unauthorized'));
    }

    res.status(200).json({ success: true, data: mentor[0] });
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
    const { page = 1, limit = 25, status } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const matchStage = { institutionId, role: 'STUDENT', 'privacySettings.applicationProgress': { $ne: false } };
    
    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: 'applications', localField: '_id', foreignField: 'user', as: 'app' } },
      { $unwind: '$app' }
    ];

    if (status && status !== 'ALL') {
      pipeline.push({ $match: { 'app.status': status } });
    }

    pipeline.push(
      { $lookup: { from: 'users', localField: 'mentorId', foreignField: '_id', as: 'mentor' } },
      { $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } },
      { $sort: { 'app.updatedAt': -1 } }
    );

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit, 10) },
      {
        $project: {
          _id: '$app._id',
          createdAt: '$app.createdAt',
          dateApplied: '$app.dateApplied',
          status: '$app.status',
          company: '$app.company',
          role: '$app.role',
          user: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            mentorId: { name: '$mentor.name' }
          }
        }
      }
    );

    const applications = await User.aggregate(pipeline);

    res.status(200).json({ 
      success: true, 
      count: applications.length, 
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: applications 
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/interviews ──────────────────────────────────────────
const getInterviews = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { page = 1, limit = 25 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const matchStage = { institutionId, role: 'STUDENT', 'privacySettings.interviewProgress': { $ne: false } };
    
    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: 'interviews', localField: '_id', foreignField: 'user', as: 'interview' } },
      { $unwind: '$interview' },
      { $lookup: { from: 'applications', localField: 'interview.application', foreignField: '_id', as: 'app' } },
      { $unwind: { path: '$app', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'mentorId', foreignField: '_id', as: 'mentor' } },
      { $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } },
      { $sort: { 'interview.scheduledAt': 1 } }
    ];

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit, 10) },
      {
        $project: {
          _id: '$interview._id',
          date: '$interview.scheduledAt',
          round: '$interview.round',
          application: {
            company: '$app.company',
            role: '$app.role'
          },
          student: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            mentorId: { name: '$mentor.name' }
          }
        }
      }
    );

    const interviews = await User.aggregate(pipeline);

    res.status(200).json({ 
      success: true, 
      count: interviews.length, 
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: interviews 
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/interventions ─────────────────────────────────────
const getInterventions = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { page = 1, limit = 25, status = 'ALL', priority = 'ALL', search, overdue } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const matchStage = { institutionId };
    
    if (status !== 'ALL') {
      matchStage.status = status;
    }
    if (priority !== 'ALL') {
      matchStage.priority = priority;
    }
    if (overdue === 'true') {
      matchStage.status = { $in: ['OPEN', 'IN_PROGRESS'] };
      matchStage.dueDate = { $lt: new Date() };
    }

    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
      { $unwind: '$studentDoc' }
    ];

    if (search) {
      pipeline.push({
        $match: {
          'studentDoc.name': { $regex: search, $options: 'i' }
        }
      });
    }

    pipeline.push(
      { $lookup: { from: 'users', localField: 'mentorId', foreignField: '_id', as: 'mentorDoc' } },
      { $unwind: { path: '$mentorDoc', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }
    );

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await InterventionSignal.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit, 10) },
      {
        $project: {
          _id: 1,
          type: 1,
          priority: 1,
          status: 1,
          title: 1,
          reason: 1,
          evidence: 1,
          suggestedSupport: 1,
          dueDate: 1,
          followUpDate: 1,
          mentorNotes: 1,
          resolvedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          student: {
            _id: '$studentDoc._id',
            name: '$studentDoc.name',
            email: '$studentDoc.email',
            department: '$studentDoc.department',
            mentorId: { name: '$mentorDoc.name', email: '$mentorDoc.email' }
          }
        }
      }
    );

    const signals = await InterventionSignal.aggregate(pipeline);

    res.status(200).json({ 
      success: true, 
      count: signals.length, 
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: signals 
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/officer/analytics ─────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    // 1. Get base students for this institution
    const students = await User.find({ institutionId, role: 'STUDENT' }).select('_id department').lean();
    const studentIds = students.map(s => s._id);
    const totalStudents = students.length;

    // 2. Applications Metrics
    const appsAgg = await Application.aggregate([
      { $match: { user: { $in: studentIds }, status: { $ne: 'Wishlist' } } },
      { $group: {
          _id: '$user',
          count: { $sum: 1 },
          hasOffer: { $max: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
      }}
    ]);

    let applications = 0;
    let offers = 0;
    let placed = 0;
    appsAgg.forEach(a => {
      applications += a.count;
      offers += a.offers;
      if (a.hasOffer) placed++;
    });

    // 3. Interviews Metrics (Accurate count from Interview collection)
    const interviews = await Interview.countDocuments({ user: { $in: studentIds } });

    // 4. Department Stats
    const deptMap = {};
    students.forEach(s => deptMap[s._id] = s.department || 'Unknown');

    const departmentStatsMap = {};
    students.forEach(s => {
      const d = s.department || 'Unknown';
      if (!departmentStatsMap[d]) departmentStatsMap[d] = { department: d, students: 0, applications: 0, offers: 0 };
      departmentStatsMap[d].students++;
    });

    appsAgg.forEach(a => {
      const d = deptMap[a._id];
      if (d && departmentStatsMap[d]) {
        departmentStatsMap[d].applications += a.count;
        departmentStatsMap[d].offers += a.offers;
      }
    });

    const departmentStats = Object.values(departmentStatsMap).sort((a, b) => b.applications - a.applications);

    const placementRate = totalStudents > 0 ? ((placed / totalStudents) * 100).toFixed(1) : 0;
    const interviewConversion = applications > 0 ? ((interviews / applications) * 100).toFixed(1) : 0;
    const offerConversion = interviews > 0 ? ((offers / interviews) * 100).toFixed(1) : 0;
    
    // 5. 30-Day Time Series Data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const appsTimeSeries = await Application.aggregate([
      { $match: { user: { $in: studentIds }, dateApplied: { $gte: thirtyDaysAgo }, status: { $ne: 'Wishlist' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateApplied' } }, applications: { $sum: 1 } } }
    ]);

    const offersTimeSeries = await Application.aggregate([
      { $match: { user: { $in: studentIds }, status: 'Offer', updatedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, offers: { $sum: 1 } } }
    ]);

    const intsTimeSeries = await Interview.aggregate([
      { $match: { user: { $in: studentIds }, scheduledAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } }, interviews: { $sum: 1 } } }
    ]);

    const timeSeriesMap = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      timeSeriesMap[dateStr] = { date: dateStr, applications: 0, interviews: 0, offers: 0 };
    }
    
    appsTimeSeries.forEach(t => {
      if (timeSeriesMap[t._id]) timeSeriesMap[t._id].applications = t.applications;
    });

    offersTimeSeries.forEach(t => {
      if (timeSeriesMap[t._id]) timeSeriesMap[t._id].offers = t.offers;
    });

    intsTimeSeries.forEach(t => {
      if (timeSeriesMap[t._id]) timeSeriesMap[t._id].interviews = t.interviews;
    });

    const timeSeriesData = Object.values(timeSeriesMap).map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        applications,
        interviews,
        offers,
        placed,
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
