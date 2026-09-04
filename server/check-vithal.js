require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ email: 'vithalpatil@gmail.com' }).toArray();
  console.log(users);
  
  if (users.length > 0) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await db.collection('users').updateOne({ email: 'vithalpatil@gmail.com' }, { $set: { password: hash } });
    console.log('Password reset to admin123');
  } else {
    console.log('User not found');
  }
  process.exit(0);
});
