const mongoose = require('mongoose');
require('dotenv').config();

const InterventionSignal = require('./src/models/InterventionSignal');
const User = require('./src/models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find a student and a placement officer's institution
    const officer = await User.findOne({ role: 'PLACEMENT_OFFICER' });
    if (!officer) {
      console.log('No placement officer found.');
      process.exit(0);
    }
    const institutionId = officer.institutionId;

    const student = await User.findOne({ role: 'STUDENT', institutionId });
    if (!student) {
      console.log('No student found in institution.');
      process.exit(0);
    }

    const mentor = await User.findOne({ role: 'MENTOR', institutionId });
    
    // Clear old test signals
    await InterventionSignal.deleteMany({ institutionId, title: { $regex: /TEST/ } });

    console.log('Creating test intervention signals...');
    await InterventionSignal.create({
      student: student._id,
      institutionId,
      type: 'ACADEMIC_CONCERN',
      priority: 'HIGH',
      status: 'OPEN',
      mentorId: mentor ? mentor._id : null,
      title: 'TEST Academic Decline',
      reason: 'Student missed 3 lectures.',
      evidence: 'Attendance logs',
      suggestedSupport: 'Meet with academic advisor.',
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago (overdue)
    });

    await InterventionSignal.create({
      student: student._id,
      institutionId,
      type: 'BEHAVIORAL_CONCERN',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      mentorId: mentor ? mentor._id : null,
      title: 'TEST Unprofessional interview',
      reason: 'Arrived late to mock interview.',
      evidence: 'Mentor feedback',
      suggestedSupport: 'Review etiquette guidelines.',
      mentorNotes: 'Student apologized, issue resolved.',
      dueDate: new Date(),
      resolvedAt: new Date()
    });

    console.log('Signals created successfully.');

    // Now test the aggregate pipeline logic (similar to officerController)
    const matchStage = { institutionId };
    
    const pipeline = [
      { $match: matchStage },
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
      { $unwind: '$studentDoc' },
      { $lookup: { from: 'users', localField: 'mentorId', foreignField: '_id', as: 'mentorDoc' } },
      { $unwind: { path: '$mentorDoc', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          type: 1,
          status: 1,
          title: 1,
          dueDate: 1,
          student: {
            name: '$studentDoc.name',
            email: '$studentDoc.email'
          }
        }
      }
    ];

    const results = await InterventionSignal.aggregate(pipeline);
    console.log('Fetch Results Count:', results.length);
    console.log('First Result:', results[0]);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
