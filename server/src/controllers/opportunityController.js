const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');

// @desc    Get all active opportunities for the student's institution
// @route   GET /api/opportunities
// @access  Private (Student)
exports.getOpportunities = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an institution' });
    }

    const { type, workMode } = req.query;
    const filter = { institutionId, status: 'Open' };

    if (type) filter.type = type;
    if (workMode) filter.workMode = workMode;

    const opportunities = await Opportunity.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Map through and add a flag if the user has already tracked this opportunity
    const result = opportunities.map(opp => ({
      ...opp,
      isTracked: opp.trackedBy ? opp.trackedBy.map(id => id.toString()).includes(req.user._id.toString()) : false
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error fetching opportunities:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const OpportunityRecommendationService = require('../services/opportunityRecommendationService');
const PlacementDrive = require('../models/PlacementDrive');

// @desc    Get recommended opportunities for the student
// @route   GET /api/opportunities/recommended
// @access  Private (Student)
exports.getRecommendedOpportunities = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'User does not belong to an institution' });
    }

    const recommendations = await OpportunityRecommendationService.getRecommendations(req.user);

    res.json({ success: true, data: recommendations });
  } catch (err) {
    console.error('Error fetching recommended opportunities:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Private
exports.getOpportunity = async (req, res) => {
  try {
    let opportunity = await Opportunity.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    }).lean();

    let sourceModel = 'Opportunity';

    if (!opportunity) {
      // Try PlacementDrive
      opportunity = await PlacementDrive.findOne({
        _id: req.params.id,
        institutionId: req.user.institutionId
      }).lean();
      sourceModel = 'PlacementDrive';
    }

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    if (sourceModel === 'Opportunity') {
      opportunity.isTracked = opportunity.trackedBy ? opportunity.trackedBy.map(id => id.toString()).includes(req.user._id.toString()) : false;
    } else {
      // PlacementDrive standardizations
      opportunity.title = opportunity.title || opportunity.jobRole;
      opportunity.type = opportunity.employmentType;
      opportunity.skills = opportunity.requiredSkills || [];
      opportunity.deadline = opportunity.registrationEndDate;
      opportunity.isTracked = false; // We can check applications if needed
    }
    
    opportunity.sourceModel = sourceModel;

    res.json({ success: true, data: opportunity });
  } catch (err) {
    console.error('Error fetching opportunity:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Track an opportunity (convert to Application)
// @route   POST /api/opportunities/:id/track
// @access  Private (Student)
exports.trackOpportunity = async (req, res) => {
  try {
    let opportunity = await Opportunity.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    });
    
    let sourceModel = 'Opportunity';
    
    if (!opportunity) {
      opportunity = await PlacementDrive.findOne({
        _id: req.params.id,
        institutionId: req.user.institutionId
      });
      sourceModel = 'PlacementDrive';
    }

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }
    
    let existingApp = null;
    if (sourceModel === 'Opportunity') {
      existingApp = await Application.findOne({
        user: req.user._id,
        company: opportunity.company || 'Institution',
        role: opportunity.title
      });
    } else {
      existingApp = await Application.findOne({
        user: req.user._id,
        placementDriveId: opportunity._id
      });
    }

    if (existingApp) {
      return res.status(400).json({ success: false, error: 'Already applied or tracked this opportunity' });
    }

    // Create a new Application record
    const application = await Application.create({
      user: req.user._id,
      institutionId: req.user.institutionId,
      company: opportunity.company || 'Institution',
      role: opportunity.title || opportunity.jobRole,
      status: 'Wishlist',
      url: opportunity.url || '',
      location: opportunity.location || 'TBD',
      salary: opportunity.salary || opportunity.salaryRange || '',
      source: 'Institution Portal',
      placementDriveId: sourceModel === 'PlacementDrive' ? opportunity._id : null
    });

    // Update opportunity trackedBy if it's Opportunity model
    if (sourceModel === 'Opportunity') {
      if (!opportunity.trackedBy) opportunity.trackedBy = [];
      if (!opportunity.trackedBy.includes(req.user._id)) {
        opportunity.trackedBy.push(req.user._id);
        await opportunity.save();
      }
    }

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error('Error tracking opportunity:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Untrack an opportunity
// @route   DELETE /api/opportunities/:id/untrack
// @access  Private (Student)
exports.untrackOpportunity = async (req, res) => {
  try {
    const applicationId = req.body.applicationId;
    
    if (applicationId) {
      await Application.deleteOne({ _id: applicationId, user: req.user._id, status: 'Wishlist' });
    } else {
      // Find and delete the wishlist application for this drive or opportunity
      const opp = await Opportunity.findById(req.params.id) || await PlacementDrive.findById(req.params.id);
      if (opp) {
        await Application.deleteOne({ 
          user: req.user._id, 
          status: 'Wishlist',
          $or: [
            { placementDriveId: opp._id },
            { company: opp.company, role: opp.title }
          ]
        });
      }
    }

    // Update trackedBy in Opportunity model
    const opportunity = await Opportunity.findById(req.params.id);
    if (opportunity && opportunity.trackedBy) {
      opportunity.trackedBy = opportunity.trackedBy.filter(id => id.toString() !== req.user._id.toString());
      await opportunity.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error untracking opportunity:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
