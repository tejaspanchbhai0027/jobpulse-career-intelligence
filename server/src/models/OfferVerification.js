const mongoose = require('mongoose');

const STATUSES = ['PENDING_REVIEW', 'APPROVED', 'REJECTED'];

const offerVerificationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null,
    index: true
  },
  placementDriveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementDrive',
    default: null
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: 150
  },
  jobRole: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true,
    maxlength: 120
  },
  package: {
    type: String,
    default: 'TBD',
    trim: true
  },
  offerDate: {
    type: Date,
    required: true
  },
  joiningDate: {
    type: Date,
    default: null
  },
  proofFileUrl: {
    type: String,
    required: [true, 'Proof document is required']
  },
  proofType: {
    type: String,
    default: 'Offer Letter'
  },
  notes: {
    type: String,
    default: '',
    maxlength: 2000
  },
  status: {
    type: String,
    enum: STATUSES,
    default: 'PENDING_REVIEW',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

offerVerificationSchema.index({ studentId: 1, institutionId: 1 });
offerVerificationSchema.index({ status: 1, institutionId: 1 });

module.exports = mongoose.model('OfferVerification', offerVerificationSchema);
module.exports.STATUSES = STATUSES;
