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

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Private
exports.getOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    }).lean();

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    opportunity.isTracked = opportunity.trackedBy ? opportunity.trackedBy.map(id => id.toString()).includes(req.user._id.toString()) : false;

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
    const opportunity = await Opportunity.findOne({
      _id: req.params.id,
      institutionId: req.user.institutionId
    });

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    // Check if already tracked
    if (opportunity.trackedBy && opportunity.trackedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, error: 'Already tracked this opportunity' });
    }

    // Create a new Application record
    const application = await Application.create({
      user: req.user._id,
      institutionId: req.user.institutionId,
      company: opportunity.company || 'Institution',
      role: opportunity.title,
      status: 'Wishlist',
      url: opportunity.url,
      location: opportunity.location,
      salary: opportunity.salary,
      source: opportunity.source || 'Institution Portal'
    });

    // Update opportunity trackedBy
    if (!opportunity.trackedBy) {
      opportunity.trackedBy = [];
    }
    opportunity.trackedBy.push(req.user._id);
    await opportunity.save();

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error('Error tracking opportunity:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
