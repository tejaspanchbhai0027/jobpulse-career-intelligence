const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

// ── Helper: sign JWT ──────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Helper: send token response ───────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Set JWT as an HttpOnly secure cookie
  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('jwt', token, cookieOptions).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      followUpWindowDays: user.followUpWindowDays,
      jobSearchGoal: user.jobSearchGoal,
      emailNotifications: user.emailNotifications,
      deadlineReminders:  user.deadlineReminders,
      interviewReminders: user.interviewReminders,
      resumeText:         user.resumeText,
      savedFilters:       user.savedFilters,
      createdAt: user.createdAt,
    },
  });
};

// ── @route  POST /api/auth/register ──────────────────────────────────────────
// ── @desc   Create new user account
// ── @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      return next(new Error('An account with that email already exists'));
    }

    const user = await User.create({ name, email, password });
    // ── Send welcome email asynchronously ─────────────────────────
    sendWelcomeEmail({ to: email, name }).catch(err => {
      console.error('[AuthController] Failed to send welcome email:', err);
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/login ─────────────────────────────────────────────
// ── @desc   Authenticate user and return JWT
// ── @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Zod middleware already validated format — just authenticate
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/auth/me ─────────────────────────────────────────────────
// ── @desc   Get currently authenticated user profile
// ── @access Private
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        followUpWindowDays: user.followUpWindowDays,
        jobSearchGoal: user.jobSearchGoal,
        emailNotifications: user.emailNotifications,
        deadlineReminders:  user.deadlineReminders,
        interviewReminders: user.interviewReminders,
        resumeText:         user.resumeText,
        savedFilters:       user.savedFilters,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/auth/settings ───────────────────────────────────────
// ── @desc   Update user settings (e.g. followUpWindowDays)
// ── @access Private
const updateSettings = async (req, res, next) => {
  try {
    // Zod already validated and coerced all fields
    const allowedSettings = ['followUpWindowDays', 'jobSearchGoal', 'emailNotifications', 'deadlineReminders', 'interviewReminders', 'resumeText', 'savedFilters'];
    const updates = {};
    allowedSettings.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id:                 user._id,
        name:               user.name,
        email:              user.email,
        followUpWindowDays: user.followUpWindowDays,
        jobSearchGoal:      user.jobSearchGoal,
        emailNotifications: user.emailNotifications,
        deadlineReminders:  user.deadlineReminders,
        interviewReminders: user.interviewReminders,
        resumeText:         user.resumeText,
        savedFilters:       user.savedFilters,
        createdAt:          user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/logout ────────────────────────────────────────────
// ── @desc   Log user out / clear cookie
// ── @access Private
const logout = async (req, res, next) => {
  try {
    res.cookie('jwt', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, updateSettings };
