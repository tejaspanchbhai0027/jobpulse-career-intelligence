const mongoose = require('mongoose');

const STATUSES = ['Wishlist', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
      maxlength: [120, 'Role cannot exceed 120 characters'],
    },
    jobUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Wishlist',
    },
    dateApplied: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },
    jobDescription: {
      type: String,
      default: '',
      maxlength: [15000, 'Job description cannot exceed 15000 characters'],
    },
    contact: {
      type: String,
      default: '',
      trim: true,
    },
    // ── Follow-Up Engine fields (used by Phase 4 cron job) ─────────────────
    needsFollowUp: {
      type: Boolean,
      default: false,
    },
    lastFollowUpAt: {
      type: Date,
      default: null,
    },
    followUpNotified: {
      type: Boolean,
      default: false,
    },
    // ── Phase 6 — Extended Application Fields ──────────────────────────────
    type: {
      type: String,
      enum: ['Full-time', 'Internship', 'Part-time', 'Contract'],
      default: 'Full-time',
    },
    closingDate: {
      type: Date,
      default: null,
    },
    isPriority: {
      type: Boolean,
      default: false,
    },
    salary: {
      type: String,
      default: '',
      trim: true,
    },
    source: {
      type: String,
      enum: ['LinkedIn', 'Referral', 'Company Website', 'Naukri', 'Indeed', 'Other', ''],
      default: '',
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    resumeVersion: {
      type: String,
      default: '',
      trim: true,
    },
    // ── Ghost detection fields ─────────────────────────────────────────────
    isGhosted: {
      type: Boolean,
      default: false,
    },
    ghostedAt: {
      type: Date,
      default: null,
    },
    // ── Notification state fields ──────────────────────────────────────────
    deadlineNotified: {
      type: Boolean,
      default: false,
    },
    offerNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient per-user queries
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ user: 1, updatedAt: -1 });
applicationSchema.index({ user: 1, needsFollowUp: 1 });
applicationSchema.index({ user: 1, isGhosted: 1 });
applicationSchema.index({ user: 1, isPriority: 1 });
applicationSchema.index({ user: 1, closingDate: 1 });
applicationSchema.index({ user: 1, dateApplied: -1 });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STATUSES = STATUSES;
