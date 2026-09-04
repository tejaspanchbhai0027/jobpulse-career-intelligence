# JobPulse Career Intelligence 3.0

JobPulse doesn't just track your job search — it learns what works, analyzes your history, and acts as a Unified Career Decision Engine to tell you what to do next and *why*.

## Overview
The Career Intelligence module aggregates your application history and uses deterministic data models to generate actionable, explainable recommendations.

## Core Features
1. **Unified Decision Engine**: Consumes all intelligence services to generate `Recommendation` objects categorized by priority and confidence.
2. **Action Center 2.0**: A 4-quadrant UI (Urgent, Follow Up, Opportunity, Strategy) displaying the engine's prioritized recommendations.
3. **Explainability UI**: Every recommendation has a "Why?" evidence panel showing the exact deterministic reasons and data points used to generate the advice.
4. **Career Twin 2.0**: Calculates your behavioral model (Response times, Best Sources, Bottlenecks) to project your job search DNA.
5. **Opportunity Radar**: Grades every application from 0-100 based on JD fit, salary transparency, and contact strength.
6. **Funnel Diagnosis**: Identifies your biggest bottleneck (e.g., "Response → Interview") and recommends actionable improvements.
7. **Skill Market Radar**: Analyzes the real-time demand for skills based on your saved applications.
8. **Copilot Integration**: The JobPulse AI Copilot reads the Decision Engine's recommendations and context data to provide conversational career advice.

## Architecture

The system uses a modular **Intelligence Service Layer** pattern.

### `server/src/services/intelligence/`
- **`careerTwinService.js`**: Analyzes behavior to build a user's Career Twin.
- **`diagnosisService.js`**: Funnel analysis and bottleneck logic.
- **`opportunityService.js`**: Scores applications based on fit and trust.
- **`resumePerformanceService.js`**: A/B testing stats for resume versions.
- **`marketService.js`**: Extracts location, salary, and skill demand.
- **`recommendationEngine.js`**: Formats outputs and sets Confidence intervals.
- **`decisionEngine.js`**: The central nervous system. Consumes the above services and applies business rules to generate actionable `Recommendation` objects.

## Usage
The dashboard automatically fetches from the unified `/api/intelligence/overview` endpoint to populate the Action Center. The Copilot is automatically injected with these recommendations.
