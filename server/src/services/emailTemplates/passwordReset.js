const { getBaseHtml } = require('./baseTemplate');

const passwordResetTemplate = (name, resetUrl) => {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">Reset Your Password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${name.split(' ')[0]},<br><br>
      You recently requested to reset your password for your JobPulse account. Click the button below to reset it. 
      This password reset is only valid for the next 10 minutes.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Reset Password →</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;padding-top:24px;border-top:1px solid #e5e7eb;">
      If you did not request a password reset, please ignore this email or contact support if you have concerns.
    </p>
  `;
  return getBaseHtml('Reset Your JobPulse Password', content);
};

module.exports = { passwordResetTemplate };
