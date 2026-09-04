require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_12345';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');

const Institution = require('../src/models/Institution');
const User = require('../src/models/User');

const buildTestApp = () => {
  const app = express();
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  app.use('/api/auth', require('../src/routes/authRoutes'));
  app.use('/api/admin/dashboard', require('../src/routes/adminDashboardRoutes'));
  app.use('/api/admin/officers', require('../src/routes/adminOfficerRoutes'));
  app.use('/api/admin/students', require('../src/routes/adminStudentRoutes'));

  const { notFound, errorHandler } = require('../src/middleware/errorHandler');
  app.use(notFound);
  app.use(errorHandler);
  return app;
};

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = buildTestApp();
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────
const createInstitution = async (name, code) => {
  return await Institution.create({ name, code });
};

const registerAndLogin = async (overrides = {}) => {
  const user = { name: 'Test User', email: 'test@example.com', password: 'password123', ...overrides };
  await request(app).post('/api/auth/register').send(user);
  
  if (overrides.role || overrides.institutionId || overrides.privacySettings) {
    await User.findOneAndUpdate({ email: user.email }, { 
      role: overrides.role || 'STUDENT',
      institutionId: overrides.institutionId || null,
      privacySettings: overrides.privacySettings || undefined
    });
  }

  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return { cookie: res.headers['set-cookie'], user: res.body.user };
};

// ── 1. Unauthenticated -> Admin API ──────────────────────────────────────────
describe('Unauthenticated Access', () => {
  it('rejects access to admin dashboard API', async () => {
    const res = await request(app).get('/api/admin/dashboard/metrics');
    expect(res.statusCode).toBe(401);
  });
});

// ── 2. Student -> Admin API ──────────────────────────────────────────────────
describe('RBAC: Student Access', () => {
  it('rejects student access to admin API', async () => {
    const { cookie } = await registerAndLogin({ role: 'STUDENT', email: 'student@example.com' });
    
    const res = await request(app)
      .get('/api/admin/dashboard/metrics')
      .set('Cookie', cookie);
      
    expect(res.statusCode).toBe(403);
  });
});

// ── 3. Officer -> Institution Admin API (Team Management) ────────────────────
describe('RBAC: Placement Officer Access', () => {
  it('rejects placement officer from accessing team management (officers API)', async () => {
    const inst = await createInstitution('Test Univ', 'TU');
    const { cookie } = await registerAndLogin({ role: 'PLACEMENT_OFFICER', institutionId: inst._id, email: 'officer@example.com' });
    
    const res = await request(app)
      .get('/api/admin/officers')
      .set('Cookie', cookie);
      
    expect(res.statusCode).toBe(403);
  });

  it('allows placement officer to access admin dashboard', async () => {
    const inst = await createInstitution('Test Univ', 'TU');
    const { cookie } = await registerAndLogin({ role: 'PLACEMENT_OFFICER', institutionId: inst._id, email: 'officer@example.com' });
    
    const res = await request(app)
      .get('/api/admin/dashboard/metrics')
      .set('Cookie', cookie);
      
    expect(res.statusCode).toBe(200);
  });
});

// ── 4. Institution A -> Institution B Data Isolation ─────────────────────────
describe('Institution Isolation', () => {
  it('prevents officer from institution A seeing students from institution B', async () => {
    const instA = await createInstitution('Inst A', 'IA');
    const instB = await createInstitution('Inst B', 'IB');
    
    const { cookie: adminACookie } = await registerAndLogin({ role: 'INSTITUTION_ADMIN', institutionId: instA._id, email: 'adminA@example.com' });
    
    // Create student in Inst B
    await registerAndLogin({ role: 'STUDENT', institutionId: instB._id, email: 'studentB@example.com' });

    // Admin A requests student directory
    const res = await request(app)
      .get('/api/admin/students')
      .set('Cookie', adminACookie);
      
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0); // Should not see studentB
  });
});

// ── 5. Admin -> Private Student Data Privacy ─────────────────────────────────
describe('Student Privacy Settings', () => {
  it('scrubs private fields from student profile if restricted', async () => {
    const inst = await createInstitution('Privacy Univ', 'PU');
    const { cookie: adminCookie } = await registerAndLogin({ role: 'INSTITUTION_ADMIN', institutionId: inst._id, email: 'admin@example.com' });
    
    // Create student with strict privacy
    const privacySettings = {
      shareProfileWithPlacement: true,
      salary: false, // Don't share salary
      resume: false, // Don't share resume
    };
    
    await request(app).post('/api/auth/register').send({ name: 'Private Student', email: 'private@example.com', password: 'password123' });
    const privStudent = await User.findOneAndUpdate(
      { email: 'private@example.com' }, 
      { role: 'STUDENT', institutionId: inst._id, privacySettings, targetSalary: '$200k' },
      { new: true }
    );

    // Admin fetches profile
    const res = await request(app)
      .get(`/api/admin/students/${privStudent._id}`)
      .set('Cookie', adminCookie);
      
    expect(res.statusCode).toBe(200);
    // Profile should not contain salary or resume based on privacySettings
    expect(res.body.data.profile.targetSalary).toBeUndefined();
    expect(res.body.data.profile.resumeText).toBeUndefined();
  });
});
