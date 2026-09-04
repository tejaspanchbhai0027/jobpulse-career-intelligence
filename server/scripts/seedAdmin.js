const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const adminEmail = 'admin@jobpulse.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin ${adminEmail} already exists! Deleting and recreating...`);
      await User.deleteOne({ email: adminEmail });
    }

    // Create or find Institution
    const instCode = 'DEMO_INST';
    let institution = await Institution.findOne({ code: instCode });
    if (!institution) {
      institution = await Institution.create({
        name: 'Demo University',
        code: instCode,
        location: 'San Francisco, CA',
        placementSeason: '2024-2025',
        graduationYear: 2025,
        departments: ['Computer Science', 'Electrical Engineering']
      });
      console.log(`Created Institution: ${institution.name}`);
    }

    const adminUser = await User.create({
      name: 'Institution Admin',
      email: adminEmail,
      password: 'password123', // Will be hashed by pre-save hook
      role: 'INSTITUTION_ADMIN',
      institutionId: institution._id,
    });

    console.log('Admin user created successfully:');
    console.log({
      email: adminUser.email,
      role: adminUser.role,
      institutionId: adminUser.institutionId
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
