const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Institution = require('../src/models/Institution');
const Application = require('../src/models/Application');
const Interview = require('../src/models/Interview');
const Resume = require('../src/models/Resume');
const JobDescriptionSnapshot = require('../src/models/JobDescriptionSnapshot');

const seedAnalytics = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const instCode = 'DEMO_INST';
    const institution = await Institution.findOne({ code: instCode });

    if (!institution) {
      console.error('Demo Institution not found! Run seedAdmin.js first.');
      process.exit(1);
    }

    // Clean up existing demo students (not admins)
    const demoStudents = await User.find({ institutionId: institution._id, role: 'STUDENT' });
    const demoStudentIds = demoStudents.map(s => s._id);

    await Application.deleteMany({ user: { $in: demoStudentIds } });
    await Interview.deleteMany({ user: { $in: demoStudentIds } });
    await Resume.deleteMany({ user: { $in: demoStudentIds } });
    await JobDescriptionSnapshot.deleteMany({ userId: { $in: demoStudentIds } });
    await User.deleteMany({ _id: { $in: demoStudentIds } });

    console.log('Cleaned up existing demo students and their data.');

    // ── 1. Create 20 mock students ──────────────────────────────────────────
    const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'];
    const batches = [2024, 2025];
    
    const students = [];
    for (let i = 1; i <= 20; i++) {
      const student = await User.create({
        name: `Student ${i}`,
        email: `student${i}@demo.edu`,
        password: 'password123',
        role: 'STUDENT',
        institutionId: institution._id,
        department: departments[i % departments.length],
        batch: batches[i % batches.length],
        studentId: `CS2025-${String(i).padStart(3, '0')}`,
        jobSearchGoal: 'Software Engineer',
      });
      students.push(student);
    }

    console.log(`Created 20 mock students.`);

    // ── 1.5 Create Mock Resumes ──────────────────────────────────────────
    const commonSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'System Design', 'SQL', 'Git'];
    const staleDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    for (const student of students) {
      await Resume.create({
        user: student._id,
        name: `${student.name.replace(' ', '_')}_Resume_v1.pdf`,
        version: 'v1.0',
        fileName: 'dummy.pdf',
        fileType: 'application/pdf',
        fileSize: 102400,
        storageKey: 'mock-key',
        targetRole: student.jobSearchGoal,
        isDefault: true,
        skills: commonSkills.sort(() => 0.5 - Math.random()).slice(0, 5),
        createdAt: staleDate,
        updatedAt: staleDate
      });
    }

    // ── 2. Create Applications and Interviews ──────────────────────────────
    let totalApps = 0;
    let totalInterviews = 0;
    const sources = ['LinkedIn', 'Company Website', 'Referral', 'Other'];
    
    // Group 1: High activity, multiple interviews, 1 offer (5 students)
    for (let i = 0; i < 5; i++) {
      const student = students[i];
      for (let j = 0; j < 8; j++) {
        let status = 'Applied';
        if (j === 0) status = 'Offer';
        if (j === 1 || j === 2) status = 'Interview';
        
        const app = await Application.create({
          user: student._id,
          company: `Tech Corp ${j}`,
          role: 'Backend Engineer', // Skew to backend
          status,
          source: sources[j % sources.length],
          dateApplied: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        totalApps++;

        await JobDescriptionSnapshot.create({
          userId: student._id,
          applicationId: app._id,
          content: 'Dummy JD',
          contentHash: `hash-${app._id}`,
          extractedMetadata: {
            skills: commonSkills.sort(() => 0.5 - Math.random()).slice(0, 3) // random 3 skills for market demand
          }
        });

        if (status === 'Interview' || status === 'Offer') {
          await Interview.create({
            user: student._id,
            application: app._id,
            type: 'Technical',
            date: new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000), // Upcoming or recent
            scheduledAt: new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000),
            result: status === 'Offer' ? 'Passed' : 'Scheduled'
          });
          totalInterviews++;
        }
      }
    }

    // Group 2: High activity, 0 interviews (The "Struggling Seekers") (5 students)
    for (let i = 5; i < 10; i++) {
      const student = students[i];
      // Create 15 applications all in applied/rejected state
      for (let j = 0; j < 15; j++) {
        const app = await Application.create({
          user: student._id,
          company: `Startup ${j}`,
          role: 'Frontend Dev',
          status: j % 3 === 0 ? 'Rejected' : 'Applied',
          source: 'LinkedIn',
          dateApplied: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
        });
        totalApps++;

        await JobDescriptionSnapshot.create({
          userId: student._id,
          applicationId: app._id,
          content: 'Dummy JD',
          contentHash: `hash-${app._id}`,
          extractedMetadata: {
            skills: commonSkills.sort(() => 0.5 - Math.random()).slice(0, 3) // random 3 skills for market demand
          }
        });
      }
    }

    // Group 3: Needs follow-up signals (5 students)
    for (let i = 10; i < 15; i++) {
      const student = students[i];
      for (let j = 0; j < 4; j++) {
        await Application.create({
          user: student._id,
          company: `Enterprise ${j}`,
          role: 'Data Scientist',
          status: 'Applied',
          needsFollowUp: j === 0 ? true : false, // 1 needs follow-up per student
          dateApplied: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        });
        totalApps++;
      }
    }

    // Group 4: Inactive students (5 students) - No recent applications
    for (let i = 15; i < 20; i++) {
      const student = students[i];
      // 1 old application
      await Application.create({
        user: student._id,
        company: 'Old Company',
        role: 'Intern',
        status: 'Rejected',
        dateApplied: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      });
      totalApps++;
    }

    console.log(`Created ${totalApps} mock applications and ${totalInterviews} mock interviews.`);
    console.log('Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding analytics:', error);
    process.exit(1);
  }
};

seedAnalytics();
