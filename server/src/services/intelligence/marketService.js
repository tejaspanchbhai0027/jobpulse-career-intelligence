/**
 * Extracts Market Intelligence from user applications.
 */

const calculateMarketIntelligence = (applications) => {
  const locations = {};
  const companies = {};
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

    // Salary Intelligence
    if (app.salary && app.salary.trim() !== '') {
      salaryApps++;
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

  // Simulated Skills for Phase 1 (Replace with real JD extraction later)
  const simulatedSkills = [
    { name: 'Node.js', demand: 72, userMatch: 'Strong' },
    { name: 'React', demand: 68, userMatch: 'Strong' },
    { name: 'MongoDB', demand: 54, userMatch: 'Strong' },
    { name: 'AWS', demand: 46, userMatch: 'Developing' },
    { name: 'Docker', demand: 37, userMatch: 'Developing' },
    { name: 'Kafka', demand: 21, userMatch: 'Missing' },
  ];

  return {
    locationMap: locationData,
    companyIntelligence: repeatedCompanies,
    salaryIntelligence: salaryData,
    skillMarket: simulatedSkills
  };
};

module.exports = {
  calculateMarketIntelligence
};
