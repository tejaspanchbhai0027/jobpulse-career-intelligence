const mongoose = require('mongoose');

const INTERVIEW_TYPES   = ['Phone', 'Video', 'Technical', 'HR', 'Behavioral', 'On-site', 'Other'];
const INTERVIEW_RESULTS = ['Scheduled', 'Passed', 'Rejected', 'Rescheduled', 'Pending'];

const interviewSchema = new mongoose.Schema(
  {
    // Owner (always scoped to user for authorization)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Parent application
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    round: {
      type: Number,
      default: 1,
      min: 1,
    },
    interviewType: {
      type: String,
      enum: INTERVIEW_TYPES,
      default: 'Video',
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Interview date/time is required'],
    },
    interviewerName:  { type: String, trim: true, default: '' },
    interviewerEmail: { type: String, trim: true, lowercase: true, default: '' },
    meetingUrl:       { type: String, trim: true, default: '' },
    notes:            { type: String, default: '', maxlength: [3000, 'Notes cannot exceed 3000 characters'] },
    result: {
      type: String,
      enum: INTERVIEW_RESULTS,
      default: 'Scheduled',
    },
    interviewNotified: {
      type: Boolean,
      default: false,
    },
    // Phase E: Post-Interview Reflection
    reflection: {
      completed: { type: Boolean, default: false },
      confidence: { type: Number, min: 1, max: 5, default: null },
      topicsAsked: [{ type: String }],
      wentWell: { type: String, default: '' },
      wasDifficult: { type: String, default: '' },
      wouldChange: { type: String, default: '' }
    },
    // Phase 3: Interview Preparation Workspace
    preparation: {
      notes: { type: String, default: '' },
      checklist: [{ 
        text: { type: String, required: true }, 
        completed: { type: Boolean, default: false } 
      }],
      questions: [{ type: String }],
      topics: [{ type: String }]
    }
  },
  { timestamps: true }
);

// Compound index for fetching all interviews for a specific application
interviewSchema.index({ application: 1, scheduledAt: 1 });
// Index for dashboard upcoming-interviews query (user + upcoming date)
interviewSchema.index({ user: 1, scheduledAt: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
module.exports.INTERVIEW_TYPES   = INTERVIEW_TYPES;
module.exports.INTERVIEW_RESULTS = INTERVIEW_RESULTS;
