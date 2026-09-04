const User = require('../models/User');
const Application = require('../models/Application');
const JobDescriptionSnapshot = require('../models/JobDescriptionSnapshot');

// ── @route  GET /api/admin/employers ─────────────────────────────────────────
// ── @desc   Get employer-specific intelligence for the institution
// ── @access Private (Admin + Institution Access)
const getEmployerIntelligence = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      res.status(403);
      return next(new Error('Admin is not bound to an institution'));
    }

    const { company: companyFilter, department, batch } = req.query;

    // 1. Build cohort user IDs
    const userMatch = { institutionId, role: 'STUDENT' };
    if (department) userMatch.department = department;
    if (batch) userMatch.batch = parseInt(batch, 10);

    const users = await User.find(userMatch).select('_id privacySettings');
    const userIds = users.map(u => u._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { employers: [], roleDemand: [], skillDemand: [] }
      });
    }

    const appSharingIds = users.filter(u => u.privacySettings?.applicationProgress !== false).map(u => u._id);
    const skillSharingIds = users.filter(u => u.privacySettings?.skills !== false).map(u => u._id);

    const appMatch = { user: { $in: appSharingIds } };
    if (companyFilter) appMatch.company = { $regex: new RegExp(companyFilter, 'i') };

    // ── A. EMPLOYER PERFORMANCE PIPELINE ──────────────────────────────────
    const employerPipeline = [
      { $match: appMatch },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$company' } } },
          company: { $first: '$company' },
          applications: { $sum: 1 },
          interviews: {
            $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] }
          },
          offers: {
            $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] }
          },
          departments: { $addToSet: '$user' }, // Proxy: we join user info below
          roles: { $addToSet: '$role' },
          sources: { $addToSet: '$source' }
        }
      },
      {
        $project: {
          _id: 0,
          company: 1,
          applications: 1,
          interviews: 1,
          offers: 1,
          roles: 1,
          responseRate: {
            $cond: [
              { $gt: ['$applications', 0] },
              { $round: [{ $multiply: [{ $divide: ['$interviews', '$applications'] }, 100] }, 1] },
              0
            ]
          },
          offerRate: {
            $cond: [
              { $gt: ['$applications', 0] },
              { $round: [{ $multiply: [{ $divide: ['$offers', '$applications'] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { applications: -1 } }
    ];

    const employers = await Application.aggregate(employerPipeline);

    // For each employer, add applicant department breakdown
    const enrichedEmployers = [];
    for (const emp of employers) {
      const matchClause = { user: { $in: appSharingIds }, company: { $regex: new RegExp(`^${emp.company}$`, 'i') } };
      const appUsers = await Application.find(matchClause).select('user').lean();
      const appUserIds = appUsers.map(a => a.user);
      const deptBreakdown = await User.aggregate([
        { $match: { _id: { $in: appUserIds } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      enrichedEmployers.push({ ...emp, departmentBreakdown: deptBreakdown });
    }

    // ── B. ROLE DEMAND PIPELINE ─────────────────────────────────────────
    const rolePipeline = [
      { $match: appMatch },
      {
        $group: {
          _id: { $trim: { input: '$role' } },
          applications: { $sum: 1 },
          interviews: {
            $sum: { $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0] }
          },
          companies: { $addToSet: '$company' }
        }
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          applications: 1,
          interviews: 1,
          uniqueCompanies: { $size: '$companies' }
        }
      },
      { $sort: { applications: -1 } },
      { $limit: 20 }
    ];

    const roleDemand = await Application.aggregate(rolePipeline);

    // ── C. SKILL DEMAND PIPELINE (from JD Snapshots) ───────────────────
    const skillPipeline = [
      { $match: { userId: { $in: skillSharingIds } } },
      { $unwind: '$extractedMetadata.skills' },
      {
        $group: {
          _id: '$extractedMetadata.skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 30 },
      { $project: { _id: 0, skill: '$_id', count: 1 } }
    ];

    const skillDemand = await JobDescriptionSnapshot.aggregate(skillPipeline);

    res.status(200).json({
      success: true,
      data: {
        employers: enrichedEmployers,
        roleDemand,
        skillDemand
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployerIntelligence };
