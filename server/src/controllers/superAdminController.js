const Institution = require('../models/Institution');
const User = require('../models/User');
const Application = require('../models/Application');
const SystemSettings = require('../models/SystemSettings');
const PlacementDrive = require('../models/PlacementDrive');

// ── @route  GET /api/super-admin/dashboard/metrics ───────────────────────────
// ── @desc   Get platform-level metrics
// ── @access Private (SUPER_ADMIN)
const getPlatformMetrics = async (req, res, next) => {
  try {
    const [
      totalInstitutions,
      activeInstitutions, // for simplicity, count all or recent
      totalStudents,
      totalMentors,
      totalApplications,
      totalInterviews,
      totalOffers,
      recentInstitutions,
      totalActiveDrives
    ] = await Promise.all([
      Institution.countDocuments(),
      Institution.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: { $in: ['PLACEMENT_OFFICER', 'MENTOR'] } }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'Interview' }),
      Application.countDocuments({ status: 'Offer' }),
      Institution.find().sort({ createdAt: -1 }).limit(5),
      PlacementDrive.countDocuments({ status: { $in: ['PUBLISHED', 'REGISTRATION_OPEN', 'IN_PROGRESS'] } })
    ]);

    // Platform Activity (last 7 days of applications)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activityAggregation = await Application.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          applications: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Map to a nice array for Recharts
    const platformActivity = activityAggregation.map(item => ({
      date: item._id,
      applications: item.applications
    }));

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalInstitutions,
          activeInstitutions,
          totalStudents,
          totalMentors,
          totalApplications,
          totalInterviews,
          totalOffers,
          totalActiveDrives,
          totalPlacedStudents: totalOffers // For now, Offers == Placed Students
        },
        recentInstitutions,
        platformActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/super-admin/institutions ──────────────────────────────
// ── @desc   Get all institutions with pagination and sorting
// ── @access Private (SUPER_ADMIN)
const getInstitutions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const institutions = await Institution.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Institution.countDocuments(query);

    // Get Admin counts for each
    const adminCounts = await User.aggregate([
      { $match: { role: 'INSTITUTION_ADMIN' } },
      { $group: { _id: '$institutionId', count: { $sum: 1 } } }
    ]);
    
    const studentCounts = await User.aggregate([
      { $match: { role: 'STUDENT' } },
      { $group: { _id: '$institutionId', count: { $sum: 1 } } }
    ]);

    const poCounts = await User.aggregate([
      { $match: { role: 'PLACEMENT_OFFICER' } },
      { $group: { _id: '$institutionId', count: { $sum: 1 } } }
    ]);

    const mentorCounts = await User.aggregate([
      { $match: { role: 'MENTOR' } },
      { $group: { _id: '$institutionId', count: { $sum: 1 } } }
    ]);

    // Map counts to institutions
    const data = institutions.map(inst => {
      const instId = inst._id.toString();
      const hasAdmin = adminCounts.find(a => a._id?.toString() === instId)?.count > 0;
      const studentCount = studentCounts.find(a => a._id?.toString() === instId)?.count || 0;
      const poCount = poCounts.find(a => a._id?.toString() === instId)?.count || 0;
      const mentorCount = mentorCounts.find(a => a._id?.toString() === instId)?.count || 0;

      return {
        ...inst.toObject(),
        hasAdmin,
        studentCount,
        poCount,
        mentorCount
      };
    });

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/super-admin/institutions ─────────────────────────────
// ── @desc   Create a new institution
// ── @access Private (SUPER_ADMIN)
const createInstitution = async (req, res, next) => {
  try {
    const { name, code, location, websiteUrl, placementSeason, graduationYear, departments, city, state, contactEmail } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Institution Name and Code are required' });
    }

    // Explicitly check for code uniqueness to provide a clean error message
    const existing = await Institution.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `An institution with code '${code.toUpperCase()}' already exists.` });
    }

    const newInstitution = await Institution.create({
      name,
      code,
      location,
      websiteUrl,
      placementSeason,
      graduationYear,
      departments,
      city,
      state,
      contactEmail
    });

    res.status(201).json({
      success: true,
      data: newInstitution
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/super-admin/institutions/:id/admin ────────────────
// ── @desc   Create the initial INSTITUTION_ADMIN for an institution
// ── @access Private (SUPER_ADMIN)
const createInstitutionAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use.' });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'INSTITUTION_ADMIN',
      institutionId: institution._id
    });

    res.status(201).json({
      success: true,
      message: 'Institution Admin created successfully',
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/super-admin/institutions/:id ────────────────────────────
// ── @desc   Get institution details including its admin and counts
// ── @access Private (Super Admin)
const getInstitutionById = async (req, res, next) => {
  try {
    const institutionId = req.params.id;
    const institution = await Institution.findById(institutionId);

    if (!institution) {
      res.status(404);
      return next(new Error('Institution not found'));
    }

    const admin = await User.findOne({ institutionId, role: 'INSTITUTION_ADMIN' });
    const studentCount = await User.countDocuments({ institutionId, role: 'STUDENT' });
    const poCount = await User.countDocuments({ institutionId, role: 'PLACEMENT_OFFICER' });
    const mentorCount = await User.countDocuments({ institutionId, role: 'MENTOR' });

    res.status(200).json({
      success: true,
      data: {
        institution,
        admin,
        stats: {
          studentCount,
          poCount,
          mentorCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/super-admin/institutions/:id/status ───────────────────
// ── @desc   Activate or Deactivate an institution
// ── @access Private (Super Admin)
const updateInstitutionStatus = async (req, res, next) => {
  try {
    const institutionId = req.params.id;
    const { isActive } = req.body;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      res.status(404);
      return next(new Error('Institution not found'));
    }

    institution.isActive = isActive;
    await institution.save();

    res.status(200).json({
      success: true,
      message: `Institution ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: institution
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/super-admin/settings ───────────────────────────
// ── @desc   Get system settings
// ── @access Private (Super Admin)
const getSystemSettings = async (req, res, next) => {
  try {
    const isResendConfigured = !!process.env.RESEND_API_KEY;
    const senderEmail = process.env.FROM_EMAIL || 'JobPulse <onboarding@resend.dev>';
    
    res.status(200).json({ 
      success: true, 
      data: {
        isResendConfigured,
        senderEmail,
        provider: 'Resend'
      } 
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/super-admin/settings/test-email ────────────────
// ── @desc   Send a test email to the Super Admin
// ── @access Private (Super Admin)
const sendTestEmailRoute = async (req, res, next) => {
  try {
    const { sendTestEmail } = require('../services/emailService');
    const user = req.user; // Set by auth middleware
    
    const { error } = await sendTestEmail({ to: user.email, name: user.name });
    
    if (error) {
      res.status(500);
      return next(new Error('Test email failed to send: ' + error.message));
    }
    
    res.status(200).json({ success: true, message: 'Test email sent successfully to ' + user.email });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/super-admin/institutions/:id ───────────────────────────
// ── @desc   Update an institution's details
// ── @access Private (Super Admin)
const updateInstitution = async (req, res, next) => {
  try {
    const institutionId = req.params.id;
    const updates = req.body;
    
    // Prevent modification of the institution code and isActive through this route
    delete updates.code;
    delete updates.isActive;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      res.status(404);
      return next(new Error('Institution not found'));
    }

    const updatedInstitution = await Institution.findByIdAndUpdate(
      institutionId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Institution updated successfully',
      data: updatedInstitution
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/super-admin/institutions/:id ─────────────────────────
// ── @desc   Hard delete an institution and cascade delete all its related data
// ── @access Private (Super Admin)
const deleteInstitution = async (req, res, next) => {
  try {
    const institutionId = req.params.id;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      res.status(404);
      return next(new Error('Institution not found'));
    }

    // 1. Find all users belonging to this institution
    const users = await User.find({ institutionId });
    const userIds = users.map(u => u._id);

    if (userIds.length > 0) {
      // 2. Delete all records referencing these users
      const Application = require('../models/Application');
      const Interview = require('../models/Interview');
      const Task = require('../models/Task');
      const Resume = require('../models/Resume');
      const InterventionSignal = require('../models/InterventionSignal');
      const MentorFeedback = require('../models/MentorFeedback');

      await Application.deleteMany({ user: { $in: userIds } });
      await Interview.deleteMany({ user: { $in: userIds } });
      await Task.deleteMany({ user: { $in: userIds } });
      await Resume.deleteMany({ user: { $in: userIds } });
      await InterventionSignal.deleteMany({ user: { $in: userIds } });
      await MentorFeedback.deleteMany({
        $or: [
          { mentorId: { $in: userIds } },
          { studentId: { $in: userIds } }
        ]
      });

      // 3. Delete the users
      await User.deleteMany({ institutionId });
    }

    // 4. Delete institution specific data
    const PlacementDrive = require('../models/PlacementDrive');
    const PlacementAudit = require('../models/PlacementAudit');
    await PlacementDrive.deleteMany({ institutionId });
    if (PlacementAudit) await PlacementAudit.deleteMany({ institutionId });

    // 5. Finally, delete the institution itself
    await Institution.findByIdAndDelete(institutionId);

    res.status(200).json({
      success: true,
      message: 'Institution and all associated data have been permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformMetrics,
  getInstitutions,
  createInstitution,
  getInstitutionById,
  updateInstitutionStatus,
  updateInstitution,
  deleteInstitution,
  createInstitutionAdmin,
  getSystemSettings,
  sendTestEmailRoute
};
