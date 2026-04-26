const logger = require("../../common/logger");
const nodemailer = require("nodemailer");
const env = require("../../config/env");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: false,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (env.EMAIL_MODE === "smtp" && env.SMTP_HOST) {
    const sender = env.SMTP_FROM || env.SMTP_USER || "no-reply@pink.local";
    await getTransporter().sendMail({
      from: sender,
      to,
      subject,
      html,
    });
    logger.info({ to, subject }, "SMTP email notification sent");
    return;
  }

  // Dev-friendly mode (Mailtrap/mock) to avoid external SMTP dependency.
  logger.info({ to, subject, htmlLength: html?.length || 0 }, "Mock email notification sent");
}

module.exports = {
  sendEmail,
};
