require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobpulse');
    console.log('Connected.');
    
    const res = await User.deleteMany({ role: 'STUDENT' });
    console.log(`Successfully deleted ${res.deletedCount} student accounts.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
