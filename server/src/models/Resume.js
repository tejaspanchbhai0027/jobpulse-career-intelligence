const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Resume name is required'],
      trim: true,
      maxlength: [100, 'Resume name cannot exceed 100 characters'],
    },
    version: {
      type: String,
      default: 'v1.0',
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String, // 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
      required: true,
    },
    storageKey: {
      type: String, // UUID or local path
      required: true,
    },
    targetRole: {
      type: String,
      default: 'General',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    extractedText: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Only one default resume per user
resumeSchema.pre('save', async function () {
  if (this.isModified('isDefault') && this.isDefault) {
    await mongoose.models.Resume.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
});

module.exports = mongoose.model('Resume', resumeSchema);
