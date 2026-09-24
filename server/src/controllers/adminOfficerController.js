const mongoose = require('mongoose');
const User = require('../models/User');

// ── @route  GET /api/admin/officers ───────────────────────────────────────────
// ── @desc   Get all institution admins and placement officers
// ── @access Private (Institution Admin)
const getOfficers = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    
    let query = { institutionId };
    
    if (req.user.role === 'PLACEMENT_OFFICER') {
      // Should not be called by PO anymore (they have their own routes), but just in case
      query.placementOfficerId = req.user._id;
      query.role = 'MENTOR';
    } else {
      // INSTITUTION_ADMIN sees PLACEMENT_OFFICERs
      query.role = 'PLACEMENT_OFFICER';
    }
    
    const officers = await User.find(query).select('_id name email role isActive lastLogin createdAt');

    // Aggregate counts if it's INSTITUTION_ADMIN viewing POs
    let data = officers.map(o => o.toObject());
    
    if (req.user.role === 'INSTITUTION_ADMIN') {
      const officerIds = officers.map(o => o._id);
      
      const mentorCounts = await User.aggregate([
        { $match: { institutionId, role: 'MENTOR', placementOfficerId: { $in: officerIds } } },
        { $group: { _id: '$placementOfficerId', count: { $sum: 1 } } }
      ]);
      
      const studentCounts = await User.aggregate([
        { $match: { institutionId, role: 'STUDENT', placementOfficerId: { $in: officerIds } } },
        { $group: { _id: '$placementOfficerId', count: { $sum: 1 } } }
      ]);

      const mentorMap = {};
      mentorCounts.forEach(c => mentorMap[c._id.toString()] = c.count);
      
      const studentMap = {};
      studentCounts.forEach(c => studentMap[c._id.toString()] = c.count);

      data = data.map(o => ({
        ...o,
        mentorCount: mentorMap[o._id.toString()] || 0,
        studentCount: studentMap[o._id.toString()] || 0
      }));
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/admin/officers ──────────────────────────────────────────
// ── @desc   Invite a new placement officer or admin
// ── @access Private (Institution Admin)
const inviteOfficer = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      res.status(400);
      return next(new Error('Name, email, and role are required'));
    }

    let allowedRoles = [];
    if (req.user.role === 'INSTITUTION_ADMIN') {
      allowedRoles = ['PLACEMENT_OFFICER'];
    } else if (req.user.role === 'PLACEMENT_OFFICER') {
      allowedRoles = ['MENTOR'];
    }

    if (!allowedRoles.includes(role)) {
      res.status(403);
      return next(new Error(`Unauthorized to invite role: ${role}`));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      return next(new Error('An account with this email already exists'));
    }

    // Create the officer with a temporary password
    // In a real app, you would send an invite email with a reset password link.
    // Since this is a demo, we will use a generic password.
    const tempPassword = req.body.password || 'password123';

    const newOfficer = await User.create({
      name,
      email,
      password: tempPassword,
      role,
      institutionId,
      placementOfficerId: role === 'MENTOR' ? req.user._id : null
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newOfficer._id,
        name: newOfficer.name,
        email: newOfficer.email,
        role: newOfficer.role,
        isActive: newOfficer.isActive,
        createdAt: newOfficer.createdAt
      },
      message: `Officer invited successfully. Password set.`
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/admin/officers/:id ─────────────────────────────────────
// ── @desc   Update officer status (activate/deactivate) or role
// ── @access Private (Institution Admin)
const updateOfficer = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { isActive, role } = req.body;
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      res.status(400);
      return next(new Error('Invalid officer ID'));
    }

    let query = { _id: targetId, institutionId };
    if (req.user.role === 'PLACEMENT_OFFICER') {
      query.placementOfficerId = req.user._id;
      query.role = 'MENTOR';
    } else {
      query.role = { $in: ['INSTITUTION_ADMIN', 'PLACEMENT_OFFICER', 'MENTOR'] };
    }

    const officer = await User.findOne(query);

    if (!officer) {
      res.status(404);
      return next(new Error('Officer not found or unauthorized'));
    }

    // Protection: Ensure there's at least one active INSTITUTION_ADMIN left
    if ((['PLACEMENT_OFFICER', 'MENTOR'].includes(role) || isActive === false) && officer.role === 'INSTITUTION_ADMIN') {
      const adminCount = await User.countDocuments({
        institutionId,
        role: 'INSTITUTION_ADMIN',
        isActive: true,
        _id: { $ne: targetId }
      });

      if (adminCount === 0) {
        res.status(400);
        return next(new Error('Cannot modify the last active Institution Admin'));
      }
    }

    if (isActive !== undefined) officer.isActive = isActive;
    if (req.body.name) officer.name = req.body.name;
    if (req.body.email) officer.email = req.body.email;
    // Disallow role changes for now to prevent hierarchy violations
    // if (role && allowedRoles.includes(role)) { officer.role = role; }

    await officer.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        isActive: officer.isActive,
        lastLogin: officer.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/admin/officers/:id ────────────────────────────────────
// ── @desc   Remove access for an officer (Deletes the user account for privacy)
// ── @access Private (Institution Admin)
const removeOfficer = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      res.status(400);
      return next(new Error('Invalid officer ID'));
    }

    let query = { _id: targetId, institutionId };
    if (req.user.role === 'PLACEMENT_OFFICER') {
      query.placementOfficerId = req.user._id;
      query.role = 'MENTOR';
    } else {
      query.role = { $in: ['INSTITUTION_ADMIN', 'PLACEMENT_OFFICER', 'MENTOR'] };
    }

    const officer = await User.findOne(query);

    if (!officer) {
      res.status(404);
      return next(new Error('Officer not found or unauthorized'));
    }

    // Protection: Ensure there's at least one active INSTITUTION_ADMIN left
    if (officer.role === 'INSTITUTION_ADMIN') {
      const adminCount = await User.countDocuments({
        institutionId,
        role: 'INSTITUTION_ADMIN',
        isActive: true,
        _id: { $ne: targetId }
      });

      if (adminCount === 0) {
        res.status(400);
        return next(new Error('Cannot remove the last active Institution Admin'));
      }
    }

    // Delete the user account
    await User.findByIdAndDelete(targetId);

    res.status(200).json({
      success: true,
      message: 'Officer removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/admin/officers/organization ────────────────────────────────
// ── @desc   Get the hierarchical organization overview (Officers -> Mentors)
// ── @access Private (Institution Admin)
const getOrganizationHierarchy = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    // Fetch all POs in the institution
    const officers = await User.find({ institutionId, role: 'PLACEMENT_OFFICER' })
      .select('_id name email isActive');

    // For each PO, fetch their mentors and count their students
    const hierarchy = await Promise.all(officers.map(async (officer) => {
      // Find mentors for this PO
      const mentors = await User.find({ institutionId, role: 'MENTOR', placementOfficerId: officer._id })
        .select('_id name department isActive');
      
      // For each mentor, find their student count
      const mentorsWithCounts = await Promise.all(mentors.map(async (mentor) => {
        const studentCount = await User.countDocuments({ institutionId, role: 'STUDENT', mentorId: mentor._id });
        return {
          _id: mentor._id,
          name: mentor.name,
          department: mentor.department,
          isActive: mentor.isActive,
          studentCount
        };
      }));

      // Count total students under this officer directly or via mentors
      // A student's PO might be implied by their mentor, but let's count all students attached to mentors under this PO
      let totalStudents = 0;
      mentorsWithCounts.forEach(m => totalStudents += m.studentCount);

      return {
        _id: officer._id,
        name: officer.name,
        email: officer.email,
        isActive: officer.isActive,
        mentorCount: mentors.length,
        studentCount: totalStudents,
        mentors: mentorsWithCounts
      };
    }));

    res.status(200).json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/admin/officers/:id ─────────────────────────────────────────
// ── @desc   Get specific officer and their mentors
// ── @access Private (Institution Admin)
const getOfficerById = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid officer ID'));
    }

    const officer = await User.findOne({ _id: id, institutionId, role: { $in: ['PLACEMENT_OFFICER', 'INSTITUTION_ADMIN'] } })
      .select('_id name email role isActive');

    if (!officer) {
      res.status(404);
      return next(new Error('Officer not found'));
    }

    // If it's a PO, fetch their mentors
    let mentorsWithCounts = [];
    if (officer.role === 'PLACEMENT_OFFICER') {
      const mentors = await User.find({ institutionId, role: 'MENTOR', placementOfficerId: officer._id })
        .select('_id name department isActive');
        
      mentorsWithCounts = await Promise.all(mentors.map(async (mentor) => {
        const studentCount = await User.countDocuments({ institutionId, role: 'STUDENT', mentorId: mentor._id });
        return {
          _id: mentor._id,
          name: mentor.name,
          department: mentor.department,
          isActive: mentor.isActive,
          studentCount
        };
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        ...officer.toObject(),
        mentors: mentorsWithCounts
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOfficers,
  inviteOfficer,
  updateOfficer,
  removeOfficer,
  getOrganizationHierarchy,
  getOfficerById
};
