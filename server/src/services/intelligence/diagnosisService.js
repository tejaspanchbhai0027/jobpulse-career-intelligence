/**
 * Extracts and calculates the Funnel Analysis / Diagnosis from user applications.
 */

const calculateDiagnosis = (applications) => {
  const totalApps = applications.length;

  if (totalApps < 5) {
    return {
      insufficientData: true,
      message: "You need more application history to generate a diagnosis."
    };
  }

  // Basic Funnel Calculation
  const respondedApps = applications.filter(a => a.status !== 'Applied' && a.status !== 'Wishlist').length;
  const interviews = applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length;
  const offers = applications.filter(a => a.status === 'Offer').length;

  const responseRate = totalApps > 0 ? respondedApps / totalApps : 0;
  const interviewConversion = respondedApps > 0 ? interviews / respondedApps : 0;
  const offerConversion = interviews > 0 ? offers / interviews : 0;

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

  return {
    insufficientData: false,
    funnel: {
      applications: totalApps,
      responses: respondedApps,
      interviews: interviews,
      offers: offers
    },
    bottleneck,
    explanation,
    responseRate,
    interviewConversion,
    offerConversion
  };
};

module.exports = {
  calculateDiagnosis
};
