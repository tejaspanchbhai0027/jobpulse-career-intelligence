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
      // Expand to support manual issue types
      enum: [
        'NO_ACTIVITY_30_DAYS',
        'HIGH_APPS_NO_INTERVIEWS',
        'UPCOMING_INTERVIEW_NO_PREP',
        'STALE_RESUME',
        'ACADEMIC_CONCERN',
        'BEHAVIORAL_CONCERN',
        'OTHER'
      ],
    },
    priority: {
      type: String,
      required: true,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
      default: 'OPEN',
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
      default: '',
    },
    dueDate: {
      type: Date,
      default: null
    },
    followUpDate: {
      type: Date,
      default: null
    },
    mentorNotes: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// We want to ensure a student only has one active signal of a specific type at a time.
// So we can index student + type + status (if ACTIVE).
interventionSignalSchema.index({ student: 1, type: 1, status: 1 });
interventionSignalSchema.index({ institutionId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('InterventionSignal', interventionSignalSchema);
