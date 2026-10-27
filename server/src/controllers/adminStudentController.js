const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const MentorFeedback = require('../models/MentorFeedback');
const InterventionSignal = require('../models/InterventionSignal');

// ── @route  GET /api/admin/students ───────────────────────────────────────────
// ── @desc   Get paginated and filtered list of students for the institution
// ── @access Private (Admin + Institution Access)
const getStudents = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    if (!institutionId) {
      res.status(403);
      return next(new Error('Admin is not bound to an institution'));
    }

    const { 
      page = 1, 
      limit = 20, 
      search, 
      department, 
      batch,
      placementStatus, // e.g., 'Placed', 'Seeking'
      hasActivity,     // boolean string
      mentorId,        // filter by mentor
      unassigned,      // boolean string
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // 1. Base query for users in this institution
    const matchStage = { 
      institutionId, 
      role: 'STUDENT',
      'privacySettings.shareProfileWithPlacement': { $ne: false } // Only show students who haven't opted out entirely
    };

    if (req.user.role === 'MENTOR') {
      matchStage.mentorId = req.user._id;
    }

    // 2. Text Search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStage.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex }
      ];
    }

    // 3. Exact Filters
    if (department) matchStage.department = department;
    if (batch) matchStage.batch = parseInt(batch, 10);
    
    // Mentor filtering (only if not a MENTOR role, as MENTOR role is already hardcoded above)
    if (req.user.role !== 'MENTOR') {
      if (mentorId) {
        matchStage.mentorId = new mongoose.Types.ObjectId(mentorId);
      } else if (unassigned === 'true') {
        matchStage.$or = matchStage.$or || [];
        matchStage.$or.push({ mentorId: null }, { mentorId: { $exists: false } });
      }
    }

    // 4. Aggregation Pipeline
    // We use aggregation to efficiently join applications and calculate metrics
    const pipeline = [
      { $match: matchStage },
      // Lookup applications
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'user',
          as: 'applications'
        }
      },
      // Calculate metrics
      {
        $addFields: {
          applicationCount: { $size: '$applications' },
          offerCount: {
            $size: {
              $filter: {
                input: '$applications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'Offer'] }
              }
            }
          },
          interviewCount: {
            $size: {
              $filter: {
                input: '$applications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'Interview'] }
              }
            }
          }
        }
      },
      // Lookup interventions
      {
        $lookup: {
          from: 'interventionsignals',
          localField: '_id',
          foreignField: 'student',
          as: 'interventions'
        }
      },
      {
        $addFields: {
          openInterventions: {
            $size: {
              $filter: {
                input: '$interventions',
                as: 'sig',
                cond: { $in: ['$$sig.status', ['OPEN', 'IN_PROGRESS']] }
              }
            }
          }
        }
      },
      // Lookup offer verifications for offer letters
      {
        $lookup: {
          from: 'offerverifications',
          localField: '_id',
          foreignField: 'studentId',
          as: 'offers'
        }
      }
    ];

    // 5. Relational Filters (Applied after calculating metrics)
    const postMatchStage = {};
    if (placementStatus === 'Placed') postMatchStage.offerCount = { $gt: 0 };
    if (placementStatus === 'Seeking') postMatchStage.offerCount = 0;
    if (hasActivity === 'true') postMatchStage.applicationCount = { $gt: 0 };
    if (hasActivity === 'false') postMatchStage.applicationCount = 0;

    if (Object.keys(postMatchStage).length > 0) {
      pipeline.push({ $match: postMatchStage });
    }

    // 6. Pagination & Projection
    pipeline.push(
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: parseInt(limit, 10) },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          studentId: 1,
          department: 1,
          batch: 1,
          applicationCount: 1,
          interviewCount: 1,
          offerCount: 1,
          openInterventions: 1,
          jobSearchGoal: 1,
          privacySettings: 1,
          mentorId: 1,
          createdAt: 1,
          offers: 1
        }
      }
    );

    // Run aggregation
    const studentsRaw = await User.aggregate(pipeline);

    const students = studentsRaw.map(s => {
      const priv = s.privacySettings || {};
      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        studentId: s.studentId,
        department: s.department,
        batch: s.batch,
        applicationCount: priv.applicationProgress !== false ? s.applicationCount : null,
        interviewCount: priv.interviewProgress !== false ? s.interviewCount : null,
        offerCount: priv.interviewProgress !== false ? s.offerCount : null,
        openInterventions: s.openInterventions || 0,
        jobSearchGoal: priv.careerPreferences !== false ? s.jobSearchGoal : null,
        mentorId: s.mentorId || null,
        createdAt: s.createdAt
      };
    });

    // Get total count for pagination
    // Since we have post-match filters, we need a separate count pipeline
    const countPipeline = [...pipeline];
    countPipeline.splice(-4); // Remove sort, skip, limit, project
    countPipeline.push({ $count: 'total' });
    
    const countResult = await User.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: students
    });

  } catch (error) {
    next(error);
  }
};


// ── @route  GET /api/admin/students/:id ───────────────────────────────────────
// ── @desc   Get detailed profile and timeline of a specific student
// ── @access Private (Admin + Institution Access)
const getStudentById = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const studentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      return next(new Error('Invalid student ID'));
    }

    const query = {
      _id: studentId,
      institutionId,
      role: 'STUDENT',
      'privacySettings.shareProfileWithPlacement': { $ne: false }
    };

    if (req.user.role === 'MENTOR') {
      query.mentorId = req.user._id;
    }

    // 1. Fetch user and verify institution binding
    const student = await User.findOne(query).select('-password').lean(); // Explicitly exclude password

    if (!student) {
      res.status(404);
      return next(new Error('Student not found or access denied'));
    }

    // 2. Fetch Applications
    const applicationsRaw = await Application.find({ user: studentId }).sort({ updatedAt: -1 });

    // 3. Privacy Scrubbing Rules
    const priv = student.privacySettings || {};
    const shareSalary = priv.salary || priv.shareSalaryWithPlacement || false;
    const shareNotes = priv.shareNotesWithPlacement || false;

    let applicationsData = [];
    if (priv.applicationProgress !== false) {
      applicationsData = applicationsRaw.map(app => {
        const appObj = app.toObject();
        if (!shareSalary) {
          appObj.salary = undefined;
          appObj._salaryHidden = true;
        }
        if (!shareNotes) {
          appObj.notes = undefined;
          appObj._notesHidden = true;
        }
        appObj.resumeVersion = undefined; 
        return appObj;
      });
    }

    const applications = { data: applicationsData, shared: priv.applicationProgress !== false };

    // 4. Fetch Interviews
    let interviewsData = [];
    if (priv.interviewProgress !== false) {
      interviewsData = await Interview.find({ user: studentId }).sort({ scheduledAt: -1 }).populate('application', 'company role');
    }
    const interviews = { data: interviewsData, shared: priv.interviewProgress !== false };

    // 5. Fetch Resumes (Metadata only, for privacy)
    let resumesData = [];
    let topSkills = [];
    if (priv.resume === true || priv.skills !== false) {
      const resumesRaw = await Resume.find({ user: studentId }).sort({ createdAt: -1 });
      
      if (priv.resume === true) {
        resumesData = resumesRaw.map(r => ({
          _id: r._id,
          name: r.name,
          version: r.version,
          targetRole: r.targetRole,
          isDefault: r.isDefault,
          createdAt: r.createdAt,
          skills: r.skills
        }));
      }

      if (priv.skills !== false) {
        const skillCounts = {};
        resumesRaw.forEach(r => {
          r.skills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        });
        topSkills = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]).slice(0, 8);
      }
    }
    const resumes = { data: resumesData, shared: priv.resume === true };
    const skills = { data: topSkills, shared: priv.skills !== false };

    // Scrub Profile Career Preferences
    if (priv.careerPreferences === false) {
      delete student.jobSearchGoal;
      delete student.targetRoles;
      delete student.targetSalary;
      delete student.workPreference;
      delete student.employmentTypes;
    }
    
    // Explicitly scrub salary and resume based on granular privacy settings
    if (priv.salary === false) {
      delete student.targetSalary;
    }

    if (priv.resume === false) {
      delete student.resumeText;
    }

    // Aggregate metrics for profile header
    const totalApps = applicationsData.length;
    const interviewCount = applicationsData.filter(a => a.status === 'Interview' || a.status === 'Offer').length;
    const offerCount = applicationsData.filter(a => a.status === 'Offer').length;

    const openInterventions = await InterventionSignal.countDocuments({
      student: studentId,
      status: { $in: ['OPEN', 'IN_PROGRESS'] }
    });

    const stats = {
      totalApps,
      interviews: interviewCount,
      offers: offerCount,
      openInterventions,
      responseRate: totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0,
      interviewRate: totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0 
    };

    // 6. Career Signals Engine (only if application progress is shared)
    const careerSignals = [];
    if (priv.applicationProgress !== false) {
    
    // Signal: Activity Trend
    const nowTime = new Date().getTime();
    const thirtyDaysAgo = nowTime - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = nowTime - (60 * 24 * 60 * 60 * 1000);
    
    const appsLast30 = applicationsData.filter(a => new Date(a.dateApplied).getTime() >= thirtyDaysAgo).length;
    const appsPrev30 = applicationsData.filter(a => {
      const t = new Date(a.dateApplied).getTime();
      return t >= sixtyDaysAgo && t < thirtyDaysAgo;
    }).length;

    if (appsLast30 > appsPrev30 && appsPrev30 > 0) {
      careerSignals.push({
        text: 'Application activity has increased this month.',
        evidence: `Student submitted ${appsLast30} applications in the last 30 days, compared to ${appsPrev30} in the prior 30 days.`
      });
    } else if (appsLast30 === 0 && appsPrev30 > 0) {
      careerSignals.push({
        text: 'Application activity has stalled.',
        evidence: 'No applications submitted in the last 30 days.'
      });
    }

    // Signal: Dominant Role
    if (applicationsData.length > 0) {
      const roleCounts = {};
      applicationsData.forEach(a => {
        if (a.role) roleCounts[a.role] = (roleCounts[a.role] || 0) + 1;
      });
      const topRole = Object.keys(roleCounts).reduce((a, b) => roleCounts[a] > roleCounts[b] ? a : b);
      if (roleCounts[topRole] > applicationsData.length * 0.4) {
        careerSignals.push({
          text: `Most applications are targeting ${topRole} roles.`,
          evidence: `${roleCounts[topRole]} out of ${applicationsData.length} applications are for this role.`
        });
      }
    }

    // Signal: Best Source
    const sourceStats = {};
    applicationsData.forEach(a => {
      if (a.source) {
        if (!sourceStats[a.source]) sourceStats[a.source] = { total: 0, responses: 0 };
        sourceStats[a.source].total += 1;
        if (a.status === 'Interview' || a.status === 'Offer') {
          sourceStats[a.source].responses += 1;
        }
      }
    });

    let bestSource = null;
    let bestSourceRate = 0;
    Object.keys(sourceStats).forEach(source => {
      if (sourceStats[source].total >= 3) {
        const rate = sourceStats[source].responses / sourceStats[source].total;
        if (rate > bestSourceRate) {
          bestSourceRate = rate;
          bestSource = source;
        }
      }
    });

    if (bestSource && bestSourceRate > 0) {
      careerSignals.push({
        text: `Applications via ${bestSource} have historically produced stronger responses.`,
        evidence: `${Math.round(bestSourceRate * 100)}% conversion rate to interview/offer (${sourceStats[bestSource].responses}/${sourceStats[bestSource].total}).`
      });
    }
    } // End career signals condition

    res.status(200).json({
      success: true,
      data: {
        profile: student,
        stats,
        applications,
        interviews,
        resumes,
        skills: topSkills,
        careerSignals
      }
    });

  } catch (error) {
    next(error);
  }
};

// ── @route  PATCH /api/admin/students/:id/mentor ──────────────────────────────
// ── @desc   Assign a mentor and/or placement officer to a student
// ── @access Private (Admin + Institution Access)
const assignMentor = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const studentId = req.params.id;
    const { mentorId, placementOfficerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      return next(new Error('Invalid student ID'));
    }

    // 1. Verify student
    const student = await User.findOne({
      _id: studentId,
      institutionId,
      role: 'STUDENT'
    });

    if (!student) {
      res.status(404);
      return next(new Error('Student not found or access denied'));
    }

    // 2. Validate Placement Officer (if provided)
    if (placementOfficerId) {
      const officer = await User.findOne({
        _id: placementOfficerId,
        institutionId,
        role: 'PLACEMENT_OFFICER'
      });
      if (!officer) {
        res.status(400);
        return next(new Error('Invalid placement officer ID or does not belong to your institution'));
      }
    }

    // 3. Validate Mentor (if provided)
    if (mentorId) {
      const mentorQuery = {
        _id: mentorId,
        institutionId,
        role: 'MENTOR'
      };
      
      
      
      const mentor = await User.findOne(mentorQuery);
      if (!mentor) {
        res.status(400);
        return next(new Error('Invalid mentor ID or mentor does not belong to you'));
      }
      
    }

    // 4. Update student
    if (placementOfficerId !== undefined) student.placementOfficerId = placementOfficerId || null;
    
      
    
    if (mentorId !== undefined) student.mentorId = mentorId || null;
    
    await student.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: { mentorId: student.mentorId, placementOfficerId: student.placementOfficerId }
    });

  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/admin/students/bulk-assignment ─────────────────────────
// ── @desc   Assign PO and Mentor to multiple students
// ── @access Private (Institution Admin)
const bulkAssignMentor = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { studentIds, placementOfficerId, mentorId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400);
      return next(new Error('No students selected for assignment'));
    }

    // Validate Placement Officer
    if (placementOfficerId) {
      const officer = await User.findOne({ _id: placementOfficerId, institutionId, role: 'PLACEMENT_OFFICER' });
      if (!officer) {
        res.status(400);
        return next(new Error('Invalid placement officer ID'));
      }
    }

    // Validate Mentor
    if (mentorId) {
      const mentor = await User.findOne({ _id: mentorId, institutionId, role: 'MENTOR' });
      if (!mentor) {
        res.status(400);
        return next(new Error('Invalid mentor ID'));
      }
      
    }

    // Verify all students belong to the institution
    const students = await User.find({ _id: { $in: studentIds }, role: 'STUDENT' });
    const invalidStudents = students.filter(s => s.institutionId.toString() !== institutionId.toString());
    
    if (invalidStudents.length > 0 || students.length !== studentIds.length) {
      res.status(400);
      return next(new Error('One or more students are invalid or do not belong to your institution'));
    }

    // Bulk update
    const updateFields = {};
    if (placementOfficerId !== undefined) updateFields.placementOfficerId = placementOfficerId || null;
    if (mentorId !== undefined) updateFields.mentorId = mentorId || null;

    if (Object.keys(updateFields).length > 0) {
      await User.updateMany(
        { _id: { $in: studentIds }, institutionId },
        { $set: updateFields }
      );
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated assignments for ${studentIds.length} students`
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/admin/students/:id/feedback ──────────────────────────
// ── @desc   Leave feedback on a student's profile
// ── @access Private (Admin + Institution Access)
const createFeedback = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const studentId = req.params.id;
    const mentorId = req.user._id;
    const { content, type, applicationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      return next(new Error('Invalid student ID'));
    }

    const studentQuery = { _id: studentId, institutionId, role: 'STUDENT' };
    if (req.user.role === 'MENTOR') {
      studentQuery.mentorId = mentorId;
    }

    const student = await User.findOne(studentQuery);
    if (!student) {
      res.status(404);
      return next(new Error('Student not found or access denied'));
    }

    const feedback = await MentorFeedback.create({
      studentId,
      mentorId,
      applicationId: applicationId || null,
      content,
      type: type || 'GENERAL'
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/admin/students/:id/feedback ───────────────────────────
// ── @desc   Get feedback for a student
// ── @access Private (Admin + Institution Access)
const getFeedback = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const studentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      return next(new Error('Invalid student ID'));
    }

    const studentQuery = { _id: studentId, institutionId, role: 'STUDENT' };
    if (req.user.role === 'MENTOR') {
      studentQuery.mentorId = req.user._id;
    }

    const student = await User.findOne(studentQuery);
    if (!student) {
      res.status(404);
      return next(new Error('Student not found or access denied'));
    }

    const query = { studentId };
    if (req.query.applicationId) {
      query.applicationId = req.query.applicationId;
    }

    const feedback = await MentorFeedback.find(query)
      .populate('mentorId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const { name, email, studentId, department, batch, mentorId } = req.body;

    if (!name || !email || !studentId) {
      res.status(400);
      return next(new Error('Name, email, and studentId are required'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409);
      return next(new Error('An account with this email already exists'));
    }

    // If mentorId provided, verify mentor belongs to the same institution
    if (mentorId) {
      const mentor = await User.findOne({ _id: mentorId, institutionId, role: 'MENTOR' });
      if (!mentor) {
        res.status(400);
        return next(new Error('Invalid mentor assignment. Mentor not found in this institution.'));
      }
    }

    const student = await User.create({
      name,
      email,
      studentId,
      department,
      batch,
      mentorId: mentorId || null,
      role: 'STUDENT',
      institutionId,
      password: 'password123', // Demo fallback, normally would send invite link
      isActive: true
    });

    res.status(201).json({ success: true, data: { _id: student._id, name, email, studentId } });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const id = req.params.id;
    const { name, department, batch, studentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid student ID'));
    }

    const student = await User.findOne({ _id: id, institutionId, role: 'STUDENT' });
    if (!student) {
      res.status(404);
      return next(new Error('Student not found or access denied'));
    }

    if (name) student.name = name;
    if (department) student.department = department;
    if (batch) student.batch = batch;
    if (studentId) student.studentId = studentId;

    await student.save();

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

const deactivateStudent = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid student ID'));
    }

    const student = await User.findOne({ _id: id, institutionId, role: 'STUDENT' });
    if (!student) {
      res.status(404);
      return next(new Error('Student not found or access denied'));
    }

    // Soft delete
    student.isActive = false;
    await student.save();

    res.status(200).json({ success: true, message: 'Student deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deactivateStudent,
  assignMentor,
  bulkAssignMentor,
  createFeedback,
  getFeedback
};
