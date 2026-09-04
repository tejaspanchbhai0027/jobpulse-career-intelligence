const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash('Password123!', salt);
  
  const result = await db.collection('users').updateMany(
    {},
    { $set: { password: hash } }
  );
  
  console.log('Passwords reset successfully for users:', result.modifiedCount);
  mongoose.disconnect();
});
