const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// ── @route  GET /api/admin/dashboard/metrics ──────────────────────────────────
// ── @desc   Return aggregated placement metrics for the institution
// ── @access Private (Admin + Institution Access)
const getMetrics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      res.status(403);
      return next(new Error('Admin is not bound to an institution'));
    }

    const { startDate, endDate, department, batch } = req.query;

    // 1. Build User Query
    const userQuery = { institutionId, role: 'STUDENT' };
    if (department) userQuery.department = department;
    if (batch) userQuery.batch = parseInt(batch, 10);

    // 2. Fetch all matching student IDs
    const students = await User.find(userQuery).select('_id name email department batch');
    const studentIds = students.map(s => s._id);
    const totalStudents = studentIds.length;

    // Additional Org Metrics
    const totalPlacementOfficers = await User.countDocuments({ institutionId, role: 'PLACEMENT_OFFICER', isActive: true });
    const totalMentors = await User.countDocuments({ institutionId, role: 'MENTOR', isActive: true });
    const unassignedStudents = await User.countDocuments({ 
      institutionId, 
      role: 'STUDENT', 
      $or: [{ mentorId: null }, { mentorId: { $exists: false } }] 
    });

    // 3. Date filtering for applications
    const appQuery = { user: { $in: studentIds } };
    if (startDate || endDate) {
      appQuery.dateApplied = {};
      if (startDate) appQuery.dateApplied.$gte = new Date(startDate);
      if (endDate) appQuery.dateApplied.$lte = new Date(endDate);
    }

    // 4. Calculate core metrics using aggregation
    const applicationStats = await Application.aggregate([
      { $match: appQuery },
      {
        $group: {
          _id: '$user',
          totalApps: { $sum: 1 },
          interviews: { $sum: { $cond: [{ $eq: ['$status', 'Interview'] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
        }
      }
    ]);

    let totalApplications = 0;
    let totalInterviews = 0;
    let totalOffers = 0;
    const activeSeekerIds = new Set();
    const studentsWithInterviews = new Set();
    const studentsWithOffers = new Set();

    applicationStats.forEach(stat => {
      totalApplications += stat.totalApps;
      totalInterviews += stat.interviews;
      totalOffers += stat.offers;
      if (stat.totalApps > 0) activeSeekerIds.add(stat._id.toString());
      if (stat.interviews > 0) studentsWithInterviews.add(stat._id.toString());
      if (stat.offers > 0) studentsWithOffers.add(stat._id.toString());
    });

    const activeSeekers = activeSeekerIds.size;
    
    // Placement Rate: (Students with offers / Total Students) * 100
    // Alternatively, (Students with offers / Active Seekers) * 100
    // Let's use Students with offers / Total Students
    const placementRate = totalStudents > 0 
      ? Math.round((studentsWithOffers.size / totalStudents) * 100) 
      : 0;

    // 5. Funnel
    const funnel = {
      students: totalStudents,
      activeSearch: activeSeekers,
      applications: totalApplications,
      interviews: studentsWithInterviews.size,
      offers: studentsWithOffers.size
    };

    // 6. Career Signals
    
    // a) Needs Follow Up
    const needsFollowUpApps = await Application.find({ 
      user: { $in: studentIds }, 
      needsFollowUp: true 
    }).populate('user', 'name email').limit(10);
    
    const needsFollowUp = needsFollowUpApps.map(app => ({
      studentId: app.user._id,
      studentName: app.user.name,
      company: app.company,
      role: app.role,
      signal: 'May benefit from support: Follow-up required'
    }));

    // b) Upcoming Interviews
    const now = new Date();
    const upcomingInterviewsRaw = await Interview.find({
      user: { $in: studentIds },
      scheduledAt: { $gte: now }
    }).populate('user', 'name email').populate('application', 'company role').limit(10);

    const upcomingInterviews = upcomingInterviewsRaw.map(int => ({
      studentId: int.user._id,
      studentName: int.user.name,
      company: int.application?.company || 'Unknown',
      date: int.scheduledAt,
      signal: 'Support signal: Upcoming interview preparation'
    }));

    // c) High Activity, No Interviews (Active seekers with > 10 apps but 0 interviews)
    const strugglingSeekers = applicationStats
      .filter(stat => stat.totalApps >= 10 && stat.interviews === 0 && stat.offers === 0)
      .map(stat => {
        const student = students.find(s => s._id.toString() === stat._id.toString());
        return {
          studentId: student?._id,
          studentName: student?.name,
          applicationsCount: stat.totalApps,
          signal: 'May benefit from support: High volume, low conversion'
        };
      }).slice(0, 10);

    res.status(200).json({
      success: true,
      metrics: {
        totalStudents,
        totalPlacementOfficers,
        totalMentors,
        unassignedStudents,
        activeSeekers,
        applications: totalApplications,
        interviews: totalInterviews,
        offers: totalOffers,
        placementRate
      },
      funnel,
      signals: {
        needsFollowUp,
        upcomingInterviews,
        strugglingSeekers
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics
};
