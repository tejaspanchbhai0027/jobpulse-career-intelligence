const mongoose = require('mongoose');
const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');
const User = require('../models/User');
const PlacementAudit = require('../models/PlacementAudit');

// ── @route  POST /api/placement-drives ───────────────────────────────────────
// ── @desc   Create a new placement drive
// ── @access Private (Institution Admin)
exports.createDrive = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    
    const drive = await PlacementDrive.create({
      ...req.body,
      institutionId
    });

    // Generate Audit Log
    await PlacementAudit.create({
      institutionId,
      action: 'DRIVE_CREATED',
      actor: req.user._id,
      entityId: drive._id,
      entityModel: 'PlacementDrive',
      details: { title: drive.title, company: drive.company }
    });

    res.status(201).json({ success: true, data: drive });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/placement-drives ─────────────────────────────────────────
// ── @desc   Get all placement drives for the institution
// ── @access Private (Admin, PO, Mentor)
exports.getDrives = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { status, company } = req.query;
    
    let filter = { institutionId };
    
    if (status) filter.status = status;
    if (company) filter.company = { $regex: new RegExp(company, 'i') };
    
    // Role-based visibility
    if (req.user.role === 'PLACEMENT_OFFICER') {
      // POs can see all drives, but perhaps we highlight their own
      // For now, they can see all drives in the institution, just like students/mentors can see published ones
      // Let's restrict them to see all, but they can only manage their assigned ones (enforced in update)
    } else if (req.user.role === 'MENTOR') {
      // Mentors should only see PUBLISHED or later drives
      filter.status = { $in: ['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED'] };
    }

    const drives = await PlacementDrive.find(filter)
      .populate('assignedPlacementOfficerId', 'name email')
      .sort({ driveDate: 1 });

    res.status(200).json({ success: true, data: drives });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/placement-drives/:id ──────────────────────────────────────
// ── @desc   Get single placement drive by ID
// ── @access Private (Admin, PO, Mentor, Student)
exports.getDriveById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Drive ID' });
    }

    const drive = await PlacementDrive.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    }).populate('assignedPlacementOfficerId', 'name email')
      .populate('registeredStudents', 'name email department batch');

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement Drive not found' });
    }

    res.status(200).json({ success: true, data: drive });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/placement-drives/:id ────────────────────────────────────
// ── @desc   Update a placement drive
// ── @access Private (Institution Admin, Assigned PO)
exports.updateDrive = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Drive ID' });
    }

    const drive = await PlacementDrive.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement Drive not found' });
    }

    // Auth check: Must be Admin OR the assigned PO
    const isAdmin = ['INSTITUTION_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const isAssignedPO = drive.assignedPlacementOfficerId?.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAssignedPO) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this drive' });
    }

    // Update fields securely
    const updates = req.body;
    delete updates.institutionId; // Immutable
    delete updates.registeredStudents; // Managed via register endpoint

    // Only admin can re-assign PO
    if (!isAdmin) {
      delete updates.assignedPlacementOfficerId;
    }

    const updatedDrive = await PlacementDrive.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('assignedPlacementOfficerId', 'name email');

    await PlacementAudit.create({
      institutionId: req.user.institutionId,
      action: 'DRIVE_UPDATED',
      actor: req.user._id,
      entityId: updatedDrive._id,
      entityModel: 'PlacementDrive',
      details: { updatedFields: Object.keys(updates) }
    });

    res.status(200).json({ success: true, data: updatedDrive });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/placement-drives/:id/status ─────────────────────────────
// ── @desc   Update placement drive status
// ── @access Private (Institution Admin, Assigned PO)
exports.updateDriveStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Drive ID' });
    }

    const { status } = req.body;
    if (!PlacementDrive.STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const drive = await PlacementDrive.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement Drive not found' });
    }

    const isAdmin = ['INSTITUTION_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const isAssignedPO = drive.assignedPlacementOfficerId?.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAssignedPO) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this drive' });
    }

    drive.status = status;
    await drive.save();

    await PlacementAudit.create({
      institutionId: req.user.institutionId,
      action: 'STATUS_CHANGED',
      actor: req.user._id,
      entityId: drive._id,
      entityModel: 'PlacementDrive',
      details: { newStatus: status }
    });

    res.status(200).json({ success: true, data: drive });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/placement-drives/available ────────────────────────────────
// ── @desc   Get published placement drives that the student is eligible for
// ── @access Private (Student)
exports.getAvailableDrives = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const student = await User.findById(req.user._id).select('department batch');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Must be in a state visible to students
    const visibleStatuses = ['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED'];

    // Eligibility Pipeline: 
    // If eligibleDepartments is empty, it means all departments are eligible.
    // If eligibleBatches is empty, it means all batches are eligible.
    const drives = await PlacementDrive.find({
      institutionId,
      status: { $in: visibleStatuses },
      $and: [
        {
          $or: [
            { eligibleDepartments: { $size: 0 } },
            { eligibleDepartments: student.department }
          ]
        },
        {
          $or: [
            { eligibleBatches: { $size: 0 } },
            { eligibleBatches: student.batch }
          ]
        }
      ]
    }).sort({ driveDate: 1 }).lean();

    // Map registered state
    const mappedDrives = drives.map(d => ({
      ...d,
      isRegistered: d.registeredStudents.some(id => id.toString() === req.user._id.toString())
    }));

    res.status(200).json({ success: true, data: mappedDrives });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/placement-drives/:id/register ────────────────────────────
// ── @desc   Register for a placement drive
// ── @access Private (Student)
exports.registerForDrive = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Drive ID' });
    }

    const institutionId = req.user.institutionId;
    const drive = await PlacementDrive.findOne({
      _id: req.params.id,
      institutionId
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement Drive not found' });
    }

    // Validation checks
    if (drive.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ success: false, message: 'Registration is not open for this drive' });
    }

    const now = new Date();
    if (now < drive.registrationStartDate || now > drive.registrationEndDate) {
      return res.status(400).json({ success: false, message: 'Registration window is closed' });
    }

    // Eligibility check
    const student = await User.findById(req.user._id).select('department batch');
    if (drive.eligibleDepartments.length > 0 && !drive.eligibleDepartments.includes(student.department)) {
      return res.status(403).json({ success: false, message: 'Your department is not eligible for this drive' });
    }
    if (drive.eligibleBatches.length > 0 && !drive.eligibleBatches.includes(student.batch)) {
      return res.status(403).json({ success: false, message: 'Your batch is not eligible for this drive' });
    }

    // Duplicate check
    if (drive.registeredStudents.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are already registered for this drive' });
    }

    // Begin Registration & Application Generation
    drive.registeredStudents.push(req.user._id);
    await drive.save();

    // Create linked Application
    const application = await Application.create({
      user: req.user._id,
      placementDriveId: drive._id,
      company: drive.company,
      role: drive.jobRole,
      status: 'Applied',
      source: 'Institution',
      location: drive.location,
      salary: drive.salaryRange,
      jobDescription: drive.jobDescription
    });

    res.status(200).json({ success: true, message: 'Successfully registered for the drive', data: application });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/placement-drives/:id/statistics ──────────────────────────
// ── @desc   Get aggregated statistics for a specific placement drive
// ── @access Private (Admin, PO)
exports.getDriveStatistics = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Drive ID' });
    }

    const drive = await PlacementDrive.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement Drive not found' });
    }

    // Determine total eligible students
    let eligibleQuery = { institutionId: req.user.institutionId, role: 'STUDENT' };
    if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0) {
      eligibleQuery.department = { $in: drive.eligibleDepartments };
    }
    if (drive.eligibleBatches && drive.eligibleBatches.length > 0) {
      eligibleQuery.batch = { $in: drive.eligibleBatches };
    }
    const eligibleCount = await User.countDocuments(eligibleQuery);

    const registeredCount = drive.registeredStudents ? drive.registeredStudents.length : 0;

    const applications = await Application.find({ placementDriveId: drive._id });
    const applicationCount = applications.length;
    
    let interviewCount = 0;
    let offerCount = 0;
    let placedCount = 0;

    applications.forEach(app => {
      if (app.status === 'Interview' || app.status === 'Offer') {
        interviewCount++;
      }
      if (app.status === 'Offer') {
        offerCount++;
        placedCount++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        eligibleCount,
        registeredCount,
        applicationCount,
        interviewCount,
        offerCount,
        placedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/placement-drives/:id ───────────────────────────────────
// ── @desc   Delete a placement drive
// ── @access Private (Institution Admin)
exports.deleteDrive = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid Drive ID' });
    }

    const drive = await PlacementDrive.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement Drive not found' });
    }

    const isAdmin = ['INSTITUTION_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only administrators can delete placement drives' });
    }

    // Delete associated applications
    await Application.deleteMany({ placementDriveId: drive._id });

    await PlacementDrive.findByIdAndDelete(req.params.id);

    await PlacementAudit.create({
      institutionId: req.user.institutionId,
      action: 'DRIVE_DELETED',
      actor: req.user._id,
      entityId: drive._id,
      entityModel: 'PlacementDrive',
      details: { title: drive.title, company: drive.company }
    });

    res.status(200).json({ success: true, message: 'Placement drive deleted successfully' });
  } catch (error) {
    next(error);
  }
};
