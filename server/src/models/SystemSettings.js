const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    useCustomSmtp: {
      type: Boolean,
      default: false,
    },
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUser: {
      type: String,
      default: '',
    },
    smtpPass: {
      type: String,
      default: '',
    },
    smtpFromEmail: {
      type: String,
      default: '',
    },
    smtpFromName: {
      type: String,
      default: 'JobPulse',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
