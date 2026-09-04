const fs = require('fs');
const path = 'c:/Tejas Data/FINAL PROJECT/JobPulse/server/src/services/emailService.js';
let content = fs.readFileSync(path, 'utf8');

const imports = `const nodemailer = require('nodemailer');
const SystemSettings = require('../models/SystemSettings');\n`;

const helper = `
const sendEmail = async (payload) => {
  try {
    let settings = null;
    try {
      settings = await SystemSettings.findOne();
    } catch (e) {
      console.warn('SystemSettings not ready:', e.message);
    }

    if (settings && settings.useCustomSmtp && settings.smtpHost) {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: \`"\${settings.smtpFromName || 'JobPulse'}" <\${settings.smtpFromEmail || settings.smtpUser}>\`,
        to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return { data: { id: info.messageId }, error: null };
    } else {
      return await resend.emails.send(payload);
    }
  } catch (error) {
    console.error('[EmailService] Dispatch failed:', error.message);
    return { data: null, error };
  }
};\n`;

content = content.replace("const resend = new Resend(process.env.RESEND_API_KEY);", imports + "const resend = new Resend(process.env.RESEND_API_KEY);\n" + helper);
content = content.replace(/resend\.emails\.send/g, 'sendEmail');

fs.writeFileSync(path, content);
console.log('Updated emailService.js');
