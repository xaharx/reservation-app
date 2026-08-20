const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const logger = require('../config/logger');

/**
 * Thin wrapper around nodemailer/SMTP. Lazily creates the transporter so
 * the app boots fine even when SMTP isn't configured yet (local dev) — in
 * that case sends are silently skipped rather than throwing.
 */
class EmailService {
  constructor({
    host = env.SMTP_HOST,
    port = env.SMTP_PORT,
    secure = env.SMTP_SECURE,
    user = env.SMTP_USER,
    password = env.SMTP_PASSWORD,
    fromName = env.EMAIL_FROM_NAME,
  } = {}) {
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.user = user;
    this.password = password;
    this.fromName = fromName;
    this.transporter = null;
  }

  isConfigured() {
    return Boolean(this.user && this.password);
  }

  _getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    if (!this.isConfigured()) {
      logger.warn('SMTP_USER/SMTP_PASSWORD are not set — outgoing email is disabled.');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure, // false for STARTTLS on 587, true for implicit TLS on 465
      auth: { user: this.user, pass: this.password },
    });

    return this.transporter;
  }

  /**
   * Sends a single email. Never throws — a delivery failure is logged and
   * swallowed so it can never break the reservation/order flow that
   * triggered it.
   */
  async send({ to, subject, html, text }) {
    if (!to) {
      return { skipped: true, reason: 'no-recipient' };
    }

    const transporter = this._getTransporter();
    if (!transporter) {
      return { skipped: true, reason: 'not-configured' };
    }

    try {
      const info = await transporter.sendMail({
        from: `"${this.fromName}" <${this.user}>`,
        to,
        subject,
        text,
        html,
      });
      return { skipped: false, messageId: info.messageId };
    } catch (error) {
      logger.error('Failed to send email.', { error: error.message, to, subject });
      return { skipped: true, reason: 'send-error', error: error.message };
    }
  }
}

module.exports = { EmailService };
