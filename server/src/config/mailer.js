import { Resend } from 'resend';
import { config } from './env.js';

let _resend = null;

const getResendClient = () => {
  if (!_resend) {
    _resend = new Resend(config.resendApiKey);
  }
  return _resend;
};

export const sendMail = async ({ to, subject, html }) => {
  // ── DEV MODE: no API key configured ─────────────────────────────────────────
  if (!config.resendApiKey || config.resendApiKey === 're_placeholder') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Password reset email is not configured. Set RESEND_API_KEY and a verified MAIL_FROM address.');
    }
    console.log('\n========== [DEV] EMAIL NOT SENT — RESEND_API_KEY NOT SET ==========');
    console.log(`TO      : ${to}`);
    console.log(`SUBJECT : ${subject}`);
    console.log(`BODY    :\n${html.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim()}`);
    console.log('====================================================================\n');
    return { id: 'dev-mock', devMode: true };
  }

  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: config.mail.from,
    to,
    subject,
    html
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  return data;
};
