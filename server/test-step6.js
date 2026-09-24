const mongoose = require('mongoose');
require('dotenv').config();

const officerController = require('./src/controllers/officerController');
const User = require('./src/models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const officer = await User.findOne({ role: 'PLACEMENT_OFFICER' });
    if (!officer) {
      console.log('No officer found');
      process.exit(0);
    }

    const req = { user: officer };
    const res = {
      status: (code) => {
        console.log('Status:', code);
        return {
          json: (data) => {
            console.log('Data:', JSON.stringify(data, null, 2));
          }
        };
      }
    };
    const next = (err) => console.error('Next called with error:', err);

    await officerController.getAnalytics(req, res, next);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
