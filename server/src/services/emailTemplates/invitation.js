const { getBaseHtml } = require('./baseTemplate');

const invitationTemplate = (name, role, inviterName, institutionName, loginUrl) => {
  let context = '';
  
  if (role === 'INSTITUTION_ADMIN') {
    context = `You have been invited to manage <strong>${institutionName}</strong> on JobPulse.`;
  } else if (role === 'PLACEMENT_OFFICER') {
    context = `You have been added as a Placement Officer for <strong>${institutionName}</strong> by ${inviterName}.`;
  } else if (role === 'MENTOR') {
    context = `You have been added as a Mentor under ${inviterName} at <strong>${institutionName}</strong>.`;
  } else {
    context = `You have been invited to join JobPulse by ${inviterName}.`;
  }

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">You've been invited!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${name.split(' ')[0]},<br><br>
      ${context}<br><br>
      Click the button below to log in and set up your account.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${loginUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Log In to JobPulse →</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;padding-top:24px;border-top:1px solid #e5e7eb;">
      If you did not expect this invitation, you can safely ignore this email.
    </p>
  `;
  return getBaseHtml('JobPulse Invitation', content);
};

module.exports = { invitationTemplate };
