export const calculateApplicationScore = (app) => {
  let score = 50; // Base score
  const breakdown = [];

  // 1. Resume Match (Up to 25 points)
  if (app.aiResumeMatch && app.aiResumeMatch.score) {
    const aiScore = app.aiResumeMatch.score; // usually out of 100
    const bonus = Math.round((aiScore / 100) * 25);
    score += bonus;
    if (aiScore >= 80) breakdown.push({ label: 'Strong Resume Match', type: 'positive' });
    else if (aiScore < 50) breakdown.push({ label: 'Weak Resume Match', type: 'negative' });
    else breakdown.push({ label: 'Fair Resume Match', type: 'neutral' });
  } else {
    breakdown.push({ label: 'No Resume Match Data', type: 'neutral' });
  }

  // 2. Referral
  if (app.source && app.source.toLowerCase() === 'referral') {
    score += 15;
    breakdown.push({ label: 'Referral', type: 'positive' });
  }

  // 3. Contact Info
  if (app.contact && app.contact.trim() !== '') {
    score += 10;
    breakdown.push({ label: 'Contact Identified', type: 'positive' });
  } else {
    breakdown.push({ label: 'Missing Contact', type: 'warning' });
  }

  // 4. Follow-up Status
  if (app.needsFollowUp) {
    score -= 10;
    breakdown.push({ label: 'Follow-up Overdue', type: 'negative' });
  } else if (app.status !== 'Offer' && app.status !== 'Rejected' && app.status !== 'Withdrawn') {
    breakdown.push({ label: 'Follow-up Current', type: 'positive' });
  }

  // Cap Score
  score = Math.max(0, Math.min(100, score));

  let status = 'Fair';
  let color = '#f59e0b'; // yellow
  if (score >= 80) { status = 'Strong'; color = '#10b981'; } // green
  else if (score < 50) { status = 'Weak'; color = '#ef4444'; } // red

  return { score, status, color, breakdown };
};

export const calculateTrustSignals = (app) => {
  const signals = [];
  let trustIssues = 0;
  let trustPositives = 0;

  // 1. Salary Transparency
  if (app.salary && app.salary.trim() !== '') {
    signals.push({ label: 'Salary Available', type: 'positive', value: app.salary });
    trustPositives++;
  } else {
    signals.push({ label: 'Salary Missing', type: 'warning' });
    trustIssues++;
  }

  // 2. Recruiter Identified
  if (app.contact && app.contact.trim() !== '') {
    signals.push({ label: 'Recruiter Identified', type: 'positive' });
    trustPositives++;
  } else {
    signals.push({ label: 'No Contact Listed', type: 'warning' });
    trustIssues++;
  }

  // 3. Application Age / Stagnation
  const applied = new Date(app.dateApplied);
  const now = new Date();
  const daysOld = Math.floor((now - applied) / (1000 * 60 * 60 * 24));
  
  if (daysOld > 30 && app.status === 'Applied') {
    signals.push({ label: `Stale Posting (${daysOld} days)`, type: 'negative' });
    trustIssues += 2;
  } else {
    signals.push({ label: `Fresh (${daysOld} days ago)`, type: 'positive' });
    trustPositives++;
  }

  // 4. Job Description & AI Flags
  if (app.jobDescription && app.jobDescription.trim().length > 50) {
    signals.push({ label: 'Detailed Description', type: 'positive' });
    trustPositives++;
    
    // Check AI Red Flags if any
    if (app.aiJDAnalysis && app.aiJDAnalysis.redFlags && app.aiJDAnalysis.redFlags.length > 0) {
      signals.push({ label: `${app.aiJDAnalysis.redFlags.length} AI Red Flags`, type: 'negative' });
      trustIssues += 2;
    }
  } else {
    signals.push({ label: 'Poor Description', type: 'warning' });
    trustIssues++;
  }

  // Verdict
  let verdict = 'Looks Good';
  let color = '#10b981'; // green
  if (trustIssues >= 3) {
    verdict = 'Proceed with Caution';
    color = '#ef4444'; // red
  } else if (trustIssues >= 1) {
    verdict = 'Review Carefully';
    color = '#f59e0b'; // yellow
  }

  return { verdict, color, signals };
};
