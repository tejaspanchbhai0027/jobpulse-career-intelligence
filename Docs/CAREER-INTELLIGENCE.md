# JobPulse Career Intelligence

JobPulse doesn't just track your job search — it learns what works and helps you optimize it.

## Overview
The Career Intelligence module aggregates your application history to provide actionable insights.

## Core Features
1. **Job Search DNA**: Calculates your true Response, Interview, and Offer rates. Identifies your best-performing resume versions and sources.
2. **Opportunity Radar**: Grades every unarchived application from 0-100 based on JD fit, salary transparency, and contact strength. High opportunity roles (score > 80) are automatically flagged in your daily brief.
3. **Funnel Diagnosis**: Identifies your biggest bottleneck (e.g., "Response → Interview") and recommends actionable improvements.
4. **Resume Performance**: Ranks all uploaded resume versions by their empirical interview conversion rate.
5. **Interview Prep Mode**: Automatically aggregates your job description, initial resume version used, and notes from previous interview rounds into a single "pre-flight" screen.
6. **Career Lab**: Run A/B tests on your application strategy.

## Architecture
The intelligence features are powered by robust event-sourcing:
- `ApplicationEvent`: Logs every status, priority, and ghosting change chronologically.
- `JobDescriptionSnapshot`: Takes a hash snapshot of JDs to track evolution.

## Setup
To test these features in development, run the seed script:
```bash
node server/scripts/seedIntelligence.js
```
