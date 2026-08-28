require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./src/models/Application');
const { runFollowUpCheck } = require('./src/jobs/followUpJob');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find any application
    const app = await Application.findOne();
    if (!app) {
      console.log('No applications found to test with.');
      process.exit(0);
    }

    // Set to Applied and 8 days ago
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    app.status = 'Applied';
    app.updatedAt = eightDaysAgo;
    app.dateApplied = eightDaysAgo;
    app.followUpNotified = false;
    app.needsFollowUp = false;
    // We bypass mongoose timestamps for updatedAt so it doesn't get reset to now on save.
    await Application.collection.updateOne(
      { _id: app._id },
      { $set: { status: 'Applied', updatedAt: eightDaysAgo, dateApplied: eightDaysAgo, followUpNotified: false, needsFollowUp: false } }
    );
    console.log(`Updated Application ${app._id} (${app.company}) to 8 days ago.`);

    // To force the emailService to run even if RESEND_API_KEY is the placeholder,
    // we need to set the process.env.RESEND_API_KEY to a dummy string that passes the check in followUpJob.js
    // Actually, followUpJob checks: process.env.RESEND_API_KEY !== 're_xxxxxxxxxxxxxxxxxxxx'
    // Let's change it so it runs.
    if (process.env.RESEND_API_KEY === 're_xxxxxxxxxxxxxxxxxxxx') {
       process.env.RESEND_API_KEY = 're_testkey123456789';
    }

    console.log('Triggering runFollowUpCheck()...');
    const result = await runFollowUpCheck(app.user);
    console.log('Result:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
