import nodemailer from 'nodemailer';

import { env } from '../config/env.js';
import AppError from '../utils/app-error.js';

let transporter;

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character],
  );

const getTransporter = () => {
  if (!env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
};

export const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const mailer = getTransporter();
  if (!mailer) {
    if (env.NODE_ENV === 'production') throw new AppError('Email delivery is not configured.', 503);
    console.log(`Password reset URL for ${email}: ${resetUrl}`);
    return;
  }

  await mailer.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Reset your IndigoMart password',
    text: `Hello ${name},\n\nReset your password using this link: ${resetUrl}\n\nThis link expires in 15 minutes.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Use the link below to reset your IndigoMart password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
};
