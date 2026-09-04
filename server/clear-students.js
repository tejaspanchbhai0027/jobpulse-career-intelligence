const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function clearStudents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB. Removing all users with role STUDENT...');
    const result = await User.deleteMany({ role: 'STUDENT' });
    console.log(`Deleted ${result.deletedCount} students.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearStudents();
