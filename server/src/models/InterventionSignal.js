const mongoose = require('mongoose');

const interventionSignalSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'NO_ACTIVITY_30_DAYS',
        'HIGH_APPS_NO_INTERVIEWS',
        'UPCOMING_INTERVIEW_NO_PREP',
        'STALE_RESUME'
      ],
    },
    category: {
      type: String,
      required: true,
      enum: ['HIGH ATTENTION', 'WATCH', 'SKILL GAP'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVIEWED', 'DISMISSED'],
      default: 'ACTIVE',
    },
    title: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    evidence: {
      type: String,
      required: true,
    },
    suggestedSupport: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

// We want to ensure a student only has one active signal of a specific type at a time.
// So we can index student + type + status (if ACTIVE).
interventionSignalSchema.index({ student: 1, type: 1, status: 1 });
interventionSignalSchema.index({ institutionId: 1, status: 1 });

module.exports = mongoose.model('InterventionSignal', interventionSignalSchema);
