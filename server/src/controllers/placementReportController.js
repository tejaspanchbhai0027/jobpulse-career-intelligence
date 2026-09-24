const mongoose = require('mongoose');
const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');
const User = require('../models/User');

// ── @route  GET /api/admin/placement-reports ──────────────────────────────────
// ── @desc   Return aggregated placement reports (Company, Drive, Department)
// ── @access Private (Admin + Institution Access)
const getReports = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    // 1. Fetch Drives
    const drives = await PlacementDrive.find({ institutionId }).lean();
    const driveIds = drives.map(d => d._id);

    // 2. Fetch Applications linked to these drives
    const applications = await Application.find({ placementDriveId: { $in: driveIds } }).populate('user', 'department batch').lean();

    // 3. Drive-wise Report
    const driveReportMap = {};
    drives.forEach(d => {
      driveReportMap[d._id] = {
        _id: d._id,
        company: d.company,
        role: d.jobRole,
        date: d.driveDate,
        status: d.status,
        registered: d.registeredStudents ? d.registeredStudents.length : 0,
        applications: 0,
        interviews: 0,
        offers: 0
      };
    });

    applications.forEach(app => {
      const dId = app.placementDriveId.toString();
      if (driveReportMap[dId]) {
        driveReportMap[dId].applications += 1;
        if (app.status === 'Interview' || app.status === 'Offer') {
          driveReportMap[dId].interviews += 1;
        }
        if (app.status === 'Offer') {
          driveReportMap[dId].offers += 1;
        }
      }
    });
    const driveReport = Object.values(driveReportMap);

    // 4. Company-wise Report
    const companyReportMap = {};
    drives.forEach(d => {
      const comp = d.company;
      if (!companyReportMap[comp]) {
        companyReportMap[comp] = {
          company: comp,
          drivesCount: 0,
          applications: 0,
          interviews: 0,
          offers: 0
        };
      }
      companyReportMap[comp].drivesCount += 1;
    });
    
    applications.forEach(app => {
      const comp = app.company;
      if (companyReportMap[comp]) {
        companyReportMap[comp].applications += 1;
        if (app.status === 'Interview' || app.status === 'Offer') {
          companyReportMap[comp].interviews += 1;
        }
        if (app.status === 'Offer') {
          companyReportMap[comp].offers += 1;
        }
      }
    });
    const companyReport = Object.values(companyReportMap);

    // 5. Department-wise Report
    const deptReportMap = {};
    
    // First, get all students to count total students per department
    const students = await User.find({ institutionId, role: 'STUDENT' }).select('department').lean();
    students.forEach(s => {
      const dept = s.department || 'Unknown';
      if (!deptReportMap[dept]) {
        deptReportMap[dept] = {
          department: dept,
          totalStudents: 0,
          applications: 0,
          interviews: 0,
          offers: 0,
          placedStudents: new Set()
        };
      }
      deptReportMap[dept].totalStudents += 1;
    });

    applications.forEach(app => {
      if (app.user) {
        const dept = app.user.department || 'Unknown';
        if (deptReportMap[dept]) {
          deptReportMap[dept].applications += 1;
          if (app.status === 'Interview' || app.status === 'Offer') {
            deptReportMap[dept].interviews += 1;
          }
          if (app.status === 'Offer') {
            deptReportMap[dept].offers += 1;
            deptReportMap[dept].placedStudents.add(app.user._id.toString());
          }
        }
      }
    });

    const departmentReport = Object.values(deptReportMap).map(d => ({
      ...d,
      placedCount: d.placedStudents.size,
      placementRate: d.totalStudents > 0 ? Math.round((d.placedStudents.size / d.totalStudents) * 100) : 0,
      placedStudents: undefined // remove the Set before sending
    }));

    res.status(200).json({
      success: true,
      data: {
        companyReport,
        driveReport,
        departmentReport
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports
};
