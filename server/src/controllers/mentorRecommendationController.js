const MentorRecommendation = require('../models/MentorRecommendation');
const User = require('../models/User');

// ── @route  POST /api/mentor/students/:studentId/recommendations ────────────────────────
// ── @desc   Create a new support recommendation for a student
// ── @access Private (Mentor)
const createRecommendation = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { type, priority, message } = req.body;
    const mentorId = req.user._id;
    const institutionId = req.user.institutionId;

    if (!institutionId) {
      res.status(403);
      return next(new Error('Mentor is not bound to an institution'));
    }

    // 1. Verify student exists, belongs to same institution, and is assigned to this mentor
    const student = await User.findOne({
      _id: studentId,
      institutionId,
      mentorId,
      role: 'STUDENT'
    });

    if (!student) {
      res.status(404);
      return next(new Error('Student not found, or not assigned to you'));
    }

    // 2. Create recommendation
    const recommendation = await MentorRecommendation.create({
      studentId,
      mentorId,
      institutionId,
      type,
      priority,
      message,
      status: 'OPEN'
    });

    res.status(201).json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/mentor/students/:studentId/recommendations ────────────────────────
// ── @desc   Get all support recommendations for a student
// ── @access Private (Mentor)
const getMentorRecommendations = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const mentorId = req.user._id;
    const institutionId = req.user.institutionId;

    // Verify assignment
    const student = await User.findOne({
      _id: studentId,
      institutionId,
      mentorId,
      role: 'STUDENT'
    });

    if (!student) {
      res.status(404);
      return next(new Error('Student not found, or not assigned to you'));
    }

    // Fetch recommendations (we can fetch all recommendations for this student,
    // or just the ones created by this mentor. Usually just this mentor's.)
    const recommendations = await MentorRecommendation.find({
      studentId,
      mentorId // scoped to this mentor only
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/mentor/recommendations/:id/status ──────────────────────────────
// ── @desc   Update status of a recommendation
// ── @access Private (Mentor)
const updateRecommendationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const mentorId = req.user._id;

    // Verify it exists and belongs to this mentor
    const recommendation = await MentorRecommendation.findOne({
      _id: id,
      mentorId
    });

    if (!recommendation) {
      res.status(404);
      return next(new Error('Recommendation not found or not owned by you'));
    }

    // Update status
    if (status) {
      recommendation.status = status;
    }

    await recommendation.save();

    res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/dashboard/recommendations ──────────────────────────────────────
// ── @desc   Get recommendations for the authenticated student
// ── @access Private (Student)
const getStudentRecommendations = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const recommendations = await MentorRecommendation.find({ studentId })
      .populate('mentorId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/dashboard/recommendations/:id/status ──────────────────────────
// ── @desc   Update status of a recommendation by student (Acknowledge/Complete)
// ── @access Private (Student)
const studentUpdateRecommendationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const studentId = req.user._id;

    const recommendation = await MentorRecommendation.findOne({
      _id: id,
      studentId
    });

    if (!recommendation) {
      res.status(404);
      return next(new Error('Recommendation not found'));
    }

    if (status) {
      // Allow student to only change to Acknowledged or Completed or Dismissed
      if (['ACKNOWLEDGED', 'COMPLETED', 'DISMISSED'].includes(status)) {
        recommendation.status = status;
      } else {
        res.status(400);
        return next(new Error('Invalid status update for student'));
      }
    }

    await recommendation.save();

    res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecommendation,
  getMentorRecommendations,
  updateRecommendationStatus,
  getStudentRecommendations,
  studentUpdateRecommendationStatus
};
