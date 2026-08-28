const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

module.exports = mongoose.model('User', userSchema);
