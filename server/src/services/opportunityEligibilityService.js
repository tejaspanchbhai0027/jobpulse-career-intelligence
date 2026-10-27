/**
 * Eligibility Service to check if a student meets requirements for an opportunity
 */
exports.checkEligibility = (student, opportunity) => {
  const reasons = [];
  let isEligible = true;

  // 1. Department Check
  if (opportunity.eligibleDepartments && opportunity.eligibleDepartments.length > 0) {
    if (!student.department || !opportunity.eligibleDepartments.includes(student.department)) {
      isEligible = false;
      reasons.push(`Your department (${student.department || 'Not specified'}) is not eligible.`);
    }
  }

  // 2. Batch Check
  if (opportunity.eligibleBatches && opportunity.eligibleBatches.length > 0) {
    if (!student.batch || !opportunity.eligibleBatches.includes(student.batch)) {
      isEligible = false;
      reasons.push(`Your batch (${student.batch || 'Not specified'}) is not eligible.`);
    }
  }
  
  // 3. Status check (for PlacementDrives)
  if (opportunity.status && !['PUBLISHED', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'Open'].includes(opportunity.status)) {
    isEligible = false;
    reasons.push(`This opportunity is currently ${opportunity.status || 'closed'}.`);
  }

  return { isEligible, reasons };
};
