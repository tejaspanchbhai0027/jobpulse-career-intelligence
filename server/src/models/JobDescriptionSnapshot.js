const mongoose = require('mongoose');

const jdSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  content: { type: String, required: true },
  contentHash: { type: String, required: true },
  extractedMetadata: {
    role: { type: String },
    skills: [{ type: String }],
    experience: { type: String },
    concerns: [{ type: String }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('JobDescriptionSnapshot', jdSnapshotSchema);
