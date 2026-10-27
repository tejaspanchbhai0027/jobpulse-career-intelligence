const mongoose = require('mongoose');

const STATUSES = ['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const EMPLOYMENT_TYPES = ['Full-Time', 'Internship', 'Apprenticeship'];
const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];

const placementDriveSchema = new mongoose.Schema({
  // Identity
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  assignedPlacementOfficerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Drive title is required'],
    trim: true,
    maxlength: 150
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: 100
  },
  jobRole: {
    type: String,
    required: [true, 'Job role is required'],
    trim: true,
    maxlength: 120
  },
  
  // Recruitment Information
  jobDescription: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: 15000
  },
  employmentType: {
    type: String,
    enum: EMPLOYMENT_TYPES,
    default: 'Full-Time'
  },
  workMode: {
    type: String,
    enum: WORK_MODES,
    default: 'On-site'
  },
  location: {
    type: String,
    default: 'TBD',
    trim: true
  },
  salaryRange: {
    type: String,
    default: 'TBD',
    trim: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  applicationUrl: {
    type: String,
    trim: true,
    default: ''
  },
  selectionProcess: {
    type: String,
    trim: true,
    default: ''
  },

  // Eligibility
  eligibleDepartments: [{
    type: String,
    trim: true
  }],
  eligibleBatches: [{
    type: Number
  }],

  // Schedule
  registrationStartDate: {
    type: Date,
    required: true
  },
  registrationEndDate: {
    type: Date,
    required: true
  },
  driveDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    default: 'TBD',
    trim: true
  },

  // Status
  status: {
    type: String,
    enum: STATUSES,
    default: 'DRAFT',
    index: true
  },

  // Tracking
  registeredStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, { timestamps: true });

// Ensure end date is after start date
placementDriveSchema.pre('validate', function () {
  if (this.registrationStartDate && this.registrationEndDate) {
    if (this.registrationEndDate <= this.registrationStartDate) {
      this.invalidate('registrationEndDate', 'Registration End Date must be after Registration Start Date');
    }
  }
});

// Compound indexes
placementDriveSchema.index({ institutionId: 1, status: 1 });
placementDriveSchema.index({ institutionId: 1, driveDate: -1 });

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
module.exports.STATUSES = STATUSES;
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.WORK_MODES = WORK_MODES;
