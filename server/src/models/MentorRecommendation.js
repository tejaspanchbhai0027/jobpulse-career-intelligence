const mongoose = require('mongoose');

const mentorRecommendationSchema = new mongoose.Schema({
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
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  type: {
    type: String,
    enum: [
      'Resume Review',
      'Interview Preparation',
      'Application Strategy',
      'Skill Development',
      'Career Guidance',
      'Other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['Normal', 'Important', 'Urgent'],
    default: 'Normal'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'ACKNOWLEDGED', 'COMPLETED', 'DISMISSED'],
    default: 'OPEN'
  }
}, { timestamps: true });

module.exports = mongoose.model('MentorRecommendation', mentorRecommendationSchema);
