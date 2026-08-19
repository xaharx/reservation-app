const { Router } = require('express');
const { orderController } = require('../controllers/order.controller');
const { validateBody, validateParams } = require('../validators/validate-request.middleware');
const {
  createOrderSchema,
  lookupOrderSchema,
  orderCancellationParamsSchema,
  cancelOrderSchema,
} = require('../validators/order.validator');

const orderRouter = Router();

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an order and start checkout
 *     description: Creates a PENDING_PAYMENT order from the mobile cart and returns a Stripe Checkout URL to complete payment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [firstName, lastName, email, phone, items]
 *             properties:
 *               firstName: { type: string, example: Aisha }
 *               lastName: { type: string, example: Khan }
 *               email: { type: string, format: email, example: aisha@example.com }
 *               phone: { type: string, example: '+923001234567' }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [menuItemId, quantity]
 *                   properties:
 *                     menuItemId: { type: string, example: '3' }
 *                     quantity: { type: integer, minimum: 1, maximum: 20, example: 2 }
 *                     notes: { type: string, maxLength: 255 }
 *               notes: { type: string, maxLength: 500 }
 *               deviceId: { type: string }
 *               os: { type: string, enum: [android, ios, web] }
 *     responses:
 *       201:
 *         description: Order created; data.checkoutUrl is a Stripe-hosted payment page.
 *       422:
 *         description: Validation failed, or an item is unavailable.
 */
orderRouter.post('/', validateBody(createOrderSchema), orderController.create);

/**
 * @openapi
 * /orders/lookup:
 *   post:
 *     tags: [Orders]
 *     summary: Securely look up an order by confirmation code and guest email
 *     responses:
 *       200: { description: Order retrieved successfully. }
 *       404: { description: No order matches the confirmation code and email pair. }
 */
orderRouter.post('/lookup', validateBody(lookupOrderSchema), orderController.lookup);

/**
 * @openapi
 * /orders/{confirmationCode}/cancellation:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order by confirmation code
 *     description: Cancels a PENDING_PAYMENT, PAID, or PREPARING order and refunds payment via Stripe if it was already paid.
 *     parameters:
 *       - in: path
 *         name: confirmationCode
 *         required: true
 *         schema: { type: string, example: OD-AB12CD34 }
 *     responses:
 *       200: { description: Order cancelled successfully. }
 *       404: { description: No order matches the confirmation code and email pair. }
 *       409: { description: Order is no longer cancellable. }
 */
orderRouter.post(
  '/:confirmationCode/cancellation',
  validateParams(orderCancellationParamsSchema),
  validateBody(cancelOrderSchema),
  orderController.cancel,
);

module.exports = { orderRouter };
