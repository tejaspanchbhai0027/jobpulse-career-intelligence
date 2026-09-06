require('dotenv').config();

const requiredEnvs = ['MONGO_URI', 'JWT_SECRET', 'RESEND_API_KEY', 'GEMINI_API_KEY'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
if (missingEnvs.length > 0) {
  console.error(`❌ FATAL ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

const express     = require('express');
const cors        = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const cookieParser  = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB             = require('./src/config/db');
const healthRoutes          = require('./src/routes/healthRoutes');
const authRoutes            = require('./src/routes/authRoutes');
const applicationRoutes     = require('./src/routes/applicationRoutes');
const nudgeRoutes           = require('./src/routes/nudgeRoutes');
const dashboardRoutes       = require('./src/routes/dashboardRoutes');
const interviewRoutes       = require('./src/routes/interviewRoutes');
const aiRoutes              = require('./src/routes/aiRoutes');

const intelligenceRoutes    = require('./src/routes/intelligenceRoutes');
const resumeRoutes          = require('./src/routes/resumeRoutes');
const experimentRoutes      = require('./src/routes/experimentRoutes');
const institutionRoutes     = require('./src/routes/institutionRoutes');
const superAdminRoutes      = require('./src/routes/superAdminRoutes');
const adminDashboardRoutes  = require('./src/routes/adminDashboardRoutes');
const adminStudentRoutes    = require('./src/routes/adminStudentRoutes');
const adminIntelligenceRoutes = require('./src/routes/adminIntelligenceRoutes');
const adminInterventionRoutes = require('./src/routes/adminInterventionRoutes');
const adminEmployerRoutes     = require('./src/routes/adminEmployerRoutes');
const adminAnalyticsRoutes    = require('./src/routes/adminAnalyticsRoutes');
const adminOfficerRoutes      = require('./src/routes/adminOfficerRoutes');
const adminMentorRoutes       = require('./src/routes/adminMentorRoutes');
const mentorRoutes            = require('./src/routes/mentorRoutes');
const officerRoutes           = require('./src/routes/officerRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const { startFollowUpCron } = require('./src/jobs/followUpJob');

// ── Connect to MongoDB and start cron after successful connection ──────────────
connectDB().then(() => {
  startFollowUpCron();
});

// ── Express App ────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

// ── Security Headers (helmet) ─────────────────────────────────────────────────
// Applies a sensible set of HTTP security headers.
// crossOriginResourcePolicy relaxed so frontend assets load from separate origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow CLIENT_URL plus common Vite dev ports. Comma-separated env var supported.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/^["']|["']$/g, '').replace(/\/$/, ''))
  .concat(['http://localhost:5174', 'http://localhost:4173', 'https://jobpulse-career-intelligence.vercel.app']); // Vite alt + preview + PROD

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, health checks) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ── Body Parsing + Size Limits ────────────────────────────────────────────────
// 50kb limit prevents large payload attacks without breaking normal requests.
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// ── NoSQL Injection Prevention ────────────────────────────────────────────────
// Express 5 makes req.query read-only, so we sanitize objects directly
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  if (req.query) mongoSanitize.sanitize(req.query, { replaceWith: '_' });
  next();
});

// ── HTTP Request Logger (dev only) ────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Global Rate Limiter ───────────────────────────────────────────────────────
// 300 requests per 15 minutes per IP — covers all API routes.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/health',        healthRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/nudge',         nudgeRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/interviews',    interviewRoutes);
app.use('/api/ai',            aiRoutes);

app.use('/api/intelligence',  intelligenceRoutes);
app.use('/api/resumes',       resumeRoutes);
app.use('/api/experiments',   experimentRoutes);
app.use('/api/institution',   institutionRoutes);
app.use('/api/super-admin',   superAdminRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/students',  adminStudentRoutes);
app.use('/api/admin/intelligence',  adminIntelligenceRoutes);
app.use('/api/admin/interventions', adminInterventionRoutes);
app.use('/api/admin/employers',     adminEmployerRoutes);
app.use('/api/admin/analytics',     adminAnalyticsRoutes);
app.use('/api/admin/officers',      adminOfficerRoutes);
app.use('/api/admin/mentors',       adminMentorRoutes);
app.use('/api/mentor',              mentorRoutes);
app.use('/api/officer',             officerRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  JobPulse server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
 
