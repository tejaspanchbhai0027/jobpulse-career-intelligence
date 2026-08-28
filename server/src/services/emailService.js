const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Build the HTML email body ─────────────────────────────────────────────────
const buildEmailHtml = (userName, applications, dashboardUrl) => {
  const firstName = userName.split(' ')[0];

  const appRows = applications
    .map((app) => {
      const days = Math.floor(
        (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return `
        <tr>
          <td style="padding:12px 16px; border-bottom:1px solid #f0f0f0;">
            <div style="font-weight:700; font-size:15px; color:#111827; margin-bottom:2px;">
              ${app.company}
            </div>
            <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">${app.role}</div>
            <span style="display:inline-block; padding:2px 10px; background:#fef3c7; border:1px solid #fcd34d; border-radius:999px; font-size:12px; font-weight:700; color:#92400e;">
              ⏱ ${days} day${days !== 1 ? 's' : ''} without activity
            </span>
          </td>
        </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Follow-Up Reminder — JobPulse</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#06b6d4 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:4px;">
              <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Job<span style="opacity:0.85;">Pulse</span>
              </span>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;font-weight:500;">
              Smart Job Application Tracker
            </div>
          </td>
        </tr>

        <!-- Alert Banner -->
        <tr>
          <td style="background:#fffbeb;border-bottom:2px solid #fcd34d;padding:16px 40px;text-align:center;">
            <span style="font-size:22px;">⚡</span>
            <span style="font-size:14px;font-weight:700;color:#92400e;margin-left:8px;">
              ${applications.length} application${applications.length !== 1 ? 's need' : ' needs'} your attention
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
              Time to follow up, ${firstName}! 👋
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              The applications below have been sitting in <strong style="color:#111827;">Applied</strong> status 
              without any activity. A well-timed follow-up email can make all the difference — 
              companies appreciate candidates who show initiative.
            </p>

            <!-- Applications Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="background:#f9fafb;padding:10px 16px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e5e7eb;">
                  Applications Needing Follow-Up
                </td>
              </tr>
              ${appRows}
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:4px 0 8px;">
                  <a href="${dashboardUrl}" 
                     style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:-0.01em;">
                    Open My Dashboard →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
              Pro tip: A brief, personalized follow-up referencing your interview or application 
              increases callback rates by up to 30%.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
              You're receiving this because you have follow-up reminders enabled on 
              <a href="${dashboardUrl}" style="color:#6366f1;text-decoration:none;font-weight:600;">JobPulse</a>.
            </p>
            <p style="margin:0;font-size:12px;color:#d1d5db;">
              © ${new Date().getFullYear()} JobPulse — Built with ❤️ using MERN Stack
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ── Send follow-up reminder email ─────────────────────────────────────────────
const sendFollowUpEmail = async ({ to, name, applications }) => {
  const dashboardUrl = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/dashboard`
    : 'http://localhost:5173/dashboard';

  const count = applications.length;
  const subject = count === 1
    ? `⚡ "${applications[0].company}" needs a follow-up — JobPulse`
    : `⚡ ${count} applications need follow-up — JobPulse`;

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || 'JobPulse <onboarding@resend.dev>',
    to: [to],
    subject,
    html: buildEmailHtml(name, applications, dashboardUrl),
  });

  if (error) {
    console.error(`[EmailService] Resend error:`, error.message);
    throw new Error(error.message || 'Email delivery failed');
  }

  console.log(`[EmailService] Email sent successfully (id: ${data?.id})`);
  return data;
};

// ── Send deadline reminder email ──────────────────────────────────────────────
const sendDeadlineReminderEmail = async ({ to, name, applications }) => {
  const dashboardUrl = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/dashboard`
    : 'http://localhost:5173/dashboard';

  const firstName = name.split(' ')[0];

  const appRows = applications.map(app => {
    const deadline = new Date(app.closingDate);
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const urgencyColor = daysLeft <= 0 ? '#ef4444' : daysLeft === 1 ? '#f97316' : '#f59e0b';
    const urgencyText  = daysLeft <= 0 ? '⛔ Deadline passed' : daysLeft === 1 ? '🔴 Tomorrow!' : `🟡 ${daysLeft} days left`;
    return `
      <tr>
        <td style="padding:12px 16px; border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:700; font-size:15px; color:#111827; margin-bottom:2px;">${app.company}</div>
          <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">${app.role}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <span style="font-size:12px; color:#6b7280;">Deadline: <strong>${deadline.toLocaleDateString()}</strong></span>
            <span style="padding:2px 10px; background:${urgencyColor}20; border:1px solid ${urgencyColor}60; border-radius:999px; font-size:12px; font-weight:700; color:${urgencyColor};">
              ${urgencyText}
            </span>
          </div>
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Deadline Alert — JobPulse</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#ef4444 0%,#f97316 60%,#f59e0b 100%);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">Job<span style="opacity:0.85;">Pulse</span></span>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Application Deadline Alert</div>
          </td>
        </tr>
        <tr>
          <td style="background:#fff7ed;border-bottom:2px solid #fed7aa;padding:16px 40px;text-align:center;">
            <span style="font-size:22px;">⏰</span>
            <span style="font-size:14px;font-weight:700;color:#9a3412;margin-left:8px;">
              ${applications.length} application deadline${applications.length !== 1 ? 's are' : ' is'} approaching
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Don't miss the deadline, ${firstName}! ⏰</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">The following applications have upcoming closing dates. Make sure your application is submitted before the deadline.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr><td style="background:#fef3c7;padding:10px 16px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #fcd34d;">Applications with Upcoming Deadlines</td></tr>
              ${appRows}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:4px 0 8px;">
                <a href="${dashboardUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ef4444,#f97316);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Open My Dashboard →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} JobPulse — Smart Job Application Tracker</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const count = applications.length;
  const subject = count === 1
    ? `⏰ Deadline approaching: "${applications[0].company}" — JobPulse`
    : `⏰ ${count} application deadlines approaching — JobPulse`;

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || 'JobPulse <onboarding@resend.dev>',
    to:   [to],
    subject,
    html,
  });

  if (error) {
    console.error(`[EmailService] Deadline email error:`, error.message);
    throw new Error(error.message || 'Deadline email delivery failed');
  }

  console.log(`[EmailService] Deadline reminder sent (id: ${data?.id})`);
  return data;
};

// ── Send interview reminder email ─────────────────────────────────────────────
const sendInterviewReminderEmail = async ({ to, name, interviews }) => {
  const dashboardUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/dashboard` : 'http://localhost:5173/dashboard';
  const firstName = name.split(' ')[0];

  const interviewRows = interviews.map(inv => {
    const time = new Date(inv.scheduledAt).toLocaleString();
    return `
      <tr>
        <td style="padding:12px 16px; border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:700; font-size:15px; color:#111827; margin-bottom:2px;">${inv.application.company}</div>
          <div style="font-size:13px; color:#6b7280; margin-bottom:4px;">${inv.application.role}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            <span style="font-size:12px; color:#6b7280;">Type: <strong>${inv.interviewType}</strong></span>
            <span style="padding:2px 10px; background:#e0e7ff; border:1px solid #c7d2fe; border-radius:999px; font-size:12px; font-weight:700; color:#4338ca;">
              ${time}
            </span>
          </div>
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Interview Reminder — JobPulse</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#818cf8 100%);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">Job<span style="opacity:0.85;">Pulse</span></span>
          </td>
        </tr>
        <tr>
          <td style="background:#eef2ff;border-bottom:2px solid #c7d2fe;padding:16px 40px;text-align:center;">
            <span style="font-size:22px;">🎙️</span>
            <span style="font-size:14px;font-weight:700;color:#3730a3;margin-left:8px;">
              You have ${interviews.length} interview${interviews.length !== 1 ? 's' : ''} coming up soon
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Good luck, ${firstName}! 🌟</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">You have interviews scheduled in the next 48 hours. Take a deep breath and review your notes.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              ${interviewRows}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:4px 0 8px;">
                <a href="${dashboardUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#4f46e5,#818cf8);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Review My Notes →</a>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || 'JobPulse <onboarding@resend.dev>',
    to: [to],
    subject: `🎙️ Upcoming Interview for ${interviews[0].application.company} — JobPulse`,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
};

// ── Send welcome email ────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ to, name }) => {
  const firstName = name.split(' ')[0];
  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#06b6d4 100%);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">Job<span style="opacity:0.85;">Pulse</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Welcome to JobPulse, ${firstName}! 🎉</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">Your smart job search tracker is ready. Log your first application, set up your resume for AI matching, and let's get you hired.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_xxxxxxxxxxxxxxxxxxxx') return;
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'JobPulse <onboarding@resend.dev>',
      to: [to],
      subject: `🎉 Welcome to JobPulse!`,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Welcome email failed:', err.message);
  }
};

// ── Send offer email ──────────────────────────────────────────────────────────
const sendOfferEmail = async ({ to, name, company }) => {
  const firstName = name.split(' ')[0];
  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;">Job<span style="opacity:0.85;">Pulse</span></span>
          </td>
        </tr>
        <tr>
          <td style="background:#d1fae5;border-bottom:2px solid #a7f3d0;padding:16px 40px;text-align:center;">
            <span style="font-size:22px;">🥳</span>
            <span style="font-size:14px;font-weight:700;color:#065f46;margin-left:8px;">You got an offer!</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Congratulations, ${firstName}! 🎉</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">You just marked your application at <strong>${company}</strong> as an Offer. We are incredibly proud of your hard work!</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_xxxxxxxxxxxxxxxxxxxx') return;
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'JobPulse <onboarding@resend.dev>',
      to: [to],
      subject: `🎉 Congratulations on your offer from ${company}! — JobPulse`,
      html,
    });
  } catch (err) {
    console.error('[EmailService] Offer email failed:', err.message);
  }
};

module.exports = { sendFollowUpEmail, sendDeadlineReminderEmail, sendInterviewReminderEmail, sendWelcomeEmail, sendOfferEmail };
