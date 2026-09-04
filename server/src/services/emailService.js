const { Resend } = require('resend');
const { passwordResetTemplate } = require('./emailTemplates/passwordReset');
const { emailVerificationTemplate } = require('./emailTemplates/emailVerification');
const { welcomeTemplate } = require('./emailTemplates/welcome');
const { invitationTemplate } = require('./emailTemplates/invitation');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EmailService] RESEND_API_KEY not configured. Email not sent:', subject);
      return { data: null, error: new Error('RESEND_API_KEY not configured') };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'JobPulse <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('[EmailService] Resend API Error:', error.message);
      return { data: null, error };
    }
    
    console.log(`[EmailService] Email sent successfully to ${to} (id: ${data?.id})`);
    return { data, error: null };
  } catch (error) {
    console.error('[EmailService] Dispatch failed:', error.message);
    return { data: null, error };
  }
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  return await sendEmail({
    to,
    subject: 'Reset your JobPulse password',
    html: passwordResetTemplate(name, resetUrl),
  });
};

const sendEmailVerification = async ({ to, name, verifyUrl }) => {
  return await sendEmail({
    to,
    subject: 'Verify your JobPulse email',
    html: emailVerificationTemplate(name, verifyUrl),
  });
};

const sendWelcomeEmail = async ({ to, name, role, institutionName }) => {
  const loginUrl = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/login`
    : 'http://localhost:5173/login';

  return await sendEmail({
    to,
    subject: 'Welcome to JobPulse!',
    html: welcomeTemplate(name, role, institutionName, loginUrl),
  });
};

const sendInvitationEmail = async ({ to, name, role, inviterName, institutionName }) => {
  const loginUrl = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/login`
    : 'http://localhost:5173/login';

  let subject = 'You have been invited to JobPulse';
  if (role === 'INSTITUTION_ADMIN') subject = `You have been invited to manage ${institutionName}`;
  if (role === 'PLACEMENT_OFFICER') subject = `You have been added as a Placement Officer for ${institutionName}`;
  if (role === 'MENTOR') subject = `You have been added as a Mentor at ${institutionName}`;

  return await sendEmail({
    to,
    subject,
    html: invitationTemplate(name, role, inviterName, institutionName, loginUrl),
  });
};

const sendTestEmail = async ({ to, name }) => {
  return await sendEmail({
    to,
    subject: 'JobPulse Email Test',
    html: `<h1>Test Successful</h1><p>Hi ${name}, your Resend email integration is working perfectly!</p>`,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendWelcomeEmail,
  sendInvitationEmail,
  sendTestEmail
};
