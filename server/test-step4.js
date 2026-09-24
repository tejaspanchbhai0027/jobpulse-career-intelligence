require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Institution = require('./src/models/Institution');
const Application = require('./src/models/Application');
const Interview = require('./src/models/Interview');

const { getApplications, getInterviews } = require('./src/controllers/officerController');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Setup
    const inst = await Institution.create({ name: 'Inst 4 ' + Date.now(), type: 'UNIVERSITY', domain: '4.edu', code: '4' + Date.now() });
    const officer = await User.create({ name: 'Officer', email: `o${Date.now()}@4.edu`, password: 'password123', role: 'PLACEMENT_OFFICER', institutionId: inst._id });
    const student = await User.create({ name: 'Student', email: `s${Date.now()}@4.edu`, password: 'password123', role: 'STUDENT', institutionId: inst._id, batch: 2026 });
    
    const app = await Application.create({ user: student._id, company: 'Google', role: 'SWE', status: 'Interview' });
    const interview = await Interview.create({ user: student._id, application: app._id, round: 1, scheduledAt: new Date(), interviewType: 'Technical' });

    // Mock Express Res
    const resApplications = {
      status: (code) => resApplications,
      json: (data) => {
        if (data.data.length === 1 && data.data[0].company === 'Google') {
          console.log('SUCCESS: getApplications aggregation works and maps company.');
        } else {
          console.error('FAIL: getApplications data is incorrect', data);
        }
      }
    };

    const resInterviews = {
      status: (code) => resInterviews,
      json: (data) => {
        if (data.data.length === 1 && data.data[0].application.company === 'Google' && data.data[0].round === 1) {
          console.log('SUCCESS: getInterviews aggregation works and maps nested application.');
        } else {
          console.error('FAIL: getInterviews data is incorrect', JSON.stringify(data, null, 2));
        }
      }
    };

    // Test Applications
    await getApplications(
      { user: { institutionId: inst._id }, query: {} },
      resApplications,
      (err) => console.error(err)
    );

    // Test Interviews
    await getInterviews(
      { user: { institutionId: inst._id }, query: {} },
      resInterviews,
      (err) => console.error(err)
    );

    // Cleanup
    await Interview.deleteMany({ _id: interview._id });
    await Application.deleteMany({ _id: app._id });
    await User.deleteMany({ _id: { $in: [officer._id, student._id] } });
    await Institution.deleteMany({ _id: inst._id });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTest();
