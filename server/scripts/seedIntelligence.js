require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const Interview = require('../src/models/Interview');
const ApplicationEvent = require('../src/models/ApplicationEvent');
const CareerExperiment = require('../src/models/CareerExperiment');
const JobDescriptionSnapshot = require('../src/models/JobDescriptionSnapshot');

const SEED_USER_EMAIL = 'test@example.com'; // Change if testing with a different user

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    let user = await User.findOne({ email: SEED_USER_EMAIL });
    if (!user) {
      console.log(`❌ User ${SEED_USER_EMAIL} not found. Start the app and register this user first.`);
      process.exit(1);
    }
    const userId = user._id;

    console.log('🧹 Clearing old intelligence test data...');
    // Be careful! This only deletes mock data. We'll identify mock data by a special tag if we want to be safe, 
    // but for now we'll delete all apps for this test user to start fresh.
    await Application.deleteMany({ user: userId });
    await Interview.deleteMany({ user: userId });
    await ApplicationEvent.deleteMany({ userId });
    await CareerExperiment.deleteMany({ userId });
    await JobDescriptionSnapshot.deleteMany({ userId });

    console.log('🌱 Seeding new applications for DNA & Diagnosis...');
    const companies = ['Google', 'Meta', 'Amazon', 'Netflix', 'Apple', 'Stripe', 'Spotify', 'Notion', 'OpenAI', 'Anthropic'];
    const roles = ['Frontend Engineer', 'Backend Engineer', 'Full Stack Developer', 'Software Engineer II'];
    const sources = ['LinkedIn', 'Referral', 'Company Website', 'AngelList'];
    const resumes = ['v1-standard', 'v2-tailored', 'v3-startup'];
    
    const apps = [];

    // Generate 20 random applications to populate the DNA and Funnel
    for (let i = 0; i < 20; i++) {
      let status = 'Applied';
      // Distribution: 50% Applied, 30% Interview, 10% Offer, 10% Rejected
      const rand = Math.random();
      if (rand > 0.9) status = 'Offer';
      else if (rand > 0.8) status = 'Rejected';
      else if (rand > 0.5) status = 'Interview';

      const company = companies[Math.floor(Math.random() * companies.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const resume = resumes[Math.floor(Math.random() * resumes.length)];
      const jd = `We are looking for a ${roles[0]} at ${company}. You need 3+ years of experience with React and Node.js.`;

      const app = await Application.create({
        user: userId,
        company,
        role: roles[Math.floor(Math.random() * roles.length)],
        status,
        dateApplied: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random past 30 days
        salary: '$120k - $160k',
        source,
        contact: source === 'Referral' ? 'Jane Doe (Recruiter)' : '',
        resumeVersion: resume,
        jobDescription: jd,
        isPriority: Math.random() > 0.7,
      });

      apps.push(app);

      // Create initial event
      await ApplicationEvent.create({
        userId,
        applicationId: app._id,
        type: 'APPLICATION_CREATED',
        newValue: { status: app.status },
      });

      // Create JD Snapshot
      const hash = crypto.createHash('md5').update(jd).digest('hex');
      await JobDescriptionSnapshot.create({
        userId,
        applicationId: app._id,
        content: jd,
        contentHash: hash,
      });

      // If interview/offer, create an interview record
      if (status === 'Interview' || status === 'Offer') {
        await Interview.create({
          user: userId,
          application: app._id,
          interviewType: 'Technical',
          round: 1,
          scheduledAt: new Date(Date.now() + Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000), // Next 5 days
          interviewerName: 'Bob Smith',
        });
      }
    }

    console.log(`✅ Seeded ${apps.length} applications and related events.`);

    console.log('🌱 Seeding Career Experiments...');
    const exp = await CareerExperiment.create({
      userId,
      name: 'Startup vs Corporate Resume',
      hypothesis: 'The startup tailored resume will yield a higher response rate.',
      type: 'resume_version',
      groupA: { name: 'v1-standard', applications: apps.slice(0, 5).map(a => a._id) },
      groupB: { name: 'v3-startup', applications: apps.slice(5, 10).map(a => a._id) },
      targetSampleSize: 20
    });
    console.log(`✅ Created 1 Career Experiment`);

    console.log('🎉 Intelligence seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
