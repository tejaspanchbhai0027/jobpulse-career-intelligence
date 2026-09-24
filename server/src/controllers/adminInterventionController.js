const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const InterventionSignal = require('../models/InterventionSignal');

// ── @route  GET /api/admin/interventions ───────────────────────────────────────
// ── @desc   Run heuristics and return active intervention signals
// ── @access Private (Admin + Institution Access)
const getInterventions = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      res.status(403);
      return next(new Error('Admin is not bound to an institution'));
    }

    // 1. Fetch all active students in the institution
    const studentsQuery = { institutionId, role: 'STUDENT' };
    if (req.user.role === 'MENTOR') {
      studentsQuery.mentorId = req.user._id;
    }
    const students = await User.find(studentsQuery).select('_id name email batch department privacySettings');
    const studentIds = students.map(s => s._id);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const newSignals = [];

    // Process students to generate active heuristics
    for (const student of students) {
      const priv = student.privacySettings || {};

      // HEURISTIC 1 & 2 require application/interview progress
      if (priv.applicationProgress !== false) {
        const applications = await Application.find({ user: student._id }).sort({ dateApplied: -1 });
        const interviews = await Interview.countDocuments({ user: student._id });
        const totalApps = applications.length;
        
        // ── HEURISTIC 1: NO_ACTIVITY_30_DAYS ────────────────────────────
        if (totalApps === 0 || applications[0].dateApplied < thirtyDaysAgo) {
          const daysSince = totalApps === 0 ? 'Never applied' : Math.floor((now - applications[0].dateApplied) / (1000 * 60 * 60 * 24));
          newSignals.push({
            student: student._id,
            institutionId,
            type: 'NO_ACTIVITY_30_DAYS',
            category: 'WATCH',
            title: 'Student may need a nudge to resume search.',
            reason: 'No application activity for 30+ days.',
            evidence: totalApps === 0 ? '0 total applications recorded.' : `Last application was ${daysSince} days ago.`,
            suggestedSupport: 'Send a quick check-in message to see if they are stuck.'
          });
        }

        // ── HEURISTIC 2: HIGH_APPS_NO_INTERVIEWS ────────────────────────
        if (totalApps >= 10 && interviews === 0 && priv.interviewProgress !== false) {
          newSignals.push({
            student: student._id,
            institutionId,
            type: 'HIGH_APPS_NO_INTERVIEWS',
            category: 'HIGH ATTENTION',
            title: 'Student may benefit from resume or strategy review.',
            reason: 'Multiple applications but no interview progression.',
            evidence: `${totalApps} applications, 0 interviews.`,
            suggestedSupport: 'Schedule a 1:1 resume teardown session.'
          });
        }
      }

      // ── HEURISTIC 3: STALE_RESUME ───────────────────────────────────
      // Requires resume sharing
      if (priv.resume === true) {
        const defaultResume = await Resume.findOne({ user: student._id, isDefault: true }).sort({ updatedAt: -1 });
        if (!defaultResume || defaultResume.updatedAt < sixtyDaysAgo) {
          const daysSince = !defaultResume ? 'No resume' : Math.floor((now - defaultResume.updatedAt) / (1000 * 60 * 60 * 24));
          newSignals.push({
            student: student._id,
            institutionId,
            type: 'STALE_RESUME',
            category: 'SKILL GAP',
            title: 'Resume may not reflect current skills.',
            reason: 'Resume has not been updated recently.',
            evidence: !defaultResume ? 'No default resume uploaded.' : `Resume last updated ${daysSince} days ago.`,
            suggestedSupport: 'Recommend the student to upload their latest resume.'
          });
        }
      }
    }

    // 2. Diff against existing signals to avoid re-triggering DISMISSED or ACTIVE ones
    for (const signal of newSignals) {
      const existing = await InterventionSignal.findOne({
        student: signal.student,
        type: signal.type,
      });

      // If no signal of this type exists at all, create it.
      // If it exists but is DISMISSED/REVIEWED, we leave it alone (it was handled).
      // (Advanced: we could reset it if a new threshold is hit, but for now we trust the admin action).
      if (!existing) {
        await InterventionSignal.create(signal);
      }
    }

    // 3. Fetch all ACTIVE signals to return
    const activeSignalsQuery = { institutionId, status: 'ACTIVE' };
    if (req.user.role === 'MENTOR') {
      activeSignalsQuery.student = { $in: studentIds };
    }
    
    const activeSignals = await InterventionSignal.find(activeSignalsQuery)
      .populate('student', 'name email batch department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: activeSignals
    });

  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/admin/interventions/:id/status ──────────────────────
// ── @desc   Update status of an intervention signal (REVIEWED, DISMISSED)
// ── @access Private (Admin + Institution Access)
const updateInterventionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const signalId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(signalId)) {
      res.status(400);
      return next(new Error('Invalid signal ID'));
    }

    if (!['ACTIVE', 'REVIEWED', 'DISMISSED'].includes(status)) {
      res.status(400);
      return next(new Error('Invalid status'));
    }

    const signal = await InterventionSignal.findOneAndUpdate(
      { _id: signalId, institutionId: req.user.institutionId },
      { status },
      { new: true }
    );

    if (!signal) {
      res.status(404);
      return next(new Error('Signal not found'));
    }

    res.status(200).json({
      success: true,
      data: signal
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInterventions,
  updateInterventionStatus
};
