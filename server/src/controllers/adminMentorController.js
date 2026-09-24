const User = require('../models/User');

// ── @route  GET /api/admin/mentors ───────────────────────────────────────────
// ── @desc   Get all mentors for the institution with their assigned students
// ── @access Private (Institution Admin)
const getMentors = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;

    // Fetch all mentors in the institution
    const mentors = await User.find({ institutionId, role: 'MENTOR' })
      .populate('placementOfficerId', 'name email')
      .select('_id name email isActive createdAt placementOfficerId');

    // For each mentor, count their assigned students
    const mentorIds = mentors.map(m => m._id);
    const studentCounts = await User.aggregate([
      { $match: { institutionId, role: 'STUDENT', mentorId: { $in: mentorIds } } },
      { $group: { _id: '$mentorId', count: { $sum: 1 } } }
    ]);

    const studentCountMap = {};
    studentCounts.forEach(c => {
      studentCountMap[c._id.toString()] = c.count;
    });

    const data = mentors.map(m => ({
      _id: m._id,
      name: m.name,
      email: m.email,
      isActive: m.isActive,
      placementOfficer: m.placementOfficerId ? m.placementOfficerId.name : 'Unassigned',
      studentCount: studentCountMap[m._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const mongoose = require('mongoose');

const createMentor = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { name, email, placementOfficerId } = req.body;

    if (!name || !email) {
      res.status(400);
      return next(new Error('Name and email are required'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      return next(new Error('An account with this email already exists'));
    }

    if (placementOfficerId) {
      const officer = await User.findOne({ _id: placementOfficerId, institutionId, role: 'PLACEMENT_OFFICER' });
      if (!officer) {
        res.status(400);
        return next(new Error('Invalid placement officer assignment. Officer not found in this institution.'));
      }
    }

    const mentor = await User.create({
      name,
      email,
      placementOfficerId: placementOfficerId || null,
      role: 'MENTOR',
      institutionId,
      password: 'password123',
      isActive: true
    });

    res.status(201).json({ success: true, data: { _id: mentor._id, name, email } });
  } catch (error) {
    next(error);
  }
};

const updateMentor = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const id = req.params.id;
    const { name, placementOfficerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid mentor ID'));
    }

    const mentor = await User.findOne({ _id: id, institutionId, role: 'MENTOR' });
    if (!mentor) {
      res.status(404);
      return next(new Error('Mentor not found or access denied'));
    }

    if (name) mentor.name = name;
    if (placementOfficerId !== undefined) mentor.placementOfficerId = placementOfficerId || null;

    await mentor.save();

    res.status(200).json({ success: true, data: mentor });
  } catch (error) {
    next(error);
  }
};

const deactivateMentor = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid mentor ID'));
    }

    const mentor = await User.findOne({ _id: id, institutionId, role: 'MENTOR' });
    if (!mentor) {
      res.status(404);
      return next(new Error('Mentor not found or access denied'));
    }

    mentor.isActive = false;
    await mentor.save();

    res.status(200).json({ success: true, message: 'Mentor deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMentors,
  createMentor,
  updateMentor,
  deactivateMentor
};
