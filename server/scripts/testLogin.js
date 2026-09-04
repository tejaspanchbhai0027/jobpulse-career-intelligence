require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const admin = await User.findOne({ email: 'admin@jobpulse.com' }).select('+password');
  if (admin) {
    console.log('Admin found. Hashed password:', admin.password);
    const isMatch = await bcrypt.compare('password123', admin.password);
    console.log('Admin match password123?', isMatch);
  } else {
    console.log('Admin not found');
  }

  const superAdmin = await User.findOne({ email: 'superadmin@jobpulse.com' }).select('+password');
  if (superAdmin) {
    console.log('SuperAdmin found. Hashed password:', superAdmin.password);
    const isMatch = await bcrypt.compare('password123', superAdmin.password);
    console.log('SuperAdmin match password123?', isMatch);
  } else {
    console.log('SuperAdmin not found');
  }

  process.exit(0);
};

testLogin();
