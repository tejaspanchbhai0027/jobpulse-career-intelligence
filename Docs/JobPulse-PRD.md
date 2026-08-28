# Product Requirements Document (PRD)
## JobPulse — Smart Job Application Tracker

**Version:** 1.0
**Author:** [Your Name]
**Date:** August 2026
**Status:** Draft for Development

---

## 1. Overview

JobPulse is a full-stack MERN web application that helps job seekers track applications through their entire hiring pipeline and automatically nudges them when an application has gone stale with no follow-up. It solves a specific, real gap in existing tools (Huntr, Teal, Simplify) — none of which proactively alert users when an application needs attention; they rely on the user remembering to check.

### 1.1 Problem Statement
Job seekers applying to multiple roles lose track of where each application stands. Existing trackers (spreadsheets, Huntr, Teal) require the user to manually check status and remember to follow up. Applications quietly go stale, and opportunities for a well-timed follow-up email are missed.

### 1.2 Solution
JobPulse centralizes every application into a visual pipeline (Kanban board) and runs a background job daily that flags any application sitting in "Applied" status for more than a configurable number of days, notifying the user via email and an in-app badge.

### 1.3 Target Users
- Active job seekers managing 10+ applications simultaneously
- Students/new grads applying broadly during placement season
- Career-switchers tracking applications across multiple industries

---

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Reduce missed follow-ups | % of stale applications that receive a follow-up nudge within 24 hrs of crossing threshold |
| Centralize job search | User can log an application in under 30 seconds |
| Provide visibility | Dashboard shows accurate real-time status distribution |
| Demonstrate technical depth (portfolio goal) | Working deployed app with auth, CRUD, scheduled jobs, and email integration |

---

## 3. Tech Stack (MERN)

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React (Vite) | SPA UI, component-based architecture |
| | React Router | Client-side routing |
| | Context API / Redux Toolkit (optional) | Auth & global state management |
| | @dnd-kit or react-beautiful-dnd | Drag-and-drop Kanban board |
| | Recharts | Dashboard analytics charts |
| | Axios | API communication |
| | Tailwind CSS | Styling |
| **Backend** | Node.js + Express | REST API server |
| | Mongoose | MongoDB ODM, schema modeling |
| | JSON Web Token (JWT) | Stateless authentication |
| | bcryptjs | Password hashing |
| | node-cron | Scheduled daily job for follow-up detection |
| | Resend (or Brevo) API | Transactional email delivery |
| | dotenv | Environment variable management |
| | cors | Cross-origin request handling |
| **Database** | MongoDB Atlas (free M0 tier) | Cloud-hosted NoSQL database |
| **Deployment** | Vercel (frontend) | Free static/SPA hosting |
| | Render (backend) | Free Node.js web service hosting |
| | MongoDB Atlas | Free managed database cluster |
| | GitHub | Version control + CI trigger for auto-deploy |

---

## 4. User Roles

| Role | Description |
|---|---|
| **User** | Registered job seeker with full access to their own applications, dashboard, and settings |

*(No admin role in v1 — out of scope; single-tenant per-user data model.)*

---

## 5. Feature List

### 5.1 Core Features (Must-Have — MVP)

| # | Feature | Description |
|---|---|---|
| 1 | User Authentication | Signup/login with JWT; passwords hashed with bcrypt; protected routes |
| 2 | Application CRUD | Create, read, update, delete job applications (company, role, URL, status, date applied, notes, contact) |
| 3 | Kanban Pipeline Board | Visual board with drag-and-drop across stages: Wishlist → Applied → Assessment → Interview → Offer → Rejected |
| 4 | Application Detail View | Expandable card showing notes, contact info, follow-up history |
| 5 | **Follow-Up Nudge Engine (Differentiator)** | Daily cron job flags applications in "Applied" status with no update for 7+ days (configurable); sends email reminder via Resend API and sets an in-app "Needs Follow-Up" badge |

### 5.2 Should-Have Features

| # | Feature | Description |
|---|---|---|
| 6 | Dashboard Analytics | Charts: applications per week, status distribution (pie/bar chart via Recharts), average response time |
| 7 | Configurable Follow-Up Window | User can set custom "remind me after X days" per application or globally |
| 8 | Search & Filter | Filter applications by company, status, or date range |

### 5.3 Won't-Have (Explicitly Out of Scope for v1)

- Admin panel / multi-tenant roles
- Gmail/email inbox parsing for auto status updates
- Chrome extension for autofill
- Resume/ATS parsing
- Payment or subscription features

---

## 6. Data Models

### 6.1 User
```
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt, updatedAt
}
```

### 6.2 Application
```
{
  user: ObjectId (ref: User),
  company: String,
  role: String,
  jobUrl: String,
  status: Enum [Wishlist, Applied, Assessment, Interview, Offer, Rejected],
  dateApplied: Date,
  notes: String,
  contact: String,
  needsFollowUp: Boolean,
  lastFollowUpAt: Date,
  followUpNotified: Boolean,
  createdAt, updatedAt
}
```

---

## 7. API Endpoints (High-Level)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Authenticate user, return JWT |
| GET | `/api/applications` | Get all applications for logged-in user |
| POST | `/api/applications` | Create new application |
| PUT | `/api/applications/:id` | Update application (status, notes, etc.) |
| DELETE | `/api/applications/:id` | Delete application |
| GET | `/api/dashboard/stats` | Aggregated stats for charts |
| GET | `/api/applications/needs-followup` | List applications flagged by nudge engine |

*(Cron job runs server-side on a schedule — not a user-triggered endpoint.)*

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | Passwords hashed (bcrypt), JWT secrets in environment variables, protected API routes |
| Performance | API responses under 500ms for standard CRUD operations |
| Availability | Free-tier hosting acceptable; Render free tier may cold-start after inactivity |
| Scalability | Not a v1 concern — single-user data isolation via `userId` is sufficient |
| Responsiveness | UI usable on mobile and desktop viewports |

---

## 9. Milestones / Build Plan

| Phase | Deliverable |
|---|---|
| Phase 1 | Project skeleton deployed (empty frontend + backend live on Vercel/Render, DB connected) |
| Phase 2 | Authentication (register/login, protected routes) |
| Phase 3 | Application CRUD + Kanban board UI |
| Phase 4 | Follow-up nudge engine (cron job + email integration) |
| Phase 5 | Dashboard analytics |
| Phase 6 | Polish, README, final deployment, demo video/screenshots |

---

## 10. Resume Summary Line (Reference)

> Built JobPulse, a full-stack MERN job application tracker with JWT auth, a drag-and-drop Kanban pipeline, and a cron-based follow-up reminder system (Node-cron + Resend API) that auto-flags stale applications and sends email nudges; deployed on Vercel, Render, and MongoDB Atlas.
