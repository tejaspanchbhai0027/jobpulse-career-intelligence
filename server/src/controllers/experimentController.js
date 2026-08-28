const asyncHandler = require('express-async-handler');
const CareerExperiment = require('../models/CareerExperiment');
const Application = require('../models/Application');

// @desc    Get all experiments
// @route   GET /api/experiments
// @access  Private
const getExperiments = asyncHandler(async (req, res) => {
  const experiments = await CareerExperiment.find({ userId: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, data: experiments });
});

// @desc    Get single experiment
// @route   GET /api/experiments/:id
// @access  Private
const getExperiment = asyncHandler(async (req, res) => {
  const experiment = await CareerExperiment.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('groupA.applications')
    .populate('groupB.applications');

  if (!experiment) {
    res.status(404);
    throw new Error('Experiment not found');
  }

  res.status(200).json({ success: true, data: experiment });
});

// @desc    Create experiment
// @route   POST /api/experiments
// @access  Private
const createExperiment = asyncHandler(async (req, res) => {
  const { name, hypothesis, type, groupA_name, groupB_name, targetSampleSize } = req.body;
  if (!name || !type || !groupA_name || !groupB_name) {
    res.status(400);
    throw new Error('Please provide required experiment fields');
  }

  const experiment = await CareerExperiment.create({
    userId: req.user._id,
    name,
    hypothesis,
    type,
    groupA: { name: groupA_name, applications: [] },
    groupB: { name: groupB_name, applications: [] },
    targetSampleSize: targetSampleSize || 20
  });

  res.status(201).json({ success: true, data: experiment });
});

// @desc    Assign application to experiment group
// @route   POST /api/experiments/:id/applications
// @access  Private
const assignApplication = asyncHandler(async (req, res) => {
  const { applicationId, group } = req.body;
  
  if (!applicationId || !group || (group !== 'A' && group !== 'B')) {
    res.status(400);
    throw new Error('Invalid application or group assignment');
  }

  const experiment = await CareerExperiment.findOne({ _id: req.params.id, userId: req.user._id });
  if (!experiment) {
    res.status(404);
    throw new Error('Experiment not found');
  }

  // Ensure application belongs to user
  const app = await Application.findOne({ _id: applicationId, user: req.user._id });
  if (!app) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Remove from other group if it exists there
  experiment.groupA.applications = experiment.groupA.applications.filter(id => id.toString() !== applicationId);
  experiment.groupB.applications = experiment.groupB.applications.filter(id => id.toString() !== applicationId);

  // Add to target group
  if (group === 'A') experiment.groupA.applications.push(applicationId);
  if (group === 'B') experiment.groupB.applications.push(applicationId);

  await experiment.save();
  res.status(200).json({ success: true, data: experiment });
});

// @desc    Delete experiment
// @route   DELETE /api/experiments/:id
// @access  Private
const deleteExperiment = asyncHandler(async (req, res) => {
  const experiment = await CareerExperiment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!experiment) {
    res.status(404);
    throw new Error('Experiment not found');
  }
  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  getExperiments,
  getExperiment,
  createExperiment,
  assignApplication,
  deleteExperiment
};
