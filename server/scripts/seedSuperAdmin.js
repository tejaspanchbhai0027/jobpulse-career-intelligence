const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');

const seedSuperAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Check if Super Admin already exists
    const existing = await User.findOne({ role: 'SUPER_ADMIN' });
    if (existing) {
      console.log('Super Admin already exists. No action taken.');
      process.exit(0);
    }

    console.log('Creating Super Admin account...');
    const superAdmin = await User.create({
      name: 'JobPulse Founder',
      email: 'superadmin@jobpulse.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
      institutionId: null, // Super Admin is not tied to a single institution
    });

    console.log('Super Admin created successfully!');
    console.log(`Email: ${superAdmin.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
