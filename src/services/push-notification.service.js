const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');
const logger = require('../config/logger');

/**
 * Thin wrapper around Firebase Admin's Cloud Messaging API. Lazily
 * initialized so the app boots fine even when push isn't configured yet
 * (e.g. local dev without a service account) — in that case sends are
 * silently skipped rather than throwing.
 */
class PushNotificationService {
  constructor({ serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH } = {}) {
    this.serviceAccountPath = serviceAccountPath;
    this.messaging = null;
    this.initAttempted = false;
  }

  isConfigured() {
    return Boolean(this.serviceAccountPath && fs.existsSync(path.resolve(this.serviceAccountPath)));
  }

  _getMessaging() {
    if (this.messaging || this.initAttempted) {
      return this.messaging;
    }
    this.initAttempted = true;

    if (!this.isConfigured()) {
      logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH is not set (or the file is missing) — push notifications are disabled.',
      );
      return null;
    }

    try {
      const admin = require('firebase-admin');
      const serviceAccount = require(path.resolve(this.serviceAccountPath));
      const app = admin.apps.length
        ? admin.app()
        : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      this.messaging = admin.messaging(app);
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK for push notifications.', {
        error: error.message,
      });
      this.messaging = null;
    }

    return this.messaging;
  }

  /**
   * Sends a single push notification. Never throws — a delivery failure
   * (invalid/stale token, network blip, misconfiguration) is logged and
   * swallowed so it can never break the reservation/order flow that
   * triggered it.
   */
  async send({ token, title, body, data = {} }) {
    if (!token) {
      logger.info('Push notification skipped — no device token on record.', { title });
      return { skipped: true, reason: 'no-token' };
    }

    const messaging = this._getMessaging();
    if (!messaging) {
      logger.info('Push notification skipped — Firebase Admin not configured.', { title });
      return { skipped: true, reason: 'not-configured' };
    }

    try {
      const messageId = await messaging.send({
        token,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
      });
      logger.info('Push notification sent successfully.', {
        messageId,
        title,
        tokenPrefix: token.slice(0, 12),
      });
      return { skipped: false, messageId };
    } catch (error) {
      logger.error('Failed to send push notification.', {
        error: error.message,
        code: error.code,
        title,
        tokenPrefix: token.slice(0, 12),
      });
      return { skipped: true, reason: 'send-error', error: error.message };
    }
  }
}

module.exports = { PushNotificationService };
