# JobPulse Career Lab (Experiments)

The Career Lab allows you to run rigorous A/B tests on your job search strategy.

## Why run experiments?
A job search is a numbers game, but it's also a strategy game. If your response rate is low, you should test new approaches rather than blindly sending out more applications.

## How it works
1. **Define a Hypothesis**: e.g., "A resume tailored for Startups will get a higher response rate than my standard resume."
2. **Assign Groups**: 
   - Group A (Control): Standard Resume (e.g., 20 applications)
   - Group B (Variant): Startup Resume (e.g., 20 applications)
3. **Track Results**: JobPulse tracks the application events for both cohorts and definitively tells you which strategy yielded higher interview conversions.

## Technical Details
- Model: `CareerExperiment` (Mongoose)
- Stores arrays of Application ObjectIds for Group A and Group B.
- Automatically calculates differential conversion rates on the frontend via the `/api/experiments` endpoint.
