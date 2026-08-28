# Database Schema Document — JobPulse 🗄️

This document describes the MongoDB collections, relationships, field constraints, and indexes utilized in JobPulse.

---

## MongoDB Collections Overview

JobPulse uses three primary collections:
1. **users**: User account credentials, application configuration, and notification preferences.
2. **applications**: Main job logs containing status tracker, dates, priority flags, and notes.
3. **interviews**: Detailed interview round information linked back to an application.

---

## 1. User Schema (`users`)

| Field | Type | Required | Indexes | Default / Description |
|---|---|---|---|---|
| `_id` | ObjectId | Yes | Yes (Primary) | Auto-generated |
| `name` | String | Yes | No | Full name of the user |
| `email` | String | Yes | Yes (Unique) | Contact email (lowercase) |
| `password` | String | Yes | No | Hashed using bcryptjs |
| `followUpWindowDays` | Number | Yes | No | Default: `7` (Range: 1 - 90) |
| `emailNotifications` | Boolean | Yes | No | Default: `true` |
| `deadlineReminders` | Boolean | Yes | No | Default: `true` |
| `interviewReminders` | Boolean | Yes | No | Default: `true` |
| `createdAt` | Date | Yes | No | Timestamp |
| `updatedAt` | Date | Yes | No | Timestamp |

### Indexes
- `{ email: 1 }` (Unique)

---

## 2. Application Schema (`applications`)

| Field | Type | Required | Default / Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Auto-generated |
| `user` | ObjectId | Yes | References `User` model |
| `company` | String | Yes | Company name (e.g. Google) |
| `role` | String | Yes | Role name (e.g. SWE Intern) |
| `status` | String | Yes | Enum: `Wishlist`, `Applied`, `Assessment`, `Interview`, `Offer`, `Rejected` (Default: `Wishlist`) |
| `type` | String | Yes | Enum: `Full-time`, `Internship`, `Part-time`, `Contract` (Default: `Full-time`) |
| `dateApplied` | Date | Yes | Default: `Date.now` |
| `closingDate` | Date | No | Application deadline date |
| `jobUrl` | String | No | URL link to post |
| `isPriority` | Boolean | Yes | Default: `false` |
| `salary` | String | No | Target or offered compensation |
| `source` | String | No | Enum: `LinkedIn`, `Referral`, `Company Website`, `Naukri`, `Indeed`, `Other`, `""` |
| `contact` | String | No | Contact information |
| `resumeVersion` | String | No | Resume filename or version label |
| `notes` | String | No | Personal logs or notes |
| `needsFollowUp` | Boolean | Yes | Default: `false` (Nudge engine) |
| `followUpNotified` | Boolean | Yes | Default: `false` (Nudge engine email) |
| `lastFollowUpAt` | Date | No | Timestamp of last email notification |
| `isGhosted` | Boolean | Yes | Default: `false` (Auto-archiving) |
| `ghostedAt` | Date | No | Timestamp of ghost flagging |

### Indexes
- `{ user: 1, status: 1 }` (Compound) — Board aggregation queries
- `{ user: 1, updatedAt: -1 }` (Compound) — Sorting by update time
- `{ user: 1, needsFollowUp: 1 }` (Compound) — Stale follow-up checks
- `{ user: 1, isGhosted: 1 }` (Compound) — Ghost filtering
- `{ user: 1, isPriority: 1 }` (Compound) — Star priority filtering
- `{ user: 1, closingDate: 1 }` (Compound) — Deadline countdowns
- `{ user: 1, dateApplied: -1 }` (Compound) — Sorting by applied date

---

## 3. Interview Schema (`interviews`)

| Field | Type | Required | Default / Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Auto-generated |
| `user` | ObjectId | Yes | References `User` model |
| `application` | ObjectId | Yes | References `Application` model |
| `round` | Number | Yes | Interview round (Default: `1`) |
| `interviewType` | String | Yes | Enum: `Phone`, `Video`, `Technical`, `HR`, `Behavioral`, `On-site`, `Other` |
| `scheduledAt` | Date | Yes | Date and time of interview |
| `interviewerName` | String | No | Interviewer name |
| `interviewerEmail`| String | No | Interviewer email (lowercase) |
| `meetingUrl` | String | No | Link to Zoom, Meet, Teams etc. |
| `notes` | String | No | Notes, questions, focus |
| `result` | String | Yes | Enum: `Scheduled`, `Passed`, `Rejected`, `Rescheduled`, `Pending` |

### Indexes
- `{ application: 1, scheduledAt: 1 }` (Compound) — Multi-round ordering
- `{ user: 1, scheduledAt: 1 }` (Compound) — Dashboard upcoming schedule queries
