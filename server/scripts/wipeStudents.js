require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const Interview = require('../src/models/Interview');
const Resume = require('../src/models/Resume');
const MentorFeedback = require('../src/models/MentorFeedback');

const wipeStudents = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Finding all students...');
    const students = await User.find({ role: 'STUDENT' });
    const studentIds = students.map(s => s._id);

    console.log(`Found ${studentIds.length} students to delete.`);

    if (studentIds.length > 0) {
      console.log('Deleting associated applications...');
      const appsResult = await Application.deleteMany({ user: { $in: studentIds } });
      console.log(`Deleted ${appsResult.deletedCount} applications.`);

      console.log('Deleting associated interviews...');
      const intResult = await Interview.deleteMany({ user: { $in: studentIds } });
      console.log(`Deleted ${intResult.deletedCount} interviews.`);

      console.log('Deleting associated resumes...');
      const resResult = await Resume.deleteMany({ user: { $in: studentIds } });
      console.log(`Deleted ${resResult.deletedCount} resumes.`);

      console.log('Deleting associated mentor feedback/notes...');
      const mfResult = await MentorFeedback.deleteMany({ studentId: { $in: studentIds } });
      console.log(`Deleted ${mfResult.deletedCount} mentor notes.`);

      console.log('Deleting student users...');
      const usersResult = await User.deleteMany({ _id: { $in: studentIds } });
      console.log(`Deleted ${usersResult.deletedCount} student users.`);
    }

    console.log('Student wipe completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error wiping students:', error);
    process.exit(1);
  }
};

wipeStudents();
