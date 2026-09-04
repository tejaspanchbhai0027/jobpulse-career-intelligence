require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_12345';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

// Minimal app for testing (no cron, just routes)
const buildTestApp = () => {
  const app = express();
  app.use(express.json({ limit: '50kb' }));
  app.use(require('cookie-parser')());

  app.use('/api/auth',         require('../src/routes/authRoutes'));
  app.use('/api/applications', require('../src/routes/applicationRoutes'));
  app.use('/api/interviews',   require('../src/routes/interviewRoutes'));
  app.use('/api/health',       require('../src/routes/healthRoutes'));

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
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Helper ─────────────────────────────────────────────────────────────────────
const registerAndLogin = async (overrides = {}) => {
  const user = { name: 'Test User', email: 'test@example.com', password: 'password123', ...overrides };
  await request(app).post('/api/auth/register').send(user);
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
  return { cookie: res.headers['set-cookie'], user: res.body.user };
};

// ── Health Check ───────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── Auth Routes ────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice', email: 'alice@example.com', password: 'password123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob', email: 'notanemail', password: 'password123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].field).toBe('email');
  });

  it('rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bob', email: 'bob@example.com', password: '123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });

  it('prevents duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/register').send({ name: 'Alice2', email: 'alice@example.com', password: 'password123' });
    expect([400, 409]).toContain(res.statusCode);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'notanemail', password: 'test' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile with valid cookie', async () => {
    const { cookie } = await registerAndLogin();
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('rejects request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ── Application Routes ─────────────────────────────────────────────────────────
describe('Application CRUD', () => {
  let cookie;
  beforeEach(async () => {
    ({ cookie } = await registerAndLogin());
  });

  it('creates an application with required fields', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Google', role: 'SWE Intern' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.company).toBe('Google');
    expect(res.body.data.status).toBe('Wishlist'); // Zod default
    expect(res.body.data.type).toBe('Full-time');
  });

  it('rejects application without company', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ role: 'SWE Intern' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some(e => e.field === 'company')).toBe(true);
  });

  it('rejects unknown fields (strict mode)', async () => {
    const res = await request(app)
      .put('/api/applications/000000000000000000000000')
      .set('Cookie', cookie)
      .send({ company: 'Test', unknownHackField: 'injection' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('lists only the authenticated user applications', async () => {
    await request(app).post('/api/applications').set('Cookie', cookie).send({ company: 'Apple', role: 'Designer' });
    await request(app).post('/api/applications').set('Cookie', cookie).send({ company: 'Meta', role: 'PM' });

    const res = await request(app).get('/api/applications').set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('updates an application', async () => {
    const created = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Netflix', role: 'Engineer' });

    const id = created.body.data._id;
    const res = await request(app)
      .put(`/api/applications/${id}`)
      .set('Cookie', cookie)
      .send({ status: 'Interview' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('Interview');
  });

  it('deletes an application', async () => {
    const created = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Amazon', role: 'SDE' });
    const id = created.body.data._id;

    const res = await request(app).delete(`/api/applications/${id}`).set('Cookie', cookie);
    expect(res.statusCode).toBe(200);

    const check = await request(app).get('/api/applications').set('Cookie', cookie);
    expect(check.body.data).toHaveLength(0);
  });

  it('cannot access another users application', async () => {
    const created = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Stripe', role: 'Eng' });
    const id = created.body.data._id;

    // Register a second user
    const { cookie: cookie2 } = await registerAndLogin({ name: 'Other', email: 'other@example.com', password: 'password123' });
    const res = await request(app).delete(`/api/applications/${id}`).set('Cookie', cookie2);
    expect(res.statusCode).toBe(404);
  });
});

// ── Interview Routes ───────────────────────────────────────────────────────────
describe('Interview CRUD', () => {
  let cookie, appId;
  beforeEach(async () => {
    ({ cookie } = await registerAndLogin());
    const app2 = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Airbnb', role: 'SWE' });
    appId = app2.body.data._id;
  });

  it('creates an interview for an application', async () => {
    const res = await request(app)
      .post('/api/interviews')
      .set('Cookie', cookie)
      .send({ applicationId: appId, scheduledAt: new Date(Date.now() + 86400000).toISOString(), interviewType: 'Video', round: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.interviewType).toBe('Video');
  });

  it('auto-advances application to Interview status', async () => {
    await request(app)
      .post('/api/interviews')
      .set('Cookie', cookie)
      .send({ applicationId: appId, scheduledAt: new Date(Date.now() + 86400000).toISOString(), interviewType: 'Phone', round: 1 });

    const appRes = await request(app).get('/api/applications').set('Cookie', cookie);
    const updatedApp = appRes.body.data.find(a => a._id === appId);
    expect(updatedApp.status).toBe('Interview');
  });

  it('gets upcoming interviews', async () => {
    await request(app)
      .post('/api/interviews')
      .set('Cookie', cookie)
      .send({ applicationId: appId, scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(), round: 1 });

    const res = await request(app).get('/api/interviews/upcoming').set('Cookie', cookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('rejects interview creation without scheduledAt', async () => {
    const res = await request(app)
      .post('/api/interviews')
      .set('Cookie', cookie)
      .send({ applicationId: appId, round: 1 });
    expect(res.statusCode).toBe(400);
  });
});

// ── Zod Validation Edge Cases ──────────────────────────────────────────────────
describe('Zod Validation', () => {
  let cookie;
  beforeEach(async () => {
    ({ cookie } = await registerAndLogin());
  });

  it('rejects invalid status enum', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Test', role: 'Dev', status: 'InvalidStatus' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some(e => e.field === 'status')).toBe(true);
  });

  it('rejects invalid job URL', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Test', role: 'Dev', jobUrl: 'not-a-url' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some(e => e.field === 'jobUrl')).toBe(true);
  });

  it('accepts empty string for jobUrl', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Test', role: 'Dev', jobUrl: '' });
    expect(res.statusCode).toBe(201);
  });

  it('coerces dateApplied from string to Date', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Cookie', cookie)
      .send({ company: 'Test', role: 'Dev', dateApplied: '2024-01-15' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.dateApplied).toBeDefined();
  });
});
