const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const JobDescriptionSnapshot = require('../models/JobDescriptionSnapshot');

// ── @route  GET /api/admin/intelligence ───────────────────────────────────────
// ── @desc   Get institutional career intelligence and market demand
// ── @access Private (Admin + Institution Access)
const getInstitutionalIntelligence = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      res.status(403);
      return next(new Error('Admin is not bound to an institution'));
    }

    const { department, batch, role, company, startDate, endDate } = req.query;

    // 1. Build the base user match for filtering by institution and cohort
    const userMatch = { institutionId, role: 'STUDENT' };
    if (department) userMatch.department = department;
    if (batch) userMatch.batch = parseInt(batch, 10);

    // Get all user IDs matching the cohort filters
    const users = await User.find(userMatch).select('_id privacySettings');
    const userIds = users.map(u => u._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          employerSignals: [],
          skillRadar: []
        }
      });
    }

    const appSharingIds = users.filter(u => u.privacySettings?.applicationProgress !== false).map(u => u._id);
    const skillSharingIds = users.filter(u => u.privacySettings?.skills !== false).map(u => u._id);
    const resumeSharingIds = users.filter(u => u.privacySettings?.resume === true).map(u => u._id);

    // 2. Build application match
    const appMatch = { user: { $in: appSharingIds } };
    if (role) appMatch.role = { $regex: new RegExp(role, 'i') };
    if (company) appMatch.company = { $regex: new RegExp(company, 'i') };
    if (startDate || endDate) {
      appMatch.dateApplied = {};
      if (startDate) appMatch.dateApplied.$gte = new Date(startDate);
      if (endDate) appMatch.dateApplied.$lte = new Date(endDate);
    }

    // ── A. EMPLOYER SIGNALS PIPELINE ──────────────────────────────────────────
    const employerPipeline = [
      { $match: appMatch },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$company' } } },
          originalName: { $first: '$company' },
          applications: { $sum: 1 },
          interviews: {
            $sum: {
              $cond: [{ $in: ['$status', ['Interview', 'Offer']] }, 1, 0]
            }
          },
          offers: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0]
            }
          },
          roles: { $addToSet: '$role' }
        }
      },
      {
        $project: {
          _id: 0,
          company: '$originalName',
          applications: 1,
          interviews: 1,
          offers: 1,
          rolesCount: { $size: '$roles' },
          conversionRate: {
            $cond: [
              { $gt: ['$applications', 0] },
              { $multiply: [{ $divide: ['$interviews', '$applications'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { applications: -1 } }
    ];

    const employerSignals = await Application.aggregate(employerPipeline);

    // ── B. SKILL DEMAND RADAR ───────────────────────────────────────────────
    // Market Demand (From Job Description Snapshots)
    const marketDemandPipeline = [
      { $match: { userId: { $in: skillSharingIds } } },
      // Unwind the skills array
      { $unwind: '$extractedMetadata.skills' },
      {
        $group: {
          _id: '$extractedMetadata.skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ];
    const marketDemandRaw = await JobDescriptionSnapshot.aggregate(marketDemandPipeline);
    const marketMap = {};
    let maxMarketCount = 1; // Prevent div by 0
    marketDemandRaw.forEach(item => {
      marketMap[item._id] = item.count;
      if (item.count > maxMarketCount) maxMarketCount = item.count;
    });

    // Student Coverage (From Resumes)
    const coveragePipeline = [
      { $match: { user: { $in: resumeSharingIds }, isDefault: true } },
      // Unwind the skills array
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 }
        }
      }
    ];
    const studentCoverageRaw = await Resume.aggregate(coveragePipeline);
    const coverageMap = {};
    let maxCoverageCount = 1; // Base on total default resumes? Or just max skill count
    const totalUsersWithResumes = await Resume.countDocuments({ user: { $in: resumeSharingIds }, isDefault: true });
    maxCoverageCount = totalUsersWithResumes > 0 ? totalUsersWithResumes : 1;

    studentCoverageRaw.forEach(item => {
      coverageMap[item._id] = item.count;
    });

    // Combine into Skill Radar
    const skillRadar = [];
    // We only care about skills that appear in either market OR student coverage
    const allSkills = new Set([...Object.keys(marketMap), ...Object.keys(coverageMap)]);
    
    allSkills.forEach(skill => {
      const marketCount = marketMap[skill] || 0;
      const coverageCount = coverageMap[skill] || 0;
      
      // Calculate normalized scores (0 to 100)
      const normalizedMarket = Math.round((marketCount / maxMarketCount) * 100);
      const normalizedCoverage = Math.round((coverageCount / maxCoverageCount) * 100);

      skillRadar.push({
        skill,
        marketDemandScore: normalizedMarket,
        studentCoverageScore: normalizedCoverage,
        rawMarketCount: marketCount,
        rawCoverageCount: coverageCount
      });
    });

    // Sort by Market Demand descending
    skillRadar.sort((a, b) => b.marketDemandScore - a.marketDemandScore);

    res.status(200).json({
      success: true,
      data: {
        employerSignals,
        skillRadar: skillRadar.slice(0, 50) // Top 50 skills
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInstitutionalIntelligence
};
