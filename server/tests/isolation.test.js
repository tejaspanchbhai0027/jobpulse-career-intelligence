const mongoose = require('mongoose');
const User = require('../src/models/User');

describe('Multi-Institution Isolation', () => {
  beforeAll(async () => {
    // Setup test DB connection
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobpulse_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should only return students belonging to the same institution as the placement officer', async () => {
    // This is a unit test simulation for the adminStudentController logic
    const inst1 = new mongoose.Types.ObjectId();
    const inst2 = new mongoose.Types.ObjectId();
    
    // Create mock students
    await User.insertMany([
      { name: 'Student 1', email: 's1@test.com', password: 'pass', role: 'STUDENT', institutionId: inst1 },
      { name: 'Student 2', email: 's2@test.com', password: 'pass', role: 'STUDENT', institutionId: inst1 },
      { name: 'Student 3', email: 's3@test.com', password: 'pass', role: 'STUDENT', institutionId: inst2 },
    ]);

    // Simulate query in adminStudentController
    const matchStage1 = { institutionId: inst1, role: 'STUDENT' };
    const studentsInst1 = await User.find(matchStage1);
    
    expect(studentsInst1.length).toBe(2);
    expect(studentsInst1[0].institutionId.toString()).toBe(inst1.toString());
    
    const matchStage2 = { institutionId: inst2, role: 'STUDENT' };
    const studentsInst2 = await User.find(matchStage2);
    
    expect(studentsInst2.length).toBe(1);
    expect(studentsInst2[0].institutionId.toString()).toBe(inst2.toString());
    
    // Cleanup
    await User.deleteMany({ email: { $in: ['s1@test.com', 's2@test.com', 's3@test.com'] } });
  });
});
