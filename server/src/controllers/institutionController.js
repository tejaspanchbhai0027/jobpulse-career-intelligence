const Institution = require('../models/Institution');

// ── @route  GET /api/institution/me ───────────────────────────────────────────
// ── @desc   Get the institution profile for the current admin
// ── @access Private (Admin + Institution Access)
const getMyInstitution = async (req, res, next) => {
  try {
    const institution = await Institution.findById(req.user.institutionId);
    
    if (!institution) {
      res.status(404);
      return next(new Error('Institution not found'));
    }

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/institution/me ───────────────────────────────────────────
// ── @desc   Update the institution profile
// ── @access Private (INSTITUTION_ADMIN / SUPER_ADMIN)
const updateMyInstitution = async (req, res, next) => {
  try {
    // Restrict fields that can be updated
    const { name, logoUrl, location, websiteUrl, placementSeason, graduationYear, departments } = req.body;
    
    // Note: We deliberately exclude 'code' from being updated here as it's an identifier.
    
    const institution = await Institution.findByIdAndUpdate(
      req.user.institutionId,
      {
        $set: {
          ...(name && { name }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(location !== undefined && { location }),
          ...(websiteUrl !== undefined && { websiteUrl }),
          ...(placementSeason !== undefined && { placementSeason }),
          ...(graduationYear && { graduationYear }),
          ...(departments && { departments })
        }
      },
      { new: true, runValidators: true }
    );

    if (!institution) {
      res.status(404);
      return next(new Error('Institution not found'));
    }

    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyInstitution,
  updateMyInstitution
};
