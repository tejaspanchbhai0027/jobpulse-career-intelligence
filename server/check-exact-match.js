require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: 'archanajade@gmail.com' }).select('+password');
  console.log('User found by exact match:', user ? 'Yes' : 'No');
  
  if (user) {
    const isMatch = await user.comparePassword('testpassword123'); // Or whatever
    console.log('Password hash length:', user.password.length);
  }
  process.exit(0);
}).catch(console.error);
