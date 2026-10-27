const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Institution = require('../models/Institution');
const InstitutionConnectionRequest = require('../models/InstitutionConnectionRequest');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  };

  res.status(statusCode).cookie('jwt', token, cookieOptions).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      placementOfficerId: user.placementOfficerId,
      mentorId: user.mentorId,
      connectionStatus: user.connectionStatus,
      followUpWindowDays: user.followUpWindowDays,
      jobSearchGoal: user.jobSearchGoal,
      emailNotifications: user.emailNotifications,
      deadlineReminders:  user.deadlineReminders,
      interviewReminders: user.interviewReminders,
      resumeText:         user.resumeText,
      savedFilters:       user.savedFilters,
      phone:              user.phone,
      location:           user.location,
      preferredLocations: user.preferredLocations,
      linkedinUrl:        user.linkedinUrl,
      githubUrl:          user.githubUrl,
      portfolioUrl:       user.portfolioUrl,
      targetRoles:        user.targetRoles,
      targetSalary:       user.targetSalary,
      employmentTypes:    user.employmentTypes,
      workPreference:     user.workPreference,
      professionalBio:    user.professionalBio,
      intelligenceSettings: user.intelligenceSettings,
      createdAt: user.createdAt,
    },
  });
};

// ── @route  POST /api/auth/register ──────────────────────────────────────────
// ── @desc   Create new user account
// ── @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, institutionId, placementOfficerId, mentorId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      return next(new Error('An account with that email already exists'));
    }

    // Validate Institution and Hierarchy if provided
    if (institutionId) {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        res.status(400);
        return next(new Error('Invalid institution ID'));
      }
    }

    if (placementOfficerId) {
      const officer = await User.findOne({ _id: placementOfficerId, role: 'PLACEMENT_OFFICER', institutionId, isActive: true });
      if (!officer) {
        res.status(400);
        return next(new Error('Invalid or unauthorized placement officer'));
      }
    }

    if (mentorId) {
      const mentor = await User.findOne({ _id: mentorId, role: 'MENTOR', placementOfficerId, institutionId, isActive: true });
      if (!mentor) {
        res.status(400);
        return next(new Error('Invalid or unauthorized mentor'));
      }
    }

    const user = await User.create({ 
      name, 
      email, 
      password,
      // We do not immediately connect the user if they provided institution details.
      // The connection is handled via InstitutionConnectionRequest below.
      institutionId: null,
      placementOfficerId: null,
      mentorId: null,
      connectionStatus: institutionId ? 'PENDING' : 'NONE'
    });

    if (institutionId && placementOfficerId && mentorId) {
      await InstitutionConnectionRequest.create({
        studentId: user._id,
        institutionId,
        placementOfficerId,
        mentorId,
        status: 'PENDING'
      });
      // Try to import notification service safely
      try {
        const { createNotification } = require('../services/notificationService');
        await createNotification({
          userId: mentorId,
          type: 'SYSTEM',
          title: 'New Student Connection Request',
          message: `New student connection request from ${name}.`,
          link: '/mentor/requests'
        });
      } catch (err) {
        console.error('Failed to send connection request notification:', err);
      }
    }
    // ── Send welcome email asynchronously ─────────────────────────
    sendWelcomeEmail({ to: email, name, role: user.role }).catch(err => {
      console.error('[AuthController] Failed to send welcome email:', err);
    });

    const populatedUser = await User.findById(user._id)
      .populate('institutionId', 'name code')
      .populate('placementOfficerId', 'name email')
      .populate('mentorId', 'name email');

    sendTokenResponse(populatedUser, 201, res);
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
    require('fs').appendFileSync('login_debug.log', `[Login Attempt] Email: ${email}, Password length: ${password?.length}\n`);
    
    // Zod middleware already validated format — just authenticate
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      require('fs').appendFileSync('login_debug.log', `[Login Failed] User not found: ${email}\n`);
      res.status(401);
      return next(new Error('Invalid email or password'));
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      require('fs').appendFileSync('login_debug.log', `[Login Failed] Password mismatch for: ${email}\n`);
      res.status(401);
      return next(new Error('Invalid email or password'));
    }
    require('fs').appendFileSync('login_debug.log', `[Login Success] Email: ${email}\n`);

    if (user.isActive === false) {
      res.status(403);
      return next(new Error('This account has been deactivated. Please contact your administrator.'));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const populatedUser = await User.findById(user._id)
      .populate('institutionId', 'name code')
      .populate('placementOfficerId', 'name email')
      .populate('mentorId', 'name email');

    sendTokenResponse(populatedUser, 200, res);
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
    const user = await User.findById(req.user.id)
      .populate('institutionId', 'name code')
      .populate('placementOfficerId', 'name email')
      .populate('mentorId', 'name email');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        placementOfficerId: user.placementOfficerId,
        mentorId: user.mentorId,
        connectionStatus: user.connectionStatus,
        followUpWindowDays: user.followUpWindowDays,
        jobSearchGoal: user.jobSearchGoal,
        emailNotifications: user.emailNotifications,
        deadlineReminders:  user.deadlineReminders,
        interviewReminders: user.interviewReminders,
        resumeText:         user.resumeText,
        savedFilters:       user.savedFilters,
        phone:              user.phone,
        location:           user.location,
        preferredLocations: user.preferredLocations,
        linkedinUrl:        user.linkedinUrl,
        githubUrl:          user.githubUrl,
        portfolioUrl:       user.portfolioUrl,
        targetRoles:        user.targetRoles,
        targetSalary:       user.targetSalary,
        employmentTypes:    user.employmentTypes,
        workPreference:     user.workPreference,
        professionalBio:    user.professionalBio,
        intelligenceSettings: user.intelligenceSettings,
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
    const allowedSettings = [
      'name', 'followUpWindowDays', 'jobSearchGoal', 'emailNotifications', 
      'deadlineReminders', 'interviewReminders', 'resumeText', 'savedFilters',
      'phone', 'location', 'preferredLocations', 'linkedinUrl', 'githubUrl', 
      'portfolioUrl', 'targetRoles', 'targetSalary', 'employmentTypes', 
      'workPreference', 'professionalBio', 'intelligenceSettings'
    ];
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
        role:               user.role,
        institutionId:      user.institutionId,
        connectionStatus:   user.connectionStatus,
        followUpWindowDays: user.followUpWindowDays,
        jobSearchGoal:      user.jobSearchGoal,
        emailNotifications: user.emailNotifications,
        deadlineReminders:  user.deadlineReminders,
        interviewReminders: user.interviewReminders,
        resumeText:         user.resumeText,
        savedFilters:       user.savedFilters,
        phone:              user.phone,
        location:           user.location,
        preferredLocations: user.preferredLocations,
        linkedinUrl:        user.linkedinUrl,
        githubUrl:          user.githubUrl,
        portfolioUrl:       user.portfolioUrl,
        targetRoles:        user.targetRoles,
        targetSalary:       user.targetSalary,
        employmentTypes:    user.employmentTypes,
        workPreference:     user.workPreference,
        professionalBio:    user.professionalBio,
        intelligenceSettings: user.intelligenceSettings,
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/auth/me ──────────────────────────────────────────────
// ── @desc   Delete user account
// ── @access Private
const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Optional: Also delete applications, interviews, resumes, etc.
    // For now we just delete the user record to fulfill privacy requirement.
    await User.findByIdAndDelete(req.user.id);
    
    // Clear cookie
    res.cookie('jwt', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/auth/institutions/validate ──────────────────────────────
// ── @desc   Validate institution code and return details
// ── @access Public
const validateInstitutionCode = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      res.status(400);
      return next(new Error('Institution code is required'));
    }

    // Strip spaces and hyphens for a more forgiving match
    const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();
    const institution = await Institution.findOne({ code: cleanCode });
    
    if (!institution) {
      res.status(404);
      return next(new Error('Invalid institution code'));
    }

    res.status(200).json({
      success: true,
      data: {
        _id: institution._id,
        name: institution.name,
        code: institution.code
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/auth/institutions/:institutionId/placement-officers ───────
// ── @desc   Get active placement officers for an institution
// ── @access Public
const getPlacementOfficers = async (req, res, next) => {
  try {
    const { institutionId } = req.params;
    const officers = await User.find({
      institutionId,
      role: 'PLACEMENT_OFFICER',
      isActive: true
    }).select('_id name');

    res.status(200).json({
      success: true,
      data: officers
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/auth/placement-officers/:officerId/mentors ────────────────
// ── @desc   Get active mentors for a placement officer
// ── @access Public
const getMentors = async (req, res, next) => {
  try {
    const { officerId } = req.params;
    const mentors = await User.find({
      placementOfficerId: officerId,
      role: 'MENTOR',
      isActive: true
    }).select('_id name');

    res.status(200).json({
      success: true,
      data: mentors
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/forgot-password ────────────────────────────────────
// ── @desc   Send a reset password email
// ── @access Public
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    // Always return this generic response to prevent email enumeration
    const genericResponse = 'If an account exists with this email, a password reset link has been sent.';

    if (!user) {
      return res.status(200).json({ success: true, data: genericResponse });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    try {
      // Assuming sendPasswordResetEmail is imported from emailService.js
      const { sendPasswordResetEmail } = require('../services/emailService');
      const { error } = await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      if (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.error('[authController] Email could not be sent for reset password:', error.message);
      }

      return res.status(200).json({ success: true, data: genericResponse });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      // Still return the generic response even if email sending fails, or log it
      console.error('[authController] Email could not be sent for reset password:', err.message);
      return res.status(200).json({ success: true, data: genericResponse });
    }
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/auth/reset-password/:token ──────────────────────────────
// ── @desc   Reset password using token
// ── @access Public
const resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      return next(new Error('Invalid token or token has expired'));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/connect-institution ───────────────────────────────
// ── @desc   Connect an independent student to an institution
// ── @access Private (Student only)
const connectInstitution = async (req, res, next) => {
  try {
    const { institutionId, placementOfficerId, mentorId } = req.body;

    if (req.user.role !== 'STUDENT') {
      res.status(403);
      return next(new Error('Only students can connect to an institution'));
    }

    if (req.user.institutionId) {
      res.status(400);
      return next(new Error('You are already connected to an institution'));
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      res.status(400);
      return next(new Error('Invalid institution ID'));
    }

    const officer = await User.findOne({ _id: placementOfficerId, role: 'PLACEMENT_OFFICER', institutionId, isActive: true });
    if (!officer) {
      res.status(400);
      return next(new Error('Invalid or unauthorized placement officer'));
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'MENTOR', placementOfficerId, institutionId, isActive: true });
    if (!mentor) {
      res.status(400);
      return next(new Error('Invalid or unauthorized mentor'));
    }

    // Instead of assigning directly, create a request
    const existingRequest = await InstitutionConnectionRequest.findOne({
      studentId: req.user._id,
      status: 'PENDING'
    });

    if (existingRequest) {
      res.status(400);
      return next(new Error('You already have a pending connection request'));
    }

    await InstitutionConnectionRequest.create({
      studentId: req.user._id,
      institutionId,
      placementOfficerId,
      mentorId,
      status: 'PENDING'
    });

    req.user.connectionStatus = 'PENDING';
    await req.user.save();

    // Notify the mentor
    try {
      const { createNotification } = require('../services/notificationService');
      await createNotification({
        userId: mentorId,
        type: 'SYSTEM',
        title: 'New Student Connection Request',
        message: `New student connection request from ${req.user.name}.`,
        link: '/mentor/requests'
      });
    } catch (err) {
      console.error('Failed to send connection request notification:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Connection request submitted successfully',
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/send-verification ────────────────────────────────
// ── @desc   Send email verification link
// ── @access Private
const sendVerificationEmail = async (req, res, next) => {
  try {
    // Stub for future implementation
    res.status(200).json({ success: true, message: 'Verification email architecture prepared' });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/verify-email ────────────────────────────────────
// ── @desc   Verify email with token
// ── @access Public
const verifyEmail = async (req, res, next) => {
  try {
    // Stub for future implementation
    res.status(200).json({ success: true, message: 'Email verification architecture prepared' });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/auth/connection-status ─────────────────────────────────
// ── @desc   Get the latest connection request for the student
// ── @access Private (Student)
const getStudentConnectionStatus = async (req, res, next) => {
  try {
    const InstitutionConnectionRequest = require('../models/InstitutionConnectionRequest');
    const request = await InstitutionConnectionRequest.findOne({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('institutionId', 'name')
      .populate('placementOfficerId', 'name email')
      .populate('mentorId', 'name email');
      
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateSettings,
  deleteAccount,
  validateInstitutionCode,
  getPlacementOfficers,
  getMentors,
  forgotPassword,
  resetPassword,
  connectInstitution,
  sendVerificationEmail,
  verifyEmail,
  getStudentConnectionStatus
};
