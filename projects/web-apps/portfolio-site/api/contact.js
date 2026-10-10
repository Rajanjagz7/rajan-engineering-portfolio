// Vercel serverless function - handles POST /api/contact from the portfolio's
// "Send a Direct Message" form and emails the submission to Rajan's own inbox
// via Gmail SMTP (nodemailer), authenticated with a Gmail App Password.
//
// Required environment variables (set in Vercel: Settings -> Environment Variables,
// and locally in .env.local for `vercel dev`):
//   CONTACT_EMAIL_USER          - the sending Gmail address (rajanjagz7@gmail.com)
//   CONTACT_EMAIL_APP_PASSWORD  - a 16-character Gmail App Password (not the login password)
//   CONTACT_EMAIL_TO            - optional; defaults to CONTACT_EMAIL_USER if unset

import nodemailer from 'nodemailer';

const MAX_LEN = { name: 100, email: 200, message: 5000 };

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Very small in-memory rate limit per function instance: blocks obvious spam
// bursts without needing an external store. Not a substitute for a real
// rate limiter, but cheap insurance for a low-traffic personal contact form.
const recentSubmissions = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (recentSubmissions.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  recentSubmissions.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ success: false, error: 'Too many submissions - please try again in a minute.' });
  }

  const { name, email, message, website } = req.body || {};

  // Honeypot: a real visitor never fills a field named "website" (hidden in the form).
  if (website) {
    return res.status(200).json({ success: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email and message are all required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
  }
  if (name.length > MAX_LEN.name || email.length > MAX_LEN.email || message.length > MAX_LEN.message) {
    return res.status(400).json({ success: false, error: 'One of the fields is too long.' });
  }

  const user = process.env.CONTACT_EMAIL_USER;
  const pass = process.env.CONTACT_EMAIL_APP_PASSWORD;
  const to = process.env.CONTACT_EMAIL_TO || user;

  if (!user || !pass) {
    console.error('Contact form: CONTACT_EMAIL_USER / CONTACT_EMAIL_APP_PASSWORD are not set.');
    return res.status(500).json({ success: false, error: 'Email is not configured on the server yet.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Portfolio Contact Form" <${user}>`,
      to,
      replyTo: `"${name}" <${email}>`,
      subject: `New portfolio message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form send failed:', err);
    return res.status(500).json({ success: false, error: 'Could not send the message. Please try again later.' });
  }
}
