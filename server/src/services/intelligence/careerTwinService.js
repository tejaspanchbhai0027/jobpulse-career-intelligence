/**
 * Extracts and calculates the Career Twin behavioral model from user applications.
 */

const calculateTwin = (applications, userGoal = 'Software Engineer') => {
  const totalApps = applications.length;
  
  if (totalApps < 5) {
    return {
      insufficientData: true,
      message: 'Not enough data to model your Career Twin. Apply to at least 5 jobs.'
    };
  }

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

  const avgResponseTimeDays = responses > 0 ? Math.round(totalResponseTime / responses / (1000 * 60 * 60 * 24)) : 7;
  
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

  return {
    insufficientData: false,
    targetRole: userGoal,
    strength,
    bestStrategy: `${bestSource !== 'Unknown' ? bestSource : 'General'} + ${bestResume !== 'Unknown' ? bestResume : 'Standard Resume'}`,
    typicalResponse: `${avgResponseTimeDays} days`,
    bestSource,
    weakestSource: weakestSource !== 'Unknown' ? weakestSource : 'Not enough data',
    bestResume,
    overallResponseRate,
    interviewStrength: bottleneck === 'Getting initial responses' ? 'Strong (relative to funnel)' : 'Needs Improvement',
    currentBottleneck: bottleneck
  };
};

module.exports = {
  calculateTwin
};
