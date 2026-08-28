require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Application = require('./src/models/Application');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const testEmails = ['test@jobpulse.dev', 'testuser@jobpulse.dev', 'direct@test.com'];
    const testCompanies = [
      'Spotify', 'Airbnb', 'Netflix', 'Twitter', 'Uber', 'Shopify', 
      'Lyft', 'Snap', 'LinkedIn', 'Salesforce', 'GitHub', 'Figma', 'Stripe'
    ]; // Added Stripe since I saw it in the last run.

    // Find users
    const users = await User.find({
      email: { $in: testEmails }
    });

    console.log('--- Test Users ---');
    if (users.length === 0) console.log('None found.');
    users.forEach(u => console.log(`- ${u.name} (${u.email})`));

    // Find applications
    const apps = await Application.find({
      $or: [
        { company: { $in: testCompanies } },
        { user: { $in: users.map(u => u._id) } } // also grab apps belonging to test users
      ]
    }).populate('user', 'email');

    console.log('\n--- Test Applications ---');
    if (apps.length === 0) console.log('None found.');
    apps.forEach(a => {
      const userEmail = a.user ? a.user.email : 'Unknown User';
      console.log(`- ${a.company} (${a.role}) -> Belongs to: ${userEmail}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
