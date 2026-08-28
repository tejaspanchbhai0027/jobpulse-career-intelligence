const cron = require('node-cron');
const Application = require('../models/Application');
const User        = require('../models/User');
const { sendFollowUpEmail, sendDeadlineReminderEmail, sendInterviewReminderEmail } = require('../services/emailService');
const Interview = require('../models/Interview');

// ── Core logic: check stale applications and notify ───────────────────────────
// If userId is provided, only processes that user (for manual triggers).
// If userId is null/undefined, processes ALL users (cron job mode).
const runFollowUpCheck = async (userId = null) => {
  try {
    console.log(`[FollowUpJob] Starting check${userId ? ` for user ${userId}` : ' for all users'}...`);

    // Fetch users to process
    const usersQuery = userId ? { _id: userId } : {};
    const users = await User.find(usersQuery).select('name email followUpWindowDays emailNotifications deadlineReminders interviewReminders');

    let totalFlagged = 0;
    let totalEmailed = 0;
    const results = [];

    for (const user of users) {
      const windowDays = user.followUpWindowDays || 7;
      const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

      // Find stale applications: Applied + not updated within the window + not yet notified
      const staleApps = await Application.find({
        user:             user._id,
        status:           'Applied',
        followUpNotified: false,
        updatedAt:        { $lt: cutoffDate },
      }).select('company role dateApplied updatedAt');

      if (staleApps.length === 0) {
        results.push({ userId: user._id, email: user.email, flagged: 0, emailed: false });
        continue;
      }

      // Batch-update: set needsFollowUp + followUpNotified flags
      await Application.updateMany(
        { _id: { $in: staleApps.map((a) => a._id) } },
        {
          $set: {
            needsFollowUp:    true,
            followUpNotified: true,
            lastFollowUpAt:   new Date(),
          },
        }
      );

      totalFlagged += staleApps.length;
      let emailed = false;

      // Send email only if Resend is configured AND user has email notifications enabled
      const emailEnabled = process.env.RESEND_API_KEY &&
        process.env.RESEND_API_KEY !== 're_xxxxxxxxxxxxxxxxxxxx' &&
        user.emailNotifications !== false;

      if (emailEnabled) {
        try {
          await sendFollowUpEmail({
            to:           user.email,
            name:         user.name,
            applications: staleApps,
          });
          emailed = true;
          totalEmailed++;
        } catch (emailErr) {
          console.error(`[FollowUpJob] Email failed for ${user.email}:`, emailErr.message);
        }
      } else {
        console.log(`[FollowUpJob] ⚠️  RESEND_API_KEY not set — skipping email for ${user.email}`);
      }

      console.log(
        `[FollowUpJob] ${user.email}: flagged ${staleApps.length} app(s), emailed=${emailed}`
      )
      results.push({ userId: user._id, email: user.email, flagged: staleApps.length, emailed })
    }

    // Ghost detection: reuse the `users` array already fetched above
    console.log('[FollowUpJob] Running ghost detection pass...')
    let totalGhosted = 0

    for (const user of users) {
      const windowDays  = user.followUpWindowDays || 7
      const ghostDays   = Math.max(30, windowDays * 4)
      const ghostCutoff = new Date(Date.now() - ghostDays * 24 * 60 * 60 * 1000)

      const ghostResult = await Application.updateMany(
        {
          user:      user._id,
          status:    { $in: ['Applied', 'Assessment'] },
          isGhosted: false,   // don't re-flag already ghosted apps
          updatedAt: { $lt: ghostCutoff },
        },
        {
          $set: {
            isGhosted: true,
            ghostedAt: new Date(),
          },
        }
      )
      totalGhosted += ghostResult.modifiedCount || 0
    }

    console.log(`[FollowUpJob] ✅ Complete — ${totalFlagged} follow-up flag(s), ${totalEmailed} email(s), ${totalGhosted} ghosted`);

    // ── Deadline Reminder Pass ────────────────────────────────────────────────────
    // Send one email per user listing apps with closingDate within 1, 2, or 3 days
    console.log('[FollowUpJob] Running deadline reminder pass...');
    let totalDeadlineEmails = 0;

    const now = new Date();
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    for (const user of users) {
      // Skip users who've opted out of deadline reminders
      if (user.deadlineReminders === false) continue;

      const deadlineApps = await Application.find({
        user:        user._id,
        closingDate: { $gte: now, $lte: in3Days },
        status:      { $nin: ['Rejected', 'Offer'] }, // no need to remind for closed apps
        deadlineNotified: false,
      }).select('company role closingDate status');

      if (deadlineApps.length === 0) continue;

      const resendConfigured = process.env.RESEND_API_KEY &&
        process.env.RESEND_API_KEY !== 're_xxxxxxxxxxxxxxxxxxxx' &&
        user.emailNotifications !== false;

      if (resendConfigured) {
        try {
          await sendDeadlineReminderEmail({
            to:           user.email,
            name:         user.name,
            applications: deadlineApps,
          });
          
          // Mark as notified so we don't spam them tomorrow
          await Application.updateMany(
            { _id: { $in: deadlineApps.map(a => a._id) } },
            { $set: { deadlineNotified: true } }
          );

          totalDeadlineEmails++;
          console.log(`[FollowUpJob] Deadline reminder sent to ${user.email} (${deadlineApps.length} app(s))`);
        } catch (err) {
          console.error(`[FollowUpJob] Deadline email failed for ${user.email}:`, err.message);
        }
      } else {
        console.log(`[FollowUpJob] ${deadlineApps.length} deadline(s) for ${user.email} — email skipped (not configured)`);
      }
    }

    console.log(`[FollowUpJob] ✅ Deadline pass — ${totalDeadlineEmails} email(s) sent`);

    // ── Interview Reminder Pass ───────────────────────────────────────────────────
    console.log('[FollowUpJob] Running interview reminder pass...');
    let totalInterviewEmails = 0;
    const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);

    for (const user of users) {
      if (user.interviewReminders === false) continue;

      const upcomingInterviews = await Interview.find({
        user: user._id,
        scheduledAt: { $gte: now, $lte: in48Hours },
        result: 'Scheduled',
        interviewNotified: false,
      }).populate('application', 'company role');

      if (upcomingInterviews.length === 0) continue;

      const resendConfigured = process.env.RESEND_API_KEY &&
        process.env.RESEND_API_KEY !== 're_xxxxxxxxxxxxxxxxxxxx' &&
        user.emailNotifications !== false;

      if (resendConfigured) {
        try {
          await sendInterviewReminderEmail({
            to: user.email,
            name: user.name,
            interviews: upcomingInterviews,
          });

          await Interview.updateMany(
            { _id: { $in: upcomingInterviews.map(i => i._id) } },
            { $set: { interviewNotified: true } }
          );

          totalInterviewEmails++;
          console.log(`[FollowUpJob] Interview reminder sent to ${user.email} (${upcomingInterviews.length} interview(s))`);
        } catch (err) {
          console.error(`[FollowUpJob] Interview email failed for ${user.email}:`, err.message);
        }
      } else {
        console.log(`[FollowUpJob] ${upcomingInterviews.length} interview(s) for ${user.email} — email skipped (not configured)`);
      }
    }

    console.log(`[FollowUpJob] ✅ Interview pass — ${totalInterviewEmails} email(s) sent`);

    return { totalFlagged, totalEmailed, totalGhosted, totalDeadlineEmails, totalInterviewEmails, results };
  } catch (err) {
    console.error('[FollowUpJob] ❌ Error:', err.message);
    throw err;
  }
}

// ── Schedule: every day at 09:00 UTC ─────────────────────────────────────────
// Configurable via CRON_SCHEDULE env var (default: daily at 9 AM UTC)
const startFollowUpCron = () => {
  const schedule = process.env.CRON_SCHEDULE || '0 9 * * *';

  if (!cron.validate(schedule)) {
    console.error(`[FollowUpJob] Invalid cron expression: "${schedule}"`);
    return;
  }

  cron.schedule(schedule, async () => {
    console.log(`[FollowUpJob] 🔔 Cron triggered at ${new Date().toISOString()}`);
    await runFollowUpCheck(); // all users
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  console.log(`[FollowUpJob] ✅ Cron scheduled: "${schedule}" (UTC)`);
};

module.exports = { startFollowUpCron, runFollowUpCheck };
