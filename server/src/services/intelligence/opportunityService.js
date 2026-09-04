/**
 * Calculates Opportunity Scores for applications.
 */

const calculateOpportunities = (applications) => {
  const scoredApplications = applications.map(app => {
    let score = 0;
    
    // 1. Resume Match / Job Fit (Up to 40 points)
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
      dateApplied: app.dateApplied,
      closingDate: app.closingDate,
      score,
      category,
      jobDescription: app.jobDescription,
      resumeVersion: app.resumeVersion,
      source: app.source
    };
  });

  // Sort highest score first
  return scoredApplications.sort((a, b) => b.score - a.score);
};

module.exports = {
  calculateOpportunities
};
