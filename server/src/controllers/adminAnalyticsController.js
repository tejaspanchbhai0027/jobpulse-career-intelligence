const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const JobDescriptionSnapshot = require('../models/JobDescriptionSnapshot');

// Minimum sample size before we report a rate as valid
const MIN_SAMPLE = 5;

const safeRate = (num, denom) => {
  if (!denom || denom < MIN_SAMPLE) return { value: null, label: 'Insufficient data', n: denom || 0 };
  return { value: Math.round((num / denom) * 100), label: `${Math.round((num / denom) * 100)}%`, n: denom };
};

// ── @route  GET /api/admin/analytics ────────────────────────────────────────────
// ── @desc   Full placement analytics for the institution
// ── @access Private (Admin + Institution Access)
const getAnalytics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      res.status(403);
      return next(new Error('Admin is not bound to an institution'));
    }

    const { department, batch, startDate, endDate } = req.query;

    // ── 1. Build base cohort ───────────────────────────────────────
    const userMatch = { institutionId, role: 'STUDENT' };
    if (req.user.role === 'MENTOR') {
      userMatch.mentorId = req.user._id;
    }
    if (department) userMatch.department = department;
    if (batch) userMatch.batch = parseInt(batch, 10);

    const students = await User.find(userMatch).select('_id name department batch privacySettings');
    const studentIds = students.map(s => s._id);
    const totalStudents = studentIds.length;

    // Filter IDs based on privacy preferences
    const appSharingIds = students.filter(s => s.privacySettings?.applicationProgress !== false).map(s => s._id);
    const intSharingIds = students.filter(s => s.privacySettings?.interviewProgress !== false).map(s => s._id);
    const skillSharingIds = students.filter(s => s.privacySettings?.skills !== false).map(s => s._id);
    const resumeSharingIds = students.filter(s => s.privacySettings?.resume === true).map(s => s._id);

    const appMatch = { user: { $in: appSharingIds } };
    if (startDate || endDate) {
      appMatch.dateApplied = {};
      if (startDate) appMatch.dateApplied.$gte = new Date(startDate);
      if (endDate) appMatch.dateApplied.$lte = new Date(endDate);
    }

    if (totalStudents === 0) {
      return res.status(200).json({
        success: true,
        data: {
          meta: { totalStudents: 0, filters: { department, batch, startDate, endDate } },
          funnel: null,
          applicationTrend: [],
          byDepartment: [],
          byBatch: [],
          bySource: [],
          skillDemand: [],
          resumePerformance: []
        }
      });
    }

    // ── 2. FUNNEL ──────────────────────────────────────────────────
    const appStats = await Application.aggregate([
      { $match: appMatch },
      {
        $group: {
          _id: '$user',
          apps: { $sum: 1 },
          interviews: { $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
        }
      }
    ]);

    const totalApps = appStats.reduce((s, r) => s + r.apps, 0);
    const activeStudents = appStats.filter(r => r.apps > 0).length;
    const studentsWithInterview = appStats.filter(r => r.interviews > 0).length;
    const studentsWithOffer = appStats.filter(r => r.offers > 0).length;
    const totalInterviews = appStats.reduce((s, r) => s + r.interviews, 0);
    const totalOffers = appStats.reduce((s, r) => s + r.offers, 0);

    const funnel = {
      stages: [
        { label: 'Total Students', count: totalStudents },
        { label: 'Active Search', count: activeStudents, rate: safeRate(activeStudents, totalStudents) },
        { label: 'Applications', count: totalApps },
        { label: 'Got Interview', count: studentsWithInterview, rate: safeRate(studentsWithInterview, activeStudents) },
        { label: 'Got Offer', count: studentsWithOffer, rate: safeRate(studentsWithOffer, studentsWithInterview) }
      ],
      summary: {
        placementRate: safeRate(studentsWithOffer, totalStudents),
        interviewRate: safeRate(studentsWithInterview, activeStudents),
        offerRate: safeRate(studentsWithOffer, studentsWithInterview)
      }
    };

    // ── 3. MONTHLY TRENDS ─────────────────────────────────────────
    const applicationTrend = await Application.aggregate([
      { $match: appMatch },
      { $group: { _id: { year: { $year: '$dateApplied' }, month: { $month: '$dateApplied' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, year: '$_id.year', month: '$_id.month', applications: '$count' } }
    ]);

    const interviewTrend = await Interview.aggregate([
      { $match: { user: { $in: intSharingIds } } },
      { $group: { _id: { year: { $year: '$scheduledAt' }, month: { $month: '$scheduledAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, year: '$_id.year', month: '$_id.month', interviews: '$count' } }
    ]);

    const offerTrend = await Application.aggregate([
      { $match: { ...appMatch, status: 'Offer' } },
      { $group: { _id: { year: { $year: '$dateApplied' }, month: { $month: '$dateApplied' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, year: '$_id.year', month: '$_id.month', offers: '$count' } }
    ]);

    // ── 4. BY DEPARTMENT ──────────────────────────────────────────
    const deptMap = {};
    students.forEach(s => {
      const d = s.department || 'Unknown';
      if (!deptMap[d]) deptMap[d] = [];
      deptMap[d].push(s._id);
    });

    const byDepartment = await Promise.all(
      Object.entries(deptMap).map(async ([dept, ids]) => {
        const deptApps = await Application.aggregate([
          { $match: { user: { $in: ids }, ...( startDate || endDate ? { dateApplied: appMatch.dateApplied } : {} ) } },
          { $group: {
            _id: null,
            apps: { $sum: 1 },
            interviews: { $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] } },
            offers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
          }}
        ]);
        const stats = deptApps[0] || { apps: 0, interviews: 0, offers: 0 };
        return {
          department: dept,
          students: ids.length,
          applications: stats.apps,
          interviews: stats.interviews,
          offers: stats.offers,
          placementRate: safeRate(stats.offers, ids.length)
        };
      })
    );
    byDepartment.sort((a, b) => b.applications - a.applications);

    // ── 5. BY BATCH ───────────────────────────────────────────────
    const batchMap = {};
    students.forEach(s => {
      const b = s.batch || 'Unknown';
      if (!batchMap[b]) batchMap[b] = [];
      batchMap[b].push(s._id);
    });

    const byBatch = await Promise.all(
      Object.entries(batchMap).map(async ([batchYear, ids]) => {
        const batchApps = await Application.aggregate([
          { $match: { user: { $in: ids }, ...( startDate || endDate ? { dateApplied: appMatch.dateApplied } : {} ) } },
          { $group: {
            _id: null,
            apps: { $sum: 1 },
            interviews: { $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] } },
            offers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
          }}
        ]);
        const stats = batchApps[0] || { apps: 0, interviews: 0, offers: 0 };
        return {
          batch: batchYear,
          students: ids.length,
          applications: stats.apps,
          interviews: stats.interviews,
          offers: stats.offers,
          placementRate: safeRate(stats.offers, ids.length)
        };
      })
    );
    byBatch.sort((a, b) => b.batch - a.batch);

    // ── 6. BY SOURCE ──────────────────────────────────────────────
    const bySource = await Application.aggregate([
      { $match: appMatch },
      {
        $group: {
          _id: { $ifNull: ['$source', 'Unknown'] },
          applications: { $sum: 1 },
          interviews: { $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          source: { $ifNull: ['$_id', 'Not specified'] },
          applications: 1,
          interviews: 1,
          offers: 1
        }
      },
      { $sort: { applications: -1 } }
    ]);

    // Attach safe rates
    const bySourceRated = bySource.map(s => ({
      ...s,
      responseRate: safeRate(s.interviews, s.applications)
    }));

    // ── 7. SKILL DEMAND ───────────────────────────────────────────
    const skillDemand = await JobDescriptionSnapshot.aggregate([
      { $match: { userId: { $in: skillSharingIds } } },
      { $unwind: '$extractedMetadata.skills' },
      { $group: { _id: '$extractedMetadata.skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 25 },
      { $project: { _id: 0, skill: '$_id', count: 1 } }
    ]);

    // ── 8. RESUME PERFORMANCE (aggregate only, privacy-respecting) ─
    const resumePerformance = await Resume.aggregate([
      { $match: { user: { $in: resumeSharingIds } } },
      { $group: {
        _id: '$targetRole',
        count: { $sum: 1 },
        skills: { $push: '$skills' }
      }},
      { $project: { _id: 0, targetRole: { $ifNull: ['$_id', 'General'] }, resumeCount: '$count' } },
      { $sort: { resumeCount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        meta: {
          totalStudents,
          activeStudents,
          totalApplications: totalApps,
          totalInterviews,
          totalOffers,
          filters: { department: department || 'All', batch: batch || 'All', startDate, endDate },
          generatedAt: new Date().toISOString()
        },
        funnel,
        applicationTrend,
        interviewTrend,
        offerTrend,
        byDepartment,
        byBatch,
        bySource: bySourceRated,
        skillDemand,
        resumePerformance
      }
    });

  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/admin/analytics/export ──────────────────────────────────
// ── @desc   Export aggregate placement analytics as CSV
// ── @access Private (Admin + Institution Access)
const exportAnalytics = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      res.status(403);
      return next(new Error('Not bound to institution'));
    }

    const { department, batch, startDate, endDate } = req.query;

    const userMatch = { institutionId, role: 'STUDENT' };
    if (req.user.role === 'MENTOR') {
      userMatch.mentorId = req.user._id;
    }
    if (department) userMatch.department = department;
    if (batch) userMatch.batch = parseInt(batch, 10);

    const students = await User.find(userMatch).select('_id name department batch privacySettings');
    
    // Only include students sharing application progress
    const appSharingIds = students.filter(s => s.privacySettings?.applicationProgress !== false).map(s => s._id);

    const appMatch = { user: { $in: appSharingIds } };
    if (startDate || endDate) {
      appMatch.dateApplied = {};
      if (startDate) appMatch.dateApplied.$gte = new Date(startDate);
      if (endDate) appMatch.dateApplied.$lte = new Date(endDate);
    }

    const byDept = await Application.aggregate([
      { $match: appMatch },
      {
        $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'student' }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.department',
          applications: { $sum: 1 },
          interviews: { $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] } }
        }
      }
    ]);

    // Build CSV rows — aggregate only, no PII
    const rows = [
      ['JobPulse Placement Analytics Export'],
      [`Generated: ${new Date().toISOString()}`],
      [`Filters: Department=${department || 'All'}, Batch=${batch || 'All'}`],
      [],
      ['Department', 'Applications', 'Interviews', 'Offers', 'Placement Rate (%)'],
      ...byDept.map(d => [
        d._id || 'Unknown',
        d.applications,
        d.interviews,
        d.offers,
        d.applications >= MIN_SAMPLE ? Math.round((d.offers / d.applications) * 100) : 'Insufficient data'
      ])
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="jobpulse-analytics-${Date.now()}.csv"`);
    res.send(csv);

  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, exportAnalytics };
