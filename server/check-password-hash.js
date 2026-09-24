require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ email: 'archanajade@gmail.com' }).select('+password');
  console.log('User password hash:', user.password);
  process.exit(0);
}).catch(console.error);
