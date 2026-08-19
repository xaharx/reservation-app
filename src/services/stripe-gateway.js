const { env } = require('../config/env');

/**
 * Thin wrapper around the Stripe SDK so OrderService can be unit-tested with
 * a fake gateway (see tests/order.service.test.js) instead of hitting
 * Stripe's API. Uses Stripe Checkout (a hosted payment page) rather than the
 * native Stripe SDK, so the mobile app only needs to open a URL — no native
 * module, no Expo dev-client rebuild.
 */
class StripeGateway {
  constructor({ secretKey = env.STRIPE_SECRET_KEY } = {}) {
    this.secretKey = secretKey;
    this._client = null;
  }

  get client() {
    if (!this.secretKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured. Add it to .env (see https://dashboard.stripe.com/test/apikeys).',
      );
    }
    if (!this._client) {
      // Lazily required so a missing/unconfigured key never breaks server boot.
      const Stripe = require('stripe');
      this._client = new Stripe(this.secretKey);
    }
    return this._client;
  }

  async createCheckoutSession({ confirmationCode, currency, lineItems, customerEmail, successUrl, cancelUrl }) {
    const session = await this.client.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: confirmationCode,
      line_items: lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: item.unitCents,
          product_data: { name: item.name },
        },
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { confirmationCode },
    });

    return { id: session.id, url: session.url };
  }

  async refundPayment({ paymentIntentId, amountCents }) {
    return this.client.refunds.create({
      payment_intent: paymentIntentId,
      ...(amountCents && { amount: amountCents }),
    });
  }

  /**
   * Verifies and parses a raw webhook payload using the Stripe signature
   * header. Throws if the signature is invalid.
   */
  constructWebhookEvent(rawBody, signatureHeader) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
    }
    return this.client.webhooks.constructEvent(rawBody, signatureHeader, env.STRIPE_WEBHOOK_SECRET);
  }
}

module.exports = { StripeGateway };
