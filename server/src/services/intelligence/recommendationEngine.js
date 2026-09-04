/**
 * Formats and standardizes Recommendations for the Decision Engine.
 */

const CONFIDENCE = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  INSUFFICIENT: 'Insufficient Data'
};

const PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

const calculateConfidence = (sampleSize) => {
  if (sampleSize < 3) return CONFIDENCE.INSUFFICIENT;
  if (sampleSize < 10) return CONFIDENCE.LOW;
  if (sampleSize < 25) return CONFIDENCE.MEDIUM;
  return CONFIDENCE.HIGH;
};

const createRecommendation = ({
  type,
  title,
  summary,
  reason,
  evidence,
  action,
  priority,
  confidence,
  relatedApplicationId = null,
  relatedInterviewId = null,
  relatedExperimentId = null
}) => {
  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    summary,
    reason,
    evidence,
    action,
    priority,
    confidence,
    relatedApplicationId,
    relatedInterviewId,
    relatedExperimentId,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  CONFIDENCE,
  PRIORITY,
  calculateConfidence,
  createRecommendation
};
