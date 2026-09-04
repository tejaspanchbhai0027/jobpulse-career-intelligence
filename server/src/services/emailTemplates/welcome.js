const { getBaseHtml } = require('./baseTemplate');

const welcomeTemplate = (name, role = 'STUDENT', institutionName, loginUrl) => {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">Welcome to JobPulse!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${name.split(' ')[0]},<br><br>
      We are thrilled to have you on board! JobPulse is designed to help you streamline your career intelligence and job search process.
      ${role !== 'STUDENT' ? `You have been registered as a <strong>${role.replace('_', ' ')}</strong>${institutionName ? ` for <strong>${institutionName}</strong>` : ''}.` : ''}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${loginUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Log In to JobPulse →</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;padding-top:24px;border-top:1px solid #e5e7eb;">
      If you need any help, check out our support center or reply directly to this email.
    </p>
  `;
  return getBaseHtml('Welcome to JobPulse', content);
};

module.exports = { welcomeTemplate };
