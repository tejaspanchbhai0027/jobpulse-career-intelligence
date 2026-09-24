const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');

// ── @route  GET /api/admin/placement-verification ─────────────────────────────
// ── @desc   Find incomplete or inconsistent placement records
// ── @access Private (Admin + Institution Access)
const getVerificationAlerts = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const alerts = [];

    // 1. Check for Completed drives that might be missing final results
    // Wait, let's just check for COMPLETED drives that have 0 offers if there were applications.
    const drives = await PlacementDrive.find({ institutionId }).lean();
    const driveIds = drives.map(d => d._id);

    // Fetch all applications for these drives
    const applications = await Application.find({ placementDriveId: { $in: driveIds } }).lean();

    drives.forEach(drive => {
      // Find apps for this drive
      const driveApps = applications.filter(app => app.placementDriveId && app.placementDriveId.toString() === drive._id.toString());
      
      // Check: Drive is completed but no selected students
      if (drive.status === 'COMPLETED' && driveApps.length > 0) {
        const offers = driveApps.filter(a => a.status === 'Offer');
        if (offers.length === 0) {
          alerts.push({
            id: `drive-no-offers-${drive._id}`,
            category: 'Incomplete Result',
            severity: 'High',
            affectedRecord: `${drive.company} - ${drive.jobRole}`,
            explanation: `Drive is marked COMPLETED but no students were marked with 'Offer' status.`,
            action: 'Verify and update student application statuses.'
          });
        }
      }

      // Check: Drive in progress but past drive date by 7 days
      if (drive.status === 'IN_PROGRESS' && drive.driveDate) {
        const diffDays = (new Date() - new Date(drive.driveDate)) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
          alerts.push({
            id: `drive-overdue-${drive._id}`,
            category: 'Missing Information',
            severity: 'Medium',
            affectedRecord: `${drive.company} - ${drive.jobRole}`,
            explanation: `Drive date was over 7 days ago but status is still IN_PROGRESS.`,
            action: 'Update drive status to COMPLETED or CANCELLED.'
          });
        }
      }
    });

    // 2. Application level checks
    applications.forEach(app => {
      // Check: Application is Offer but missing salary
      if (app.status === 'Offer' && (!app.salary || app.salary.trim() === '')) {
        alerts.push({
          id: `app-no-salary-${app._id}`,
          category: 'Missing Information',
          severity: 'Low',
          affectedRecord: `${app.company} - ${app.role}`,
          explanation: `A student has been offered a role, but the salary information is missing.`,
          action: 'Update the application with salary details.'
        });
      }

      // Check: Interview status but no update for 14 days
      if (app.status === 'Interview' && app.updatedAt) {
        const diffDays = (new Date() - new Date(app.updatedAt)) / (1000 * 60 * 60 * 24);
        if (diffDays > 14) {
          alerts.push({
            id: `app-stale-interview-${app._id}`,
            category: 'Requires Verification',
            severity: 'Medium',
            affectedRecord: `${app.company} - ${app.role}`,
            explanation: `Application has been stuck in 'Interview' status for over 14 days.`,
            action: 'Follow up for final selection outcome.'
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      data: alerts
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVerificationAlerts
};
