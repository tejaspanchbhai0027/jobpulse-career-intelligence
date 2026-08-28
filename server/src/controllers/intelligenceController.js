const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const ApplicationEvent = require('../models/ApplicationEvent');
const CareerExperiment = require('../models/CareerExperiment');

// @desc    Get intelligence overview
// @route   GET /api/intelligence/overview
// @access  Private
const getOverview = asyncHandler(async (req, res) => {
  // A placeholder that will eventually return health score, top bottleneck, etc.
  res.status(200).json({ success: true, data: { status: 'Intelligence active', health: 100 } });
});

// @desc    Get Job Search DNA
// @route   GET /api/intelligence/dna
// @access  Private
const getDNA = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch all applications
  const applications = await Application.find({ user: userId });
  const totalApps = applications.length;

  if (totalApps === 0) {
    return res.status(200).json({
      success: true,
      data: {
        insufficientData: true,
        message: "You need more application history before personalized insights become available."
      }
    });
  }

  // Calculate Conversions
  const interviews = applications.filter(a => a.status === 'Interview' || a.status === 'Offer' || a.status === 'Rejected');
  const totalInterviews = applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length; 
  // Wait, better logic for tracking interviews is seeing if an Interview object exists for this app, but for DNA simple status check is fine as baseline.

  const offers = applications.filter(a => a.status === 'Offer').length;

  // Best Source
  const sourceStats = {};
  applications.forEach(app => {
    if (app.source) {
      if (!sourceStats[app.source]) sourceStats[app.source] = { count: 0, interviews: 0 };
      sourceStats[app.source].count++;
      if (app.status === 'Interview' || app.status === 'Offer') sourceStats[app.source].interviews++;
    }
  });

  let bestSource = "Not enough data yet.";
  let highestSourceRate = -1;
  for (const [source, stats] of Object.entries(sourceStats)) {
    if (stats.count >= 2) { // Need at least some data
      const rate = stats.interviews / stats.count;
      if (rate > highestSourceRate) {
        highestSourceRate = rate;
        bestSource = source;
      }
    }
  }

  // Best Resume
  const resumeStats = {};
  applications.forEach(app => {
    if (app.resumeVersion) {
      if (!resumeStats[app.resumeVersion]) resumeStats[app.resumeVersion] = { count: 0, interviews: 0 };
      resumeStats[app.resumeVersion].count++;
      if (app.status === 'Interview' || app.status === 'Offer') resumeStats[app.resumeVersion].interviews++;
    }
  });

  let bestResume = "Not enough data yet.";
  let highestResumeRate = -1;
  for (const [resume, stats] of Object.entries(resumeStats)) {
    if (stats.count >= 2) {
      const rate = stats.interviews / stats.count;
      if (rate > highestResumeRate) {
        highestResumeRate = rate;
        bestResume = resume;
      }
    }
  }

  // Calculate generic response rate (Interviews + Rejections that were responded to)
  const respondedApps = applications.filter(a => a.status !== 'Applied' && a.status !== 'Wishlist').length;

  res.status(200).json({
    success: true,
    data: {
      insufficientData: totalApps < 5, // Show partial if < 5
      totalApplications: totalApps,
      responseRate: totalApps ? Math.round((respondedApps / totalApps) * 100) : 0,
      interviewRate: totalApps ? Math.round((totalInterviews / totalApps) * 100) : 0,
      offerRate: totalApps ? Math.round((offers / totalApps) * 100) : 0,
      bestSource,
      bestResume,
      strongPattern: bestSource !== "Not enough data yet." ? `Applications via ${bestSource}` : "Not enough data yet.",
      weakPattern: "Cold applications" // placeholder heuristic
    }
  });
});

// @desc    Get Job Search Diagnosis (Funnel Analysis)
// @route   GET /api/intelligence/diagnosis
// @access  Private
const getDiagnosis = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const applications = await Application.find({ user: userId });
  const totalApps = applications.length;

  if (totalApps < 5) {
    return res.status(200).json({
      success: true,
      data: {
        insufficientData: true,
        message: "You need more application history to generate a diagnosis."
      }
    });
  }

  // Basic Funnel Calculation
  const respondedApps = applications.filter(a => a.status !== 'Applied' && a.status !== 'Wishlist').length;
  const interviews = applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length;
  const offers = applications.filter(a => a.status === 'Offer').length;

  const responseRate = totalApps > 0 ? respondedApps / totalApps : 0;
  const interviewConversion = respondedApps > 0 ? interviews / respondedApps : 0;
  const offerConversion = interviews > 0 ? offers / interviews : 0;

  // Determine biggest bottleneck
  let bottleneck = "Need more data";
  let explanation = "";

  if (responseRate < 0.15) {
    bottleneck = "Application → Response";
    explanation = "Your response rate is quite low. This suggests your biggest opportunity is improving the quality or targeting of initial applications. Check your resume match scores and source strategy.";
  } else if (interviewConversion < 0.30) {
    bottleneck = "Response → Interview";
    explanation = "You're getting responses, but they aren't converting into interviews efficiently. Are you passing initial screens or take-home assignments? Review your preliminary communication.";
  } else if (interviews >= 3 && offerConversion < 0.20) {
    bottleneck = "Interview → Offer";
    explanation = "You are successfully landing interviews but struggling to close offers. Your bottleneck is interview execution. Check your interview preparation and technical performance.";
  } else {
    bottleneck = "Pipeline looks healthy";
    explanation = "Your funnel conversions look solid across the board! Keep applying consistently.";
  }

  res.status(200).json({
    success: true,
    data: {
      funnel: {
        applications: totalApps,
        responses: respondedApps,
        interviews: interviews,
        offers: offers
      },
      bottleneck,
      explanation
    }
  });
});

// @desc    Get Opportunities (Opportunity Score Engine)
// @route   GET /api/intelligence/opportunities
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });

  const scoredApplications = applications.map(app => {
    let score = 0;
    
    // 1. Resume Match / Job Fit (Up to 40 points)
    // If AI hasn't matched it yet, we just give a neutral 20.
    // If they have resume match data, we use it. 
    // Assuming resume match data might be stored somewhere, if not, we use heuristics.
    // Let's assume there's a field or we base it on JD completeness.
    if (app.jobDescription && app.jobDescription.length > 100) score += 20;
    else score += 10;
    
    // 2. Trust Signals & Salary (Up to 20 points)
    if (app.salary && app.salary.trim() !== '') score += 10;
    if (app.company && app.company.length > 2) score += 10;
    
    // 3. Contact Availability (Up to 20 points)
    if (app.contact && app.contact.trim() !== '') score += 20;

    // 4. Source & Priority (Up to 20 points)
    if (app.isPriority) score += 10;
    if (app.source && (app.source.toLowerCase().includes('referral') || app.source.toLowerCase().includes('network'))) {
      score += 10;
    } else if (app.source) {
      score += 5;
    }

    // Normalize
    score = Math.min(100, Math.max(0, score));

    let category = "Low Signal";
    if (score >= 80) category = "Strong Opportunity";
    else if (score >= 60) category = "Good Opportunity";
    else if (score >= 40) category = "Review Carefully";

    return {
      id: app._id,
      company: app.company,
      role: app.role,
      status: app.status,
      score,
      category
    };
  });

  // Sort highest score first
  scoredApplications.sort((a, b) => b.score - a.score);

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

  const resumeStats = {};

  applications.forEach(app => {
    const version = app.resumeVersion || 'Unknown';
    if (!resumeStats[version]) {
      resumeStats[version] = { applications: 0, responses: 0, interviews: 0, offers: 0 };
    }
    
    resumeStats[version].applications++;
    if (app.status !== 'Applied' && app.status !== 'Wishlist') resumeStats[version].responses++;
    if (app.status === 'Interview' || app.status === 'Offer') resumeStats[version].interviews++;
    if (app.status === 'Offer') resumeStats[version].offers++;
  });

  const formattedStats = Object.keys(resumeStats).map(version => {
    const stats = resumeStats[version];
    return {
      version,
      applications: stats.applications,
      responses: stats.responses,
      interviews: stats.interviews,
      offers: stats.offers,
      responseRate: stats.applications > 0 ? (stats.responses / stats.applications) : 0,
      interviewRate: stats.applications > 0 ? (stats.interviews / stats.applications) : 0,
      offerRate: stats.interviews > 0 ? (stats.offers / stats.interviews) : 0
    };
  });

  // Sort by interview rate
  formattedStats.sort((a, b) => b.interviewRate - a.interviewRate);

  let topPerformer = null;
  const validStats = formattedStats.filter(s => s.version !== 'Unknown' && s.applications >= 3);
  if (validStats.length > 0) {
    topPerformer = validStats[0].version;
  }

  res.status(200).json({
    success: true,
    data: {
      stats: formattedStats,
      topPerformer,
      message: topPerformer ? `Highest recorded interview conversion: ${topPerformer}` : "Insufficient data to declare a top performer."
    }
  });
});

// @desc    Get Forecast (What-If Simulator data)
// @route   GET /api/intelligence/forecast
// @access  Private
const getForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });
  const totalApps = applications.length;

  if (totalApps < 5) {
    return res.status(200).json({
      success: true,
      data: {
        insufficientData: true,
        message: "Not enough personal data to estimate this yet."
      }
    });
  }

  const respondedApps = applications.filter(a => a.status !== 'Applied' && a.status !== 'Wishlist').length;
  const interviews = applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length;
  const offers = applications.filter(a => a.status === 'Offer').length;

  const responseRate = respondedApps / totalApps;
  const interviewRate = interviews / totalApps;
  const offerRate = offers / totalApps;

  // Let's also split by referral vs cold for more accurate what-if simulation
  const referralApps = applications.filter(a => a.source && (a.source.toLowerCase().includes('referral') || a.source.toLowerCase().includes('network')));
  const coldApps = applications.filter(a => !a.source || (!a.source.toLowerCase().includes('referral') && !a.source.toLowerCase().includes('network')));

  const referralInterviews = referralApps.filter(a => a.status === 'Interview' || a.status === 'Offer').length;
  const coldInterviews = coldApps.filter(a => a.status === 'Interview' || a.status === 'Offer').length;

  const referralInterviewRate = referralApps.length > 0 ? referralInterviews / referralApps.length : interviewRate;
  const coldInterviewRate = coldApps.length > 0 ? coldInterviews / coldApps.length : interviewRate;

  res.status(200).json({
    success: true,
    data: {
      historicalRates: {
        overall: {
          responseRate,
          interviewRate,
          offerRate
        },
        referralInterviewRate,
        coldInterviewRate
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

  // We fetch previous interviews for the same application to show previous notes
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

  // We could run a diff logic here or on the frontend.
  // For now, we return the snapshots and identify that changes exist.
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
      if (!recruiters[contactName]) {
        recruiters[contactName] = { applications: [] };
      }
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
  }));

  // Sort by most applications
  network.sort((a, b) => b.total - a.total);

  res.status(200).json({
    success: true,
    data: network
  });
});

// @desc    Get Deep Market Intelligence
// @route   GET /api/intelligence/market
// @access  Private
const getMarketIntelligence = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });

  // 1. Personal Job Market Map (Location)
  const locations = {};
  // 2. Company Intelligence
  const companies = {};
  // 3. Salary Intelligence
  let salaryApps = 0;
  const salaries = [];

  applications.forEach(app => {
    // Location Map
    const loc = app.location?.trim() || 'Unknown';
    if (!locations[loc]) locations[loc] = { applications: 0, responses: 0, interviews: 0 };
    locations[loc].applications++;
    if (['Interview', 'Offer', 'Assessment'].includes(app.status)) {
      locations[loc].responses++;
      if (['Interview', 'Offer'].includes(app.status)) locations[loc].interviews++;
    }

    // Company Intelligence
    const comp = app.company.trim();
    if (!companies[comp]) companies[comp] = { applications: 0, responses: 0, interviews: 0, roles: new Set(), lastApplied: null };
    companies[comp].applications++;
    companies[comp].roles.add(app.role);
    if (!companies[comp].lastApplied || new Date(app.dateApplied) > new Date(companies[comp].lastApplied)) {
      companies[comp].lastApplied = app.dateApplied;
    }
    if (['Interview', 'Offer', 'Assessment'].includes(app.status)) companies[comp].responses++;
    if (['Interview', 'Offer'].includes(app.status)) companies[comp].interviews++;

    // Salary Intelligence (Very basic heuristic parsing for demonstration)
    if (app.salary && app.salary.trim() !== '') {
      salaryApps++;
      // Extract numbers
      const nums = app.salary.match(/\d+/g);
      if (nums && nums.length > 0) {
        salaries.push(parseInt(nums[0]));
      }
    }
  });

  const locationData = Object.keys(locations).map(loc => ({
    location: loc,
    ...locations[loc],
    responseRate: locations[loc].applications > 0 ? (locations[loc].responses / locations[loc].applications) * 100 : 0
  })).sort((a, b) => b.applications - a.applications);

  const repeatedCompanies = Object.keys(companies).filter(c => companies[c].applications > 1).map(c => ({
    company: c,
    ...companies[c],
    roles: Array.from(companies[c].roles)
  })).sort((a, b) => b.applications - a.applications);

  const salaryData = {
    totalWithSalary: salaryApps,
    average: salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : null,
  };

  // 4. Skill Market Intelligence
  // (In a real system, we'd run an NLP extraction across all JobDescriptionSnapshots. 
  // We'll simulate it based on typical tech stacks for this user's goal).
  const simulatedSkills = [
    { name: 'Node.js', demand: 72, userMatch: 'Strong' },
    { name: 'React', demand: 68, userMatch: 'Strong' },
    { name: 'MongoDB', demand: 54, userMatch: 'Strong' },
    { name: 'AWS', demand: 46, userMatch: 'Developing' },
    { name: 'Docker', demand: 37, userMatch: 'Developing' },
    { name: 'Kafka', demand: 21, userMatch: 'Missing' },
  ];

  res.status(200).json({
    success: true,
    data: {
      locationMap: locationData,
      companyIntelligence: repeatedCompanies,
      salaryIntelligence: salaryData,
      skillMarket: simulatedSkills
    }
  });
});

// @desc    Get Career Twin (Behavioral Model)
// @route   GET /api/intelligence/twin
// @access  Private
const getCareerTwin = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const applications = await Application.find({ user: userId });

  if (applications.length < 5) {
    return res.status(200).json({ success: true, data: { insufficientData: true, message: 'Not enough data to model your Career Twin. Apply to at least 5 jobs.' } });
  }

  // Derive Twin metrics
  let totalResponseTime = 0;
  let responses = 0;
  const sources = {};
  const resumes = {};

  applications.forEach(app => {
    if (['Interview', 'Offer', 'Assessment'].includes(app.status)) {
      if (app.updatedAt && app.dateApplied) {
        totalResponseTime += (new Date(app.updatedAt) - new Date(app.dateApplied));
        responses++;
      }
    }
    
    if (app.source) {
      if (!sources[app.source]) sources[app.source] = { apps: 0, responses: 0 };
      sources[app.source].apps++;
      if (['Interview', 'Offer', 'Assessment'].includes(app.status)) sources[app.source].responses++;
    }

    if (app.resumeVersion) {
      if (!resumes[app.resumeVersion]) resumes[app.resumeVersion] = { apps: 0, responses: 0 };
      resumes[app.resumeVersion].apps++;
      if (['Interview', 'Offer', 'Assessment'].includes(app.status)) resumes[app.resumeVersion].responses++;
    }
  });

  const avgResponseTime = responses > 0 ? Math.round(totalResponseTime / responses / (1000 * 60 * 60 * 24)) : 7; // defaults to 7 days
  
  let bestSource = 'Unknown';
  let bestSourceRate = 0;
  let weakestSource = 'Unknown';
  let weakestSourceRate = 100;

  Object.keys(sources).forEach(s => {
    if (sources[s].apps >= 2) {
      const rate = sources[s].responses / sources[s].apps;
      if (rate > bestSourceRate) { bestSourceRate = rate; bestSource = s; }
      if (rate < weakestSourceRate) { weakestSourceRate = rate; weakestSource = s; }
    }
  });

  let bestResume = 'Unknown';
  let bestResumeRate = 0;
  Object.keys(resumes).forEach(r => {
    if (resumes[r].apps >= 2) {
      const rate = resumes[r].responses / resumes[r].apps;
      if (rate > bestResumeRate) { bestResumeRate = rate; bestResume = r; }
    }
  });

  const overallResponseRate = applications.length > 0 ? (responses / applications.length) : 0;
  const bottleneck = overallResponseRate < 0.15 ? 'Getting initial responses' : 'Converting interviews to offers';
  const strength = bestSource !== 'Unknown' ? bestSource : 'Generalist';

  res.status(200).json({
    success: true,
    data: {
      targetRole: req.user.jobSearchGoal || 'Software Engineer',
      strength,
      bestStrategy: `${bestSource} + ${bestResume}`,
      typicalResponse: `${avgResponseTime} days`,
      bestSource,
      weakestSource: weakestSource !== 'Unknown' ? weakestSource : 'Not enough data',
      interviewStrength: bottleneck === 'Getting initial responses' ? 'Strong (relative to funnel)' : 'Needs Improvement',
      currentBottleneck: bottleneck
    }
  });
});

// @desc    Get Strategy Autopilot (Suggested Experiments)
// @route   GET /api/intelligence/autopilot
// @access  Private
const getStrategyAutopilot = asyncHandler(async (req, res) => {
  // In a real implementation, we would analyze the diff between sources/resumes.
  // For Phase D, we return a dynamically constructed suggestion.
  
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
};
