const mongoose = require('mongoose');

const mentorFeedbackSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['RESUME', 'INTERVIEW', 'GENERAL', 'NOTE'],
    default: 'GENERAL'
  },
  actionItem: {
    type: String,
    default: ''
  },
  nextFollowUpDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('MentorFeedback', mentorFeedbackSchema);
