const logger = require('../config/logger');
const { HTTP_STATUS } = require('../constants/http-status');
const { OrderService } = require('../services/order.service');
const { StripeGateway } = require('../services/stripe-gateway');

function createWebhookController({
  orderService = new OrderService(),
  stripeGateway = new StripeGateway(),
} = {}) {
  return {
    handleStripeWebhook: async (req, res) => {
      const signatureHeader = req.headers['stripe-signature'];

      let event;
      try {
        // req.body is a raw Buffer here — see app.js, where express.raw() is
        // used for this route instead of the global express.json() parser.
        event = stripeGateway.constructWebhookEvent(req.body, signatureHeader);
      } catch (error) {
        logger.warn('Rejected Stripe webhook with invalid signature.', {
          error: error.message,
        });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid webhook signature.',
        });
      }

      try {
        if (event.type === 'checkout.session.completed') {
          await orderService.handleCheckoutCompleted(event.data.object);
        }
      } catch (error) {
        logger.error('Failed to process Stripe webhook event.', {
          eventType: event.type,
          error: error.message,
        });
        // Still acknowledge receipt — Stripe retries on non-2xx, and a
        // processing bug shouldn't cause unbounded retries against our API.
      }

      return res.status(HTTP_STATUS.OK).json({ received: true });
    },
  };
}

const webhookController = createWebhookController();

module.exports = { createWebhookController, webhookController };
