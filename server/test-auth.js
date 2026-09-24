require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: 'archanajade@gmail.com' }).select('+password');
  
  const passwordsToTest = [
    'password123',
    'archanajade@gmail.com', // maybe they pasted the email as the password?
    'archanajade',
    'password',
    '12345678',
    '12345678901'
  ];

  for (const p of passwordsToTest) {
    const isMatch = await user.comparePassword(p);
    console.log(`Testing '${p}': ${isMatch}`);
  }
  process.exit(0);
}).catch(console.error);
