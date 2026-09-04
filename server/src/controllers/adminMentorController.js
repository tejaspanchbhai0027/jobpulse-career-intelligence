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

module.exports = {
  getMentors
};
