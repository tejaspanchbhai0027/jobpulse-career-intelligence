const mongoose = require('mongoose');
const dotenv = require('dotenv');

const path = require('path');
// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Application = require('../src/models/Application');
const Interview = require('../src/models/Interview');
const Task = require('../src/models/Task');
const Resume = require('../src/models/Resume');
const PlacementDrive = require('../src/models/PlacementDrive');
const MentorFeedback = require('../src/models/MentorFeedback');
const CareerExperiment = require('../src/models/CareerExperiment');
const InterventionSignal = require('../src/models/InterventionSignal');
const SystemSettings = require('../src/models/SystemSettings');

const wipeAllData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Deleting all collections EXCEPT SUPER_ADMIN...');
    
    // Find super admin
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    
    if (superAdmin) {
      await User.deleteMany({ _id: { $ne: superAdmin._id } });
    } else {
      await User.deleteMany({});
    }

    await Institution.deleteMany({});
    await Application.deleteMany({});
    await Interview.deleteMany({});
    await Task.deleteMany({});
    await Resume.deleteMany({});
    await PlacementDrive.deleteMany({});
    await MentorFeedback.deleteMany({});
    await CareerExperiment.deleteMany({});
    await InterventionSignal.deleteMany({});
    await SystemSettings.deleteMany({});

    console.log('Successfully wiped all temporary data and non-SuperAdmin users.');
    
    if (superAdmin) {
      console.log('\n--- Login Credentials ---');
      console.log(`Email: ${superAdmin.email}`);
      console.log(`Password: password123 (assuming default)`);
      console.log('-------------------------\n');
    } else {
      console.log('\nWarning: No SUPER_ADMIN found! You should run seedSuperAdmin.js\n');
    }

    process.exit();
  } catch (error) {
    console.error('Error wiping data:', error);
    process.exit(1);
  }
};

wipeAllData();
