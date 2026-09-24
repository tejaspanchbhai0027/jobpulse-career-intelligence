require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({ email: /archanajade/i });
  console.log('Users found:', users.map(u => ({ id: u._id, email: u.email, role: u.role, isActive: u.isActive })));
  process.exit(0);
}).catch(console.error);
