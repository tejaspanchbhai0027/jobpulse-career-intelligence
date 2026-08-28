const mongoose = require('mongoose');

const careerExperimentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  hypothesis: { type: String },
  type: { type: String, required: true }, // e.g., 'resume_version', 'referral_vs_cold', 'job_type'
  groupA: {
    name: { type: String, required: true },
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }]
  },
  groupB: {
    name: { type: String, required: true },
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }]
  },
  targetSampleSize: { type: Number, default: 20 },
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  completedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('CareerExperiment', careerExperimentSchema);
