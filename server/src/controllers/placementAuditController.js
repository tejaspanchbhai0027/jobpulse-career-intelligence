const PlacementAudit = require('../models/PlacementAudit');

// ── @route  GET /api/admin/placement-audit ────────────────────────────────────
// ── @desc   Return audit trail of placement activity
// ── @access Private (Admin + Institution Access)
const getAuditLogs = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { limit = 50, skip = 0, entityId } = req.query;

    const query = { institutionId };
    if (entityId) {
      query.entityId = entityId;
    }

    const logs = await PlacementAudit.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('actor', 'name email role')
      .populate({
        path: 'entityId',
        select: 'title company jobRole' // Works assuming entityModel is mostly PlacementDrive
      })
      .lean();

    const total = await PlacementAudit.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
