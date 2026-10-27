const mongoose = require('mongoose');

const institutionNoticeSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['STUDENTS', 'MENTORS', 'ALL'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['NORMAL', 'HIGH'],
    default: 'NORMAL'
  }
}, { timestamps: true });

module.exports = mongoose.model('InstitutionNotice', institutionNoticeSchema);
