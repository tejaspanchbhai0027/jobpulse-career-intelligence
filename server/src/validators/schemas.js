const { z } = require('zod');

const datePreprocess = z.preprocess(
  (arg) => (arg === '' || arg === null ? undefined : arg),
  z.coerce.date().optional()
);

// ── Auth schemas ────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(60, 'Name cannot exceed 60 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  institutionId: z.string().optional().nullable(),
  placementOfficerId: z.string().optional().nullable(),
  mentorId: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const updateSettingsSchema = z.object({
  followUpWindowDays: z.coerce
    .number({ invalid_type_error: 'followUpWindowDays must be a number' })
    .int('followUpWindowDays must be a whole number')
    .min(1, 'Must be at least 1 day')
    .max(90, 'Cannot exceed 90 days')
    .optional(),
  jobSearchGoal:      z.string().max(100, 'Goal cannot exceed 100 characters').optional(),
  emailNotifications: z.boolean().optional(),
  deadlineReminders:  z.boolean().optional(),
  interviewReminders: z.boolean().optional(),
  resumeText: z.string().max(10000, 'Resume text cannot exceed 10000 characters').optional(),
  savedFilters: z.array(z.object({
    name: z.string().min(1).max(50),
    state: z.any()
  })).optional(),
  name:               z.string().trim().min(1).max(60).optional(),
  phone:              z.string().trim().optional(),
  location:           z.string().trim().optional(),
  preferredLocations: z.array(z.string()).optional(),
  linkedinUrl:        z.string().trim().optional(), // Could add URL validation, keeping it loose for now
  githubUrl:          z.string().trim().optional(),
  portfolioUrl:       z.string().trim().optional(),
  department:         z.string().trim().optional(),
  class:              z.string().trim().optional(),
  division:           z.string().trim().optional(),
  targetRoles:        z.array(z.string()).optional(),
  targetSalary:       z.string().optional(),
  employmentTypes:    z.array(z.string()).optional(),
  workPreference:     z.string().optional(),
  professionalBio:    z.string().max(1000).optional(),
  intelligenceSettings: z.object({
    careerIntelligence: z.boolean().optional(),
    copilot: z.boolean().optional(),
    strategyRecommendations: z.boolean().optional(),
    weeklyStrategySummary: z.boolean().optional(),
  }).optional(),
});

// ── Application schemas ─────────────────────────────────────────────────────
const VALID_STATUSES = ['Wishlist', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];
const VALID_TYPES    = ['Full-time', 'Internship', 'Part-time', 'Contract'];
const VALID_SOURCES  = ['LinkedIn', 'Referral', 'Company Website', 'Naukri', 'Indeed', 'Other', ''];

const createApplicationSchema = z.object({
  company: z
    .string({ required_error: 'Company name is required' })
    .trim()
    .min(1, 'Company name is required')
    .max(100, 'Company name cannot exceed 100 characters'),
  role: z
    .string({ required_error: 'Job role is required' })
    .trim()
    .min(1, 'Job role is required')
    .max(120, 'Role cannot exceed 120 characters'),
  status:      z.enum(VALID_STATUSES).optional().default('Wishlist'),
  type:        z.enum(VALID_TYPES).optional().default('Full-time'),
  dateApplied: datePreprocess,
  closingDate: datePreprocess,
  jobUrl:      z.string().trim().url('Job URL must be a valid URL').or(z.literal('')).optional().default(''),
  isPriority:  z.boolean().optional().default(false),
  salary:      z.string().trim().max(100, 'Salary field too long').optional().default(''),
  source:      z.enum(VALID_SOURCES).optional().default(''),
  contact:     z.string().trim().max(200, 'Contact info too long').optional().default(''),
  resumeVersion: z.string().trim().max(100, 'Resume version too long').optional().default(''),
  notes:         z.string().max(5000, 'Notes cannot exceed 5000 characters').optional().default(''),
  jobDescription: z.string().max(15000, 'Job description cannot exceed 15000 characters').optional().default(''),
});

const updateApplicationSchema = z.object({
  company:       z.string().trim().min(1).max(100).optional(),
  role:          z.string().trim().min(1).max(120).optional(),
  status:        z.enum(VALID_STATUSES).optional(),
  type:          z.enum(VALID_TYPES).optional(),
  dateApplied:   datePreprocess,
  closingDate:   datePreprocess,
  jobUrl:        z.string().trim().url('Job URL must be a valid URL').or(z.literal('')).optional(),
  isPriority:    z.boolean().optional(),
  salary:        z.string().trim().max(100).optional(),
  source:        z.enum(VALID_SOURCES).optional(),
  contact:       z.string().trim().max(200).optional(),
  resumeVersion: z.string().trim().max(100).optional(),
  notes:         z.string().max(5000).optional(),
  jobDescription: z.string().max(15000).optional(),
  needsFollowUp: z.boolean().optional(),
  isGhosted:     z.boolean().optional(),
  ghostedAt:     datePreprocess,
  lastFollowUpAt:datePreprocess,
}).strict();

// ── Export format schema ────────────────────────────────────────────────────
const exportSchema = z.object({
  format: z.enum(['csv', 'json'], { invalid_type_error: 'format must be csv or json' }).optional().default('json'),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateSettingsSchema,
  createApplicationSchema,
  updateApplicationSchema,
  exportSchema,
};
