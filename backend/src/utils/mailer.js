const nodemailer = require("nodemailer");

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 25);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

  if (!host) {
    throw new Error("SMTP_HOST manquant");
  }

  const auth = user ? { user, pass } : undefined;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
  });

  return cachedTransporter;
}

async function sendMail({ to, subject, html, text, from, replyTo, attachments }) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
    replyTo,
    attachments,
  });
}

module.exports = { sendMail };
