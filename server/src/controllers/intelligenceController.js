const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');

const { calculateTwin } = require('../services/intelligence/careerTwinService');
const { calculateDiagnosis } = require('../services/intelligence/diagnosisService');
const { calculateOpportunities } = require('../services/intelligence/opportunityService');
const { calculateResumePerformance } = require('../services/intelligence/resumePerformanceService');
const { calculateMarketIntelligence } = require('../services/intelligence/marketService');
const { getRecommendations } = require('../services/intelligence/decisionEngine');
const JobDescriptionSnapshot = require('../models/JobDescriptionSnapshot');

// @desc    Get intelligence overview (Decision Engine Recommendations)
// @route   GET /api/intelligence/overview
// @access  Private
const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const interviews = await Interview.find({ user: userId }).populate('application');

  const recommendations = getRecommendations(applications, interviews);

  res.status(200).json({ 
    success: true, 
    data: { 
      status: 'Intelligence active', 
      health: 100,
      recommendations
    } 
  });
});

// @desc    Get Job Search DNA
// @route   GET /api/intelligence/dna
// @access  Private
const getDNA = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const twin = calculateTwin(applications, req.user.jobSearchGoal);

  // Map to old DNA format for backward compatibility temporarily
  res.status(200).json({
    success: true,
    data: {
      insufficientData: twin.insufficientData,
      totalApplications: applications.length,
      responseRate: Math.round(twin.overallResponseRate * 100),
      interviewRate: twin.insufficientData ? 0 : 10, // Placeholder
      offerRate: 0, // Placeholder
      bestSource: twin.bestSource,
      bestResume: twin.bestResume,
      strongPattern: twin.bestSource !== 'Unknown' ? `Applications via ${twin.bestSource}` : 'Not enough data',
      weakPattern: twin.weakestSource !== 'Unknown' ? twin.weakestSource : 'Not enough data'
    }
  });
});

// @desc    Get Job Search Diagnosis (Funnel Analysis)
// @route   GET /api/intelligence/diagnosis
// @access  Private
const getDiagnosis = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const diagnosis = calculateDiagnosis(applications);

  res.status(200).json({
    success: true,
    data: diagnosis
  });
});

// @desc    Get Opportunities (Opportunity Score Engine)
// @route   GET /api/intelligence/opportunities
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const scoredApplications = calculateOpportunities(applications);

  res.status(200).json({
    success: true,
    data: scoredApplications
  });
});

// @desc    Get Resume Performance
// @route   GET /api/intelligence/resume-performance
// @access  Private
const getResumePerformance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const performance = calculateResumePerformance(applications);

  res.status(200).json({
    success: true,
    data: performance
  });
});

// @desc    Get Forecast (What-If Simulator data)
// @route   GET /api/intelligence/forecast
// @access  Private
const getForecast = asyncHandler(async (req, res) => {
  // Keep original logic for now or refactor to simulatorService later
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const diagnosis = calculateDiagnosis(applications);

  if (diagnosis.insufficientData) {
    return res.status(200).json({ success: true, data: { insufficientData: true, message: "Not enough personal data to estimate this yet." } });
  }

  res.status(200).json({
    success: true,
    data: {
      historicalRates: {
        overall: {
          responseRate: diagnosis.responseRate,
          interviewRate: diagnosis.interviewConversion,
          offerRate: diagnosis.offerConversion
        },
        referralInterviewRate: diagnosis.interviewConversion + 0.1, // mocked for now
        coldInterviewRate: Math.max(0, diagnosis.interviewConversion - 0.05)
      }
    }
  });
});

// @desc    Get Interview Preparation Data
// @route   GET /api/intelligence/interview-prep/:id
// @access  Private
const getInterviewPrep = asyncHandler(async (req, res) => {
  const interviewId = req.params.id;
  const interview = await Interview.findOne({ _id: interviewId, user: req.user._id }).populate('application');

  if (!interview) {
    res.status(404);
    throw new Error('Interview not found');
  }

  const app = interview.application;
  const previousInterviews = await Interview.find({ 
    application: app._id, 
    user: req.user._id,
    scheduledAt: { $lt: interview.scheduledAt } 
  }).sort('-scheduledAt');

  res.status(200).json({
    success: true,
    data: {
      company: app.company,
      role: app.role,
      resumeVersion: app.resumeVersion,
      jobDescription: app.jobDescription,
      interviewType: interview.interviewType,
      round: interview.round,
      scheduledAt: interview.scheduledAt,
      interviewerName: interview.interviewerName,
      meetingUrl: interview.meetingUrl,
      notes: interview.notes,
      applicationNotes: app.notes,
      previousInterviews: previousInterviews.map(i => ({
        round: i.round,
        type: i.interviewType,
        notes: i.notes
      }))
    }
  });
});

// @desc    Get Job Description Evolution (Diff)
// @route   GET /api/intelligence/jd-evolution/:id
// @access  Private
const getJdEvolution = asyncHandler(async (req, res) => {
  const applicationId = req.params.id;
  const snapshots = await JobDescriptionSnapshot.find({ 
    applicationId, 
    userId: req.user._id 
  }).sort('createdAt');

  if (snapshots.length < 2) {
    return res.status(200).json({
      success: true,
      data: {
        hasChanged: false,
        snapshots,
        message: "No changes detected or not enough snapshots available."
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      hasChanged: true,
      snapshots,
      message: `${snapshots.length} versions of this job description were found.`
    }
  });
});

// @desc    Get Recruiter Network
// @route   GET /api/intelligence/recruiter-network
// @access  Private
const getRecruiterNetwork = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });

  const recruiters = {};
  applications.forEach(app => {
    if (app.contact && app.contact.trim() !== '') {
      const contactName = app.contact.trim();
      if (!recruiters[contactName]) recruiters[contactName] = { applications: [] };
      recruiters[contactName].applications.push({
        id: app._id,
        company: app.company,
        role: app.role,
        status: app.status
      });
    }
  });

  const network = Object.keys(recruiters).map(name => ({
    name,
    applications: recruiters[name].applications,
    total: recruiters[name].applications.length
  })).sort((a, b) => b.total - a.total);

  res.status(200).json({ success: true, data: network });
});

// @desc    Get Deep Market Intelligence
// @route   GET /api/intelligence/market
// @access  Private
const getMarketIntelligence = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const market = calculateMarketIntelligence(applications);

  res.status(200).json({ success: true, data: market });
});

// @desc    Get Career Twin (Behavioral Model)
// @route   GET /api/intelligence/twin
// @access  Private
const getCareerTwin = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const twin = calculateTwin(applications, req.user.jobSearchGoal);

  res.status(200).json({ success: true, data: twin });
});

// @desc    Get Strategy Autopilot (Suggested Experiments)
// @route   GET /api/intelligence/autopilot
// @access  Private
const getStrategyAutopilot = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      hasSuggestion: true,
      insight: 'Your referral applications have a higher observed interview rate than your LinkedIn applications.',
      suggestion: 'Compare 10 referral applications against 10 LinkedIn applications using your best resume.',
      actionType: 'CreateExperiment'
    }
  });
});

// @desc    Submit feedback on a Recommendation
// @route   POST /api/intelligence/recommendations/:id/feedback
// @access  Private
const submitRecommendationFeedback = asyncHandler(async (req, res) => {
  const { decision } = req.body; // ACCEPTED or DISMISSED
  const { id } = req.params;
  
  // For Phase 1, we just return success. Later we can persist this to a RecommendationFeedback model
  console.log(`Recommendation ${id} was ${decision} by user ${req.user._id}`);
  
  res.status(200).json({
    success: true,
    message: `Feedback ${decision} logged.`
  });
});

// @desc    Get Knowledge Graph Data
// @route   GET /api/intelligence/knowledge-graph
// @access  Private
const getKnowledgeGraph = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // 1. Fetch real data
  const applications = await Application.find({ user: userId });
  const interviews = await Interview.find({ user: userId }).populate('application', 'company role');
  const resumes = await Resume.find({ user: userId });
  
  const nodes = [];
  const edges = [];
  let yOffset = 0;

  // 2. Add Center Node (Student)
  nodes.push({
    id: 'student',
    type: 'default',
    data: { label: 'YOU' },
    position: { x: 400, y: 300 },
    style: { background: 'var(--color-brand-primary)', color: '#fff', fontWeight: 'bold', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }
  });

  // 3. Add Resumes & Skills
  resumes.forEach((resume, idx) => {
    const resumeId = `resume-${resume._id}`;
    nodes.push({
      id: resumeId,
      data: { label: resume.name },
      position: { x: 150, y: 150 + (idx * 150) },
      style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '2px solid var(--color-interview)', borderRadius: '8px', padding: '10px' }
    });
    edges.push({ id: `e-student-${resumeId}`, source: 'student', target: resumeId, animated: true, style: { stroke: 'var(--color-border)' } });
    
    // Add up to 3 skills per resume
    resume.skills?.slice(0, 3).forEach((skill, sIdx) => {
      const skillId = `skill-${resume._id}-${skill}`;
      nodes.push({
        id: skillId,
        data: { label: skill },
        position: { x: 20, y: 100 + (idx * 150) + (sIdx * 60) },
        style: { background: 'var(--color-success)', color: '#fff', border: 'none', borderRadius: '15px', padding: '5px 10px', fontSize: '10px' }
      });
      edges.push({ id: `e-${resumeId}-${skillId}`, source: resumeId, target: skillId, style: { stroke: 'rgba(16,185,129,0.5)' } });
    });
  });

  // 4. Add Companies (Aggregated by Company Name)
  const companyCounts = {};
  applications.forEach(app => {
    companyCounts[app.company] = (companyCounts[app.company] || 0) + 1;
  });

  Object.keys(companyCounts).forEach((company, idx) => {
    const companyId = `company-${company}`;
    nodes.push({
      id: companyId,
      data: { label: `${company} (${companyCounts[company]})` },
      position: { x: 700, y: 100 + (idx * 120) },
      style: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '2px solid var(--color-applied)', borderRadius: '8px', padding: '10px' }
    });
    edges.push({ id: `e-student-${companyId}`, source: 'student', target: companyId, animated: true, style: { stroke: 'var(--color-border)' } });
  });

  // 5. Add Interviews
  interviews.forEach((interview, idx) => {
    if (!interview.application) return;
    const interviewId = `interview-${interview._id}`;
    const companyId = `company-${interview.application.company}`;
    
    nodes.push({
      id: interviewId,
      data: { label: `${interview.round} Interview` },
      position: { x: 900, y: 100 + (idx * 100) },
      style: { background: 'var(--color-offer)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px' }
    });
    // Link interview to company
    edges.push({ id: `e-${companyId}-${interviewId}`, source: companyId, target: interviewId, style: { stroke: 'rgba(245,158,11,0.5)' } });
  });

  res.status(200).json({
    success: true,
    data: { nodes, edges }
  });
});

module.exports = {
  getOverview,
  getDNA,
  getDiagnosis,
  getOpportunities,
  getResumePerformance,
  getForecast,
  getInterviewPrep,
  getJdEvolution,
  getRecruiterNetwork,
  getMarketIntelligence,
  getCareerTwin,
  getStrategyAutopilot,
  submitRecommendationFeedback,
  getKnowledgeGraph
};
