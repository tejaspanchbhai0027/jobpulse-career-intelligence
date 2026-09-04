const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../src/models/User');

const countUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    console.log("USER COUNT BY ROLE:");
    users.forEach(u => console.log(`${u._id}: ${u.count}`));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

countUsers();
