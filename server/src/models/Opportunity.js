const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: 'Institution Event' // Default for things like Career Fairs where company might not apply
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Full-Time', 'Internship', 'Placement Drive', 'Career Event', 'Apprenticeship', 'Assessment'],
    required: true
  },
  location: {
    type: String,
    trim: true,
    default: 'TBD'
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Hybrid', 'Remote', 'TBD'],
    default: 'TBD'
  },
  salary: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  url: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date
  },
  source: {
    type: String,
    default: 'Institution'
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // To track which students have "tracked" or applied to this opportunity
  trackedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Indexes for common queries
opportunitySchema.index({ institutionId: 1, status: 1 });
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ type: 1 });

module.exports = mongoose.model('Opportunity', opportunitySchema);
