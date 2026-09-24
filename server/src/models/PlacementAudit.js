const mongoose = require('mongoose');

const placementAuditSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      // e.g., 'DRIVE_CREATED', 'DRIVE_UPDATED', 'STATUS_CHANGED', 'FINAL_RESULT_SUBMITTED'
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      // Typically references a PlacementDrive ID, but kept generic for flexibility
    },
    entityModel: {
      type: String,
      required: true,
      default: 'PlacementDrive',
      enum: ['PlacementDrive', 'Application', 'User'],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Stores before/after states or specific changes
    },
  },
  { timestamps: true }
);

// Indexes for fast querying by institution or specific drive
placementAuditSchema.index({ institutionId: 1, createdAt: -1 });
placementAuditSchema.index({ entityId: 1, createdAt: -1 });

module.exports = mongoose.model('PlacementAudit', placementAuditSchema);
