/**
 * The core Decision Engine for JobPulse Career Intelligence.
 * Consumes raw data and delegates to sub-services to generate actionable recommendations.
 */

const { calculateTwin } = require('./careerTwinService');
const { calculateDiagnosis } = require('./diagnosisService');
const { calculateOpportunities } = require('./opportunityService');
const { calculateResumePerformance } = require('./resumePerformanceService');
const { createRecommendation, CONFIDENCE, PRIORITY, calculateConfidence } = require('./recommendationEngine');

const getRecommendations = (applications, interviews) => {
  const recommendations = [];

  const now = new Date();
  
  // Basic structures
  const opportunities = calculateOpportunities(applications);
  const resumePerf = calculateResumePerformance(applications);
  const diagnosis = calculateDiagnosis(applications);
  
  // 1. FOLLOW_UP Rules
  applications.forEach(app => {
    if (app.needsFollowUp && app.status !== 'Rejected') {
      const daysSince = Math.floor((now - new Date(app.dateApplied)) / (1000 * 60 * 60 * 24));
      recommendations.push(createRecommendation({
        type: 'FOLLOW_UP',
        title: `Follow up with ${app.company}`,
        summary: `It has been ${daysSince} days since you applied.`,
        reason: 'Following up increases visibility and shows continued interest.',
        evidence: [
          `${daysSince} days elapsed`,
          `Current Status: ${app.status}`,
          app.contact ? 'Recruiter contact available' : 'No direct contact recorded'
        ],
        action: 'Send Follow-up',
        priority: daysSince > 14 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
        confidence: CONFIDENCE.HIGH,
        relatedApplicationId: app._id
      }));
    }
  });

  // 2. INTERVIEW_PREPARATION Rules
  interviews.forEach(interview => {
    const scheduled = new Date(interview.scheduledAt);
    if (scheduled >= now && scheduled <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)) {
      const company = interview.application?.company || 'Company';
      recommendations.push(createRecommendation({
        type: 'INTERVIEW_PREPARATION',
        title: `Prepare for ${company} Interview`,
        summary: `You have a ${interview.interviewType} interview coming up.`,
        reason: 'Upcoming interview within 3 days.',
        evidence: [
          `Date: ${scheduled.toLocaleDateString()}`,
          `Round: ${interview.round}`
        ],
        action: 'Prepare Now',
        priority: PRIORITY.HIGH,
        confidence: CONFIDENCE.HIGH,
        relatedInterviewId: interview._id,
        relatedApplicationId: interview.application?._id
      }));
    }
  });

  // 3. APPLICATION_PRIORITY Rules
  const topOpportunities = opportunities.filter(o => o.score >= 80 && o.status === 'Wishlist');
  topOpportunities.forEach(opp => {
    recommendations.push(createRecommendation({
      type: 'APPLICATION_PRIORITY',
      title: `Prioritize ${opp.company}`,
      summary: `This is a high-priority opportunity with a score of ${opp.score}.`,
      reason: 'Matches your preferences strongly and has high trust signals.',
      evidence: [
        `Opportunity Score: ${opp.score}/100`,
        opp.jobDescription ? 'Job description analyzed' : 'No JD provided',
        opp.source ? `Source: ${opp.source}` : 'Cold application'
      ],
      action: 'Apply Now',
      priority: PRIORITY.HIGH,
      confidence: CONFIDENCE.HIGH,
      relatedApplicationId: opp.id
    }));
  });

  // 4. RESUME_SELECTION Rules
  if (resumePerf.topPerformer) {
    const confidenceLevel = calculateConfidence(resumePerf.topPerformer.applications);
    if (confidenceLevel !== CONFIDENCE.INSUFFICIENT) {
      recommendations.push(createRecommendation({
        type: 'RESUME_SELECTION',
        title: `Use ${resumePerf.topPerformer.version}`,
        summary: 'This resume version has the highest historical interview conversion.',
        reason: 'Data indicates this resume performs best.',
        evidence: [
          `${resumePerf.topPerformer.applications} applications`,
          `${resumePerf.topPerformer.responses} responses`,
          `${resumePerf.topPerformer.interviews} interviews`,
          `Interview Rate: ${Math.round(resumePerf.topPerformer.interviewRate * 100)}%`
        ],
        action: 'Select Resume',
        priority: PRIORITY.MEDIUM,
        confidence: confidenceLevel
      }));
    }
  }

  // 5. SKILL_DEVELOPMENT Rules (Basic implementation)
  if (!diagnosis.insufficientData && diagnosis.bottleneck === 'Response → Interview') {
    recommendations.push(createRecommendation({
      type: 'SKILL_DEVELOPMENT',
      title: 'Focus on Interview Preparation',
      summary: 'Your response rate is good, but interview conversion is low.',
      reason: diagnosis.explanation,
      evidence: [
        `Response Rate: ${Math.round(diagnosis.responseRate * 100)}%`,
        `Interview Conversion: ${Math.round(diagnosis.interviewConversion * 100)}%`
      ],
      action: 'Review Interview Notes',
      priority: PRIORITY.MEDIUM,
      confidence: CONFIDENCE.MEDIUM
    }));
  }

  // Deduplicate and sort by priority
  const sorted = recommendations.sort((a, b) => {
    const pScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return pScore[b.priority] - pScore[a.priority];
  });

  return sorted;
};

module.exports = {
  getRecommendations
};
