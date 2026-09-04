/**
 * Calculates resume performance stats.
 */

const calculateResumePerformance = (applications) => {
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

  formattedStats.sort((a, b) => b.interviewRate - a.interviewRate);

  let topPerformer = null;
  const validStats = formattedStats.filter(s => s.version !== 'Unknown' && s.applications >= 3);
  if (validStats.length > 0) {
    topPerformer = validStats[0];
  }

  return {
    stats: formattedStats,
    topPerformer,
    message: topPerformer ? `Highest recorded interview conversion: ${topPerformer.version}` : "Insufficient data to declare a top performer."
  };
};

module.exports = {
  calculateResumePerformance
};
