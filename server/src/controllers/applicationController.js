const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Application = require('../models/Application');
const ApplicationEvent = require('../models/ApplicationEvent');
const JobDescriptionSnapshot = require('../models/JobDescriptionSnapshot');
const { sendOfferEmail } = require('../services/emailService');

// ── @route  GET /api/applications ─────────────────────────────────────────────
// ── @desc   Get all applications for the logged-in user
// ── @access Private
const getApplications = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };

    // Optional status filter via query param (?status=Applied)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await Application.find(filter)
      .populate('resumeId', 'name version targetRole')
      .sort({ updatedAt: -1 });

    // Compute possibleGhostJob on read (not stored)
    const now = new Date()
    const GHOST_JOB_DAYS = 21
    const appsWithFlags = applications.map(app => {
      const obj = app.toObject()
      const daysSinceApplied = (now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24)
      obj.possibleGhostJob = (
        !app.salary &&
        daysSinceApplied > GHOST_JOB_DAYS &&
        app.status === 'Applied'
      )
      return obj
    })

    res.status(200).json({
      success: true,
      count: appsWithFlags.length,
      data:  appsWithFlags,
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/applications ────────────────────────────────────────────
// ── @desc   Create a new application
// ── @access Private
const createApplication = asyncHandler(async (req, res) => {
  const {
    company, role, jobUrl, status, dateApplied, notes, contact,
    type, closingDate, isPriority, salary, source, resumeVersion, resumeId, jobDescription, needsFollowUp,
  } = req.body;

  const application = await Application.create({
    user: req.user._id,
    company,
    role,
    status:        status        ?? 'Wishlist',
    dateApplied:   dateApplied   ?? new Date(),
    jobUrl:        jobUrl        ?? '',
    notes:         notes         ?? '',
    contact:       contact       ?? '',
    type:          type          ?? 'Full-time',
    closingDate:   closingDate   ?? null,
    isPriority:    isPriority    ?? false,
    salary:        salary        ?? '',
    source:        source        ?? '',
    resumeVersion: resumeVersion ?? '',
    resumeId:      resumeId      || null,
    jobDescription: jobDescription ?? '',
    needsFollowUp: needsFollowUp ?? false,
  });

  // Log Event
  await ApplicationEvent.create({
    userId: req.user._id,
    applicationId: application._id,
    type: 'APPLICATION_CREATED',
    newValue: { status: application.status },
    metadata: { source, company, role }
  });

  if (jobDescription && jobDescription.trim() !== '') {
    const hash = crypto.createHash('md5').update(jobDescription).digest('hex');
    await JobDescriptionSnapshot.create({
      userId: req.user._id,
      applicationId: application._id,
      content: jobDescription,
      contentHash: hash,
    });
  }

  res.status(201).json({ success: true, data: application });
});

// ── @route  PUT /api/applications/:id ────────────────────────────────────────
// ── @desc   Update an application (status change, notes, etc.)
// ── @access Private
const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  const previousStatus = application.status;
  const previousPriority = application.isPriority;
  const previousIsGhosted = application.isGhosted;

  // Only allow updating safe fields
  const allowedFields = ['company', 'role', 'jobUrl', 'status', 'dateApplied', 'notes', 'contact', 'needsFollowUp', 'lastFollowUpAt', 'type', 'closingDate', 'isPriority', 'salary', 'source', 'resumeVersion', 'resumeId', 'isGhosted', 'ghostedAt', 'nextAction', 'followUpDate', 'followUpStatus', 'lastContactedDate', 'followUpNotes'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      application[field] = req.body[field];
    }
  });

  // When status moves away from "Applied", clear follow-up flags
  if (req.body.status && req.body.status !== 'Applied') {
    application.needsFollowUp    = false;
    application.followUpNotified = false;
  }

  // Check JD changes before saving
  const oldJd = application.jobDescription;
  
  await application.save();

  if (req.body.jobDescription && req.body.jobDescription !== oldJd) {
    const hash = crypto.createHash('md5').update(req.body.jobDescription).digest('hex');
    // Check if we already have this exact hash to avoid duplicates
    const existing = await JobDescriptionSnapshot.findOne({ applicationId: application._id, contentHash: hash });
    if (!existing) {
      await JobDescriptionSnapshot.create({
        userId: req.user._id,
        applicationId: application._id,
        content: req.body.jobDescription,
        contentHash: hash
      });
    }
  }

  // Log status change
  if (req.body.status && req.body.status !== previousStatus) {
    await ApplicationEvent.create({
      userId: req.user._id,
      applicationId: application._id,
      type: 'STATUS_CHANGED',
      previousValue: previousStatus,
      newValue: req.body.status
    });
  }

  // Log priority change
  if (req.body.isPriority !== undefined && req.body.isPriority !== previousPriority) {
    await ApplicationEvent.create({
      userId: req.user._id,
      applicationId: application._id,
      type: 'PRIORITY_CHANGED',
      previousValue: previousPriority,
      newValue: req.body.isPriority
    });
  }

  // Ghosting toggle
  if (req.body.isGhosted !== undefined && req.body.isGhosted !== previousIsGhosted) {
    await ApplicationEvent.create({
      userId: req.user._id,
      applicationId: application._id,
      type: 'GHOSTED',
      newValue: req.body.isGhosted
    });
  }

  res.status(200).json({ success: true, data: application });
});

// ── @route  DELETE /api/applications/:id ──────────────────────────────────────
// ── @desc   Delete an application
// ── @access Private
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!application) {
      res.status(404);
      return next(new Error('Application not found'));
    }

    if (application.placementDriveId) {
      const PlacementDrive = require('../models/PlacementDrive');
      await PlacementDrive.findByIdAndUpdate(application.placementDriveId, {
        $pull: { registeredStudents: req.user.id }
      });
    }

    res.status(200).json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/applications/needs-followup ─────────────────────────────
// ── @desc   Get applications flagged by the nudge engine
// ── @access Private
const getApplicationsNeedingFollowUp = async (req, res, next) => {
  try {
    const applications = await Application.find({
      user: req.user.id,
      needsFollowUp: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/applications/export?format=csv|json ──────────────────────
// ── @desc   Export all user applications as CSV or JSON
// ── @access Private
const exportApplications = async (req, res, next) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const applications = await Application.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Compute possibleGhostJob for each
    const now = new Date();
    const GHOST_JOB_DAYS = 21;
    const rows = applications.map(app => {
      const obj = app.toObject();
      const daysSince = (now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24);
      obj.possibleGhostJob = (!app.salary && daysSince > GHOST_JOB_DAYS && app.status === 'Applied');
      return obj;
    });

    if (format === 'csv') {
      const COLUMNS = [
        'company','role','status','type','dateApplied','closingDate',
        'jobUrl','contact','notes','salary','source','resumeVersion',
        'isPriority','needsFollowUp','isGhosted','possibleGhostJob',
      ];
      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val instanceof Date ? val.toISOString().split('T')[0] : val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const header = COLUMNS.join(',');
      const lines  = rows.map(row => COLUMNS.map(col => escapeCSV(row[col])).join(','));
      const csv    = [header, ...lines].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="jobpulse-export-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    // Default: JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="jobpulse-export-${Date.now()}.json"`);
    return res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Application Timeline
// @route   GET /api/applications/:id/timeline
// @access  Private
const getApplicationTimeline = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Ensure user owns application
  if (application.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to access this application');
  }

  const events = await ApplicationEvent.find({ applicationId: req.params.id })
    .sort('createdAt'); // oldest first for chronological timeline

  res.status(200).json({ success: true, data: events });
});

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationsNeedingFollowUp,
  exportApplications,
  getApplicationTimeline,
};
