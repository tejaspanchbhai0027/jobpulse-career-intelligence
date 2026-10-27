const PlacementDrive = require('../models/PlacementDrive');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const config = require('../utils/opportunityMatchConfig');
const { normalizeSkills } = require('../utils/skillNormalizer');
const { checkEligibility } = require('./opportunityEligibilityService');

/**
 * Calculates a match score and generates reasons based on student and opportunity data.
 */
const calculateMatch = (student, resume, opportunity) => {
  let score = 0;
  const breakdown = {
    skillsMatch: 0,
    roleMatch: 0,
    resumeMatch: 0,
    educationMatch: 0,
    experienceMatch: 0,
    locationMatch: 0,
    jobPreference: 0
  };
  const reasons = [];
  const missingSkills = [];
  const matchingSkills = [];
  
  // 1. Skills Match (35%)
  const oppSkills = normalizeSkills(opportunity.skills || opportunity.requiredSkills || []);
  let studentSkills = [];
  if (resume && resume.skills) {
    studentSkills = normalizeSkills(resume.skills);
  } else if (resume && resume.extractedText) {
    // Basic fallback if extracted text exists but skills array is empty (handled by AI usually)
    // We'll rely on what's available
  }
  
  if (oppSkills.length > 0) {
    let matchedCount = 0;
    oppSkills.forEach(skill => {
      if (studentSkills.includes(skill)) {
        matchedCount++;
        matchingSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });
    const skillsRatio = matchedCount / oppSkills.length;
    breakdown.skillsMatch = Math.round(skillsRatio * 100);
    score += skillsRatio * config.weights.skillsMatch;
    
    if (skillsRatio > 0.7) {
      reasons.push('✓ Strong skill match with your profile');
    } else if (skillsRatio > 0.3) {
      reasons.push('✓ Partial skill match');
    } else {
      reasons.push('⚠ Missing key required skills');
    }
  } else {
    // If no skills required, give full points for skills match
    breakdown.skillsMatch = 100;
    score += config.weights.skillsMatch;
  }

  // 2. Role Match (20%)
  const oppRole = (opportunity.jobRole || opportunity.title || '').toLowerCase();
  const studentTargetRoles = (student.targetRoles || []).map(r => r.toLowerCase());
  const studentGoal = (student.jobSearchGoal || '').toLowerCase();
  
  if (oppRole && (studentTargetRoles.some(r => oppRole.includes(r) || r.includes(oppRole)) || oppRole.includes(studentGoal) || studentGoal.includes(oppRole))) {
    breakdown.roleMatch = 100;
    score += config.weights.roleMatch;
    reasons.push('✓ Matches your target role');
  } else if (oppRole) {
    reasons.push('⚠ Different from your primary target role');
  } else {
    score += config.weights.roleMatch; // Give benefit of doubt
  }

  // 3. Resume Match (20%)
  // If they have a primary resume, they get some points. If ATS score exists for this role, use it.
  if (resume) {
    breakdown.resumeMatch = resume.atsScore || 60; // Base score for having a resume
    score += (breakdown.resumeMatch / 100) * config.weights.resumeMatch;
    if (resume.atsScore > 75) {
      reasons.push('✓ Your resume is well-optimized');
    }
  } else {
    reasons.push('⚠ Upload a resume to improve matching');
  }

  // 4. Education Match (10%)
  if (opportunity.eligibleBatches && opportunity.eligibleBatches.length > 0) {
    if (student.batch && opportunity.eligibleBatches.includes(student.batch)) {
      breakdown.educationMatch = 100;
      score += config.weights.educationMatch;
      reasons.push('✓ You meet the batch/education requirements');
    }
  } else {
    breakdown.educationMatch = 100;
    score += config.weights.educationMatch;
  }

  // 5. Experience Match (5%)
  // JobPulse student portal currently assumes entry-level/student, so we default to high match
  breakdown.experienceMatch = 100;
  score += config.weights.experienceMatch;

  // 6. Location Match (5%)
  const oppLocation = (opportunity.location || '').toLowerCase();
  const preferredLocations = (student.preferredLocations || []).map(l => l.toLowerCase());
  if (oppLocation && oppLocation !== 'tbd' && preferredLocations.length > 0) {
    if (preferredLocations.some(l => oppLocation.includes(l) || l.includes(oppLocation))) {
      breakdown.locationMatch = 100;
      score += config.weights.locationMatch;
      reasons.push('✓ Matches your preferred location');
    }
  } else {
    breakdown.locationMatch = 100; // Neutral
    score += config.weights.locationMatch;
  }

  // 7. Job Preference Match (Work Mode) (5%)
  const oppMode = (opportunity.workMode || '').toLowerCase();
  const prefMode = (student.workPreference || 'any').toLowerCase();
  if (prefMode === 'any' || oppMode === 'tbd' || oppMode.includes(prefMode)) {
    breakdown.jobPreference = 100;
    score += config.weights.jobPreference;
  } else {
    breakdown.jobPreference = 50; // Partial match
    score += (50 / 100) * config.weights.jobPreference;
  }

  // Normalize final score
  const totalScore = Math.round(score);

  return {
    score: totalScore,
    breakdown,
    reasons,
    missingSkills,
    matchingSkills
  };
};

/**
 * Get recommended opportunities for a student
 */
exports.getRecommendations = async (user) => {
  const institutionId = user.institutionId;
  
  // 1. Fetch available opportunities
  const [drives, opportunities, applications, resumes] = await Promise.all([
    PlacementDrive.find({ 
      institutionId, 
      status: { $in: ['PUBLISHED', 'REGISTRATION_OPEN', 'IN_PROGRESS'] } 
    }).lean(),
    Opportunity.find({ 
      institutionId, 
      status: 'Open' 
    }).lean(),
    Application.find({ user: user._id }).lean(),
    Resume.find({ user: user._id }).sort({ isDefault: -1, createdAt: -1 }).lean()
  ]);

  const primaryResume = resumes.length > 0 ? resumes[0] : null;
  const appliedDriveIds = applications.filter(a => a.placementDriveId).map(a => a.placementDriveId.toString());
  // Determine if it was tracked/wishlisted (without a placementDriveId, it might just match by role/company or url)
  // Or we can rely on status === 'Wishlist'
  
  const recommendations = [];

  // Process Placement Drives
  for (const drive of drives) {
    const { isEligible, reasons: eligibilityReasons } = checkEligibility(user, drive);
    
    // Check if already applied
    const hasApplied = appliedDriveIds.includes(drive._id.toString()) || 
                       (drive.registeredStudents && drive.registeredStudents.map(id => id.toString()).includes(user._id.toString()));
    
    // Check if wishlisted
    const existingApp = applications.find(a => a.placementDriveId?.toString() === drive._id.toString());
    const isWishlisted = existingApp && existingApp.status === 'Wishlist';

    const matchData = calculateMatch(user, primaryResume, drive);

    recommendations.push({
      _id: drive._id,
      sourceModel: 'PlacementDrive',
      company: drive.company,
      title: drive.title || drive.jobRole,
      type: drive.employmentType || 'Full-Time',
      location: drive.location,
      workMode: drive.workMode,
      salary: drive.salaryRange,
      deadline: drive.registrationEndDate,
      postedDate: drive.createdAt,
      skills: drive.requiredSkills || [],
      isEligible,
      eligibilityReasons,
      hasApplied: hasApplied && !isWishlisted,
      isWishlisted,
      status: drive.status,
      applicationId: existingApp ? existingApp._id : null,
      match: matchData
    });
  }

  // Process manual Opportunities
  for (const opp of opportunities) {
    const hasApplied = applications.some(a => a.company === opp.company && a.role === opp.title && a.status !== 'Wishlist');
    const isWishlisted = opp.trackedBy && opp.trackedBy.map(id=>id.toString()).includes(user._id.toString());
    const existingApp = applications.find(a => a.company === opp.company && a.role === opp.title);

    const matchData = calculateMatch(user, primaryResume, opp);

    recommendations.push({
      _id: opp._id,
      sourceModel: 'Opportunity',
      company: opp.company,
      title: opp.title,
      type: opp.type || 'Full-Time',
      location: opp.location,
      workMode: opp.workMode,
      salary: opp.salary,
      deadline: opp.deadline,
      postedDate: opp.createdAt,
      skills: opp.skills || [],
      isEligible: true, // Manual opportunities are generally open
      eligibilityReasons: [],
      hasApplied,
      isWishlisted,
      status: opp.status,
      applicationId: existingApp ? existingApp._id : null,
      match: matchData
    });
  }

  // Rank opportunities
  recommendations.sort((a, b) => b.match.score - a.match.score);

  return recommendations;
};
