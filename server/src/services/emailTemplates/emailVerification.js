const { getBaseHtml } = require('./baseTemplate');

const emailVerificationTemplate = (name, verifyUrl) => {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">Verify Your Email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${name.split(' ')[0]},<br><br>
      Welcome to JobPulse! Please confirm your email address by clicking the button below. 
      This link will expire in 24 hours.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Verify Email →</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;padding-top:24px;border-top:1px solid #e5e7eb;">
      If you did not create an account, you can safely ignore this email.
    </p>
  `;
  return getBaseHtml('Verify Your JobPulse Email', content);
};

module.exports = { emailVerificationTemplate };
