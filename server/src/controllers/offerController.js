const OfferVerification = require('../models/OfferVerification');
const User = require('../models/User');
const Application = require('../models/Application');
const PlacementDrive = require('../models/PlacementDrive');
const { createNotification } = require('../services/notificationService');

// ── @route  POST /api/offers/student ─────────────────────────────────────────
// ── @desc   Submit an offer claim with proof
// ── @access Private (Student)
exports.createOfferClaim = async (req, res, next) => {
  try {
    const { companyName, jobRole, package, offerDate, joiningDate, proofType, notes, applicationId, placementDriveId } = req.body;
    let { proofFileUrl } = req.body;
    
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only students can submit offers' });
    }

    if (req.file) {
      proofFileUrl = `/api/offers/student/${req.user._id}/${req.file.filename}`; // Placeholder, will fix later, actually we can just store the relative filename.
      // Wait, let's just store the local path or filename, and the download route will serve it.
      proofFileUrl = req.file.filename;
    }

    if (!proofFileUrl) {
      return res.status(400).json({ success: false, message: 'Proof document is required' });
    }

    if (!req.user.institutionId) {
      return res.status(400).json({ success: false, message: 'You must be connected to an institution to submit offers' });
    }

    const offer = await OfferVerification.create({
      studentId: req.user._id,
      institutionId: req.user.institutionId,
      companyName,
      jobRole,
      package,
      offerDate,
      joiningDate,
      proofFileUrl,
      proofType,
      notes,
      applicationId,
      placementDriveId
    });

    if (applicationId) {
      await Application.findByIdAndUpdate(applicationId, { status: 'Offer' });
    }

    const officer = await User.findOne({ role: 'PLACEMENT_OFFICER', institutionId: req.user.institutionId });
    if (officer) {
      await createNotification({
        recipient: officer._id,
        type: 'OFFER_SUBMITTED',
        title: 'New Offer Verification Request',
        message: `${req.user.name} submitted an offer from ${companyName} for verification.`,
        link: `/officer/offers`
      }).catch(err => console.error('Notification error:', err));
    }

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/offers/student ──────────────────────────────────────────
// ── @desc   Get all offers submitted by the student
// ── @access Private (Student)
exports.getStudentOffers = async (req, res, next) => {
  try {
    const offers = await OfferVerification.find({ studentId: req.user._id })
      .populate('placementDriveId', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/offers/student/:id ──────────────────────────────────────
// ── @desc   Get a specific offer details
// ── @access Private (Student)
exports.getStudentOfferById = async (req, res, next) => {
  try {
    const offer = await OfferVerification.findOne({ _id: req.params.id, studentId: req.user._id })
      .populate('placementDriveId', 'title company');
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/offers/mentor/pending ───────────────────────────────────
// ── @desc   Get pending offers for mentor's assigned students
// ── @access Private (Mentor)
exports.getMentorPendingOffers = async (req, res, next) => {
  try {
    const students = await User.find({ mentorId: req.user._id, role: 'STUDENT' }).select('_id');
    const studentIds = students.map(s => s._id);

    const offers = await OfferVerification.find({
      studentId: { $in: studentIds },
      institutionId: req.user.institutionId,
      status: 'PENDING_REVIEW'
    })
      .populate('studentId', 'name email studentId department')
      .populate('placementDriveId', 'title')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/offers/mentor/:id ───────────────────────────────────────
// ── @desc   Get offer details for mentor
// ── @access Private (Mentor)
exports.getMentorOfferById = async (req, res, next) => {
  try {
    const offer = await OfferVerification.findOne({ _id: req.params.id, institutionId: req.user.institutionId })
      .populate('studentId', 'name email studentId department')
      .populate('placementDriveId', 'title');
      
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    
    // Verify it belongs to mentor's student
    const student = await User.findById(offer.studentId);
    if (!student || student.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this offer' });
    }
    
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/offers/mentor/:id/approve (Or officer)
// ── @desc   Approve an offer claim
// ── @access Private (Placement Officer or Mentor)
exports.approveOffer = async (req, res, next) => {
  try {
    const offer = await OfferVerification.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    if (offer.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ success: false, message: 'Offer is not pending review' });
    }

    const student = await User.findById(offer.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (req.user.role === 'MENTOR' && student.mentorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve this offer' });
    }
    // PLACEMENT_OFFICER is authorized by the institution check at the start.

    offer.status = 'APPROVED';
    offer.reviewedBy = req.user._id;
    offer.reviewedAt = new Date();
    await offer.save();

    // Update student placement status
    student.placementStatus = 'PLACED';
    student.placedCompany = offer.companyName;
    await student.save();

    await createNotification({
      recipient: student._id,
      type: 'OFFER_APPROVED',
      title: 'Offer Verified',
      message: `Your offer from ${offer.companyName} has been verified by the Placement Officer.`,
      link: `/applications`
    }).catch(err => console.error('Notification error:', err));

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/offers/mentor/:id/reject (Or officer)
// ── @desc   Reject an offer claim
// ── @access Private (Mentor or Officer)
exports.rejectOffer = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

    const offer = await OfferVerification.findOne({ _id: req.params.id, institutionId: req.user.institutionId });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    const student = await User.findById(offer.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (req.user.role === 'MENTOR' && student.mentorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this offer' });
    }

    offer.status = 'REJECTED';
    offer.rejectionReason = rejectionReason;
    offer.reviewedBy = req.user._id;
    offer.reviewedAt = new Date();
    await offer.save();

    await createNotification({
      recipient: student._id,
      type: 'OFFER_REJECTED',
      title: 'Offer Verification Rejected',
      message: `Your offer from ${offer.companyName} was rejected: ${rejectionReason}`,
      link: `/applications`
    }).catch(err => console.error('Notification error:', err));

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/offers/officer/pending ─────────────────────────────────
// ── @desc   Get pending offers for the institution
// ── @access Private (Placement Officer)
exports.getOfficerPendingOffers = async (req, res, next) => {
  try {
    const offers = await OfferVerification.find({
      institutionId: req.user.institutionId,
      status: 'PENDING_REVIEW'
    })
      .populate('studentId', 'name email studentId department')
      .populate('placementDriveId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/offers/officer/verified ─────────────────────────────────
// ── @desc   Get verified offers for the institution
// ── @access Private (Placement Officer)
exports.getOfficerVerifiedOffers = async (req, res, next) => {
  try {
    const offers = await OfferVerification.find({
      institutionId: req.user.institutionId,
      status: 'APPROVED'
    })
      .populate('studentId', 'name email studentId department placementStatus placedCompany')
      .populate('reviewedBy', 'name email')
      .populate('placementDriveId', 'title')
      .sort({ reviewedAt: -1 });

    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/offers/:id/proof ────────────────────────────────────────
// ── @desc   Download or view the proof document
// ── @access Private (Mentor or Officer or Student)
exports.downloadProof = async (req, res, next) => {
  try {
    const offer = await OfferVerification.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    // Check permissions
    if (req.user.role === 'STUDENT' && offer.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this proof' });
    }
    if (req.user.role === 'MENTOR' || req.user.role === 'PLACEMENT_OFFICER') {
      if (offer.institutionId.toString() !== req.user.institutionId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view proofs from other institutions' });
      }
    }

    // If it's a URL, redirect to it
    if (offer.proofFileUrl && offer.proofFileUrl.startsWith('http')) {
      return res.redirect(offer.proofFileUrl);
    }

    // If it's a local file
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../storage/offers', offer.proofFileUrl);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, message: 'Proof document file not found' });
    }
  } catch (error) {
    next(error);
  }
};
