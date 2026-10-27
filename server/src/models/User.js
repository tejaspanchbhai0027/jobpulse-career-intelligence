const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // ── RBAC / Admin Portal ──────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['STUDENT', 'PLACEMENT_OFFICER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'MENTOR'],
      default: 'STUDENT',
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    connectionStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE',
    },
    placementOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    placementStatus: {
      type: String,
      enum: ['UNPLACED', 'PLACED'],
      default: 'UNPLACED'
    },
    placedCompany: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    class: {
      type: String,
      default: '',
      trim: true,
    },
    division: {
      type: String,
      default: '',
      trim: true,
    },
    batch: {
      type: Number,
      default: null,
    },
    studentId: {
      type: String,
      default: '',
      trim: true,
    },
    privacySettings: {
      shareProfileWithPlacement: { type: Boolean, default: true },
      applicationProgress: { type: Boolean, default: true },
      interviewProgress: { type: Boolean, default: true },
      skills: { type: Boolean, default: true },
      resume: { type: Boolean, default: false },
      salary: { type: Boolean, default: false },
      careerPreferences: { type: Boolean, default: true },
    },
    jobSearchGoal: {
      type: String,
      default: 'Software Engineer',
      trim: true,
      maxlength: [100, 'Goal cannot exceed 100 characters'],
    },
    followUpWindowDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 90,
    },
    // ── Profile Extensions (Phase 3) ─────────────────────────────────────────
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    preferredLocations: { type: [String], default: [] },
    linkedinUrl: { type: String, trim: true, default: '' },
    githubUrl: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },
    targetRoles: { type: [String], default: [] },
    targetSalary: { type: String, default: '' }, // e.g., '₹8–12 LPA'
    employmentTypes: { type: [String], default: ['Full-time'] },
    workPreference: { type: String, default: 'Any' }, // Remote, Hybrid, On-site
    professionalBio: { type: String, maxlength: 1000, default: '' },
    intelligenceSettings: {
      careerIntelligence: { type: Boolean, default: true },
      copilot: { type: Boolean, default: true },
      strategyRecommendations: { type: Boolean, default: true },
      weeklyStrategySummary: { type: Boolean, default: true },
    },
    // ── AI Layer ─────────────────────────────────────────────────────────────
    resumeText: {
      type: String,
      default: '',
      maxlength: [10000, 'Resume text cannot exceed 10000 characters'],
    },
    // ── Saved Filters ────────────────────────────────────────────────────────
    savedFilters: {
      type: [
        {
          name: { type: String, required: true },
          state: { type: mongoose.Schema.Types.Mixed, required: true },
        }
      ],
      default: [],
    },
    // ── Notification preferences ─────────────────────────────────────────────
    emailNotifications: {
      type: Boolean,
      default: true, // opt-in by default
    },
    deadlineReminders: {
      type: Boolean,
      default: true,
    },
    interviewReminders: {
      type: Boolean,
      default: true,
    },
    // ── Password Reset Fields ────────────────────────────────────────────────
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // ── Email Verification Fields ────────────────────────────────────────────
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: String,
    emailVerificationExpiresAt: Date,
  },
  { timestamps: true }
);

// ── Hash password before saving ───────────────────────────────────────────────
// Note: Mongoose 7+ async pre hooks resolve via returned Promise — do NOT call next()
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare plain-text password with hash ────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: generate and hash password reset token ───────────────────
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire to 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.index({ institutionId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
