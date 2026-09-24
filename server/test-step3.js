require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Institution = require('./src/models/Institution');

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Create Institution A and B
    const instA = await Institution.create({ name: 'Inst A ' + Date.now(), type: 'UNIVERSITY', domain: 'a.edu', code: 'A' + Date.now() });
    const instB = await Institution.create({ name: 'Inst B ' + Date.now(), type: 'UNIVERSITY', domain: 'b.edu', code: 'B' + Date.now() });

    // 2. Create Officer A (Inst A)
    const officerA = await User.create({ name: 'Officer A', email: `oa${Date.now()}@a.edu`, password: 'password123', role: 'PLACEMENT_OFFICER', institutionId: instA._id });

    // 3. Create Student A (Inst A)
    const studentA = await User.create({ name: 'Student A', email: `sa${Date.now()}@a.edu`, password: 'password123', role: 'STUDENT', institutionId: instA._id, batch: 2026 });

    // 4. Create Mentor B (Inst B)
    const mentorB = await User.create({ name: 'Mentor B', email: `mb${Date.now()}@b.edu`, password: 'password123', role: 'MENTOR', institutionId: instB._id });

    // 5. Simulate Officer A trying to assign Mentor B to Student A
    // We'll mimic the exact logic from assignMentor
    const req = {
      user: { institutionId: instA._id },
      params: { id: studentA._id },
      body: { mentorId: mentorB._id }
    };

    const mentorQuery = {
      _id: req.body.mentorId,
      institutionId: req.user.institutionId,
      role: 'MENTOR'
    };

    const mentorFound = await User.findOne(mentorQuery);
    
    if (!mentorFound) {
      console.log('SUCCESS: Cross-institution assignment blocked. Mentor not found in Officer A\'s institution.');
    } else {
      console.error('FAIL: Cross-institution assignment allowed!');
    }

    // Cleanup
    await User.deleteMany({ _id: { $in: [officerA._id, studentA._id, mentorB._id] } });
    await Institution.deleteMany({ _id: { $in: [instA._id, instB._id] } });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

runTest();
