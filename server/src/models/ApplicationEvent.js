const mongoose = require('mongoose');

const applicationEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  type: {
    type: String,
    enum: [
      'APPLICATION_CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED',
      'FOLLOW_UP_TRIGGERED', 'FOLLOW_UP_SENT', 'INTERVIEW_CREATED',
      'INTERVIEW_COMPLETED', 'NOTE_UPDATED', 'GHOSTED', 'OFFER_RECEIVED'
    ],
    required: true
  },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('ApplicationEvent', applicationEventSchema);
