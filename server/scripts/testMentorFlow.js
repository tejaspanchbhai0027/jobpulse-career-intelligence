require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const { getDashboardMetrics, getInterventions, getAnalytics } = require('../src/controllers/mentorController');

const testFlow = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Create Institution
    const inst = await Institution.create({
      name: 'Demo University',
      code: 'DEMO' + Date.now(),
      domain: 'demo.edu'
    });
    console.log('Institution Created:', inst.name);

    // 2. Create Institution Admin
    const admin = await User.create({
      name: 'Demo Admin',
      email: `admin.${Date.now()}@demo.edu`,
      password: 'password123',
      role: 'INSTITUTION_ADMIN',
      institutionId: inst._id
    });
    console.log('Admin Created:', admin.email);

    // 3. Create PO
    const po = await User.create({
      name: 'Demo PO',
      email: `po.${Date.now()}@demo.edu`,
      password: 'password123',
      role: 'PLACEMENT_OFFICER',
      institutionId: inst._id
    });
    console.log('PO Created:', po.email);

    // 4. Create Mentor
    const mentor = await User.create({
      name: 'Demo Mentor',
      email: `mentor.${Date.now()}@demo.edu`,
      password: 'password123',
      role: 'MENTOR',
      institutionId: inst._id,
      placementOfficerId: po._id
    });
    console.log('Mentor Created:', mentor.email);

    // 5. Create Student assigned to Mentor
    const student = await User.create({
      name: 'Demo Student',
      email: `student.${Date.now()}@demo.edu`,
      password: 'password123',
      role: 'STUDENT',
      institutionId: inst._id,
      placementOfficerId: po._id,
      mentorId: mentor._id
    });
    console.log('Student Created:', student.email);

    console.log('\n--- VERIFYING QUERIES ---');
    // Check if student is found by User query
    const studentCount = await User.countDocuments({ institutionId: inst._id, mentorId: mentor._id, role: 'STUDENT' });
    console.log(`User.countDocuments({ mentorId: ${mentor._id} }) ->`, studentCount);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testFlow();
