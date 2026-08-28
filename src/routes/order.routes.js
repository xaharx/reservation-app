const { Router } = require('express');
const { orderController } = require('../controllers/order.controller');
const {
  validateBody,
  validateParams,
  validateQuery,
} = require('../validators/validate-request.middleware');
const {
  createOrderSchema,
  lookupOrderSchema,
  orderCancellationParamsSchema,
  cancelOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} = require('../validators/order.validator');
const { bigIntIdParamSchema } = require('../validators/id-param.validator');

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
 *             required: [firstName, lastName, email, phone, items, deliveryAddress]
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
 *               deliveryAddress:
 *                 type: object
 *                 description: Snapshot of where to deliver this order. Stored on the order itself, so it's unaffected by any address the guest enters on a later order.
 *                 additionalProperties: false
 *                 required: [addressLine1, city, postalCode, country]
 *                 properties:
 *                   addressLine1: { type: string, maxLength: 255, example: '123 Main Street' }
 *                   addressLine2: { type: string, maxLength: 255, example: 'Apartment 4B' }
 *                   city: { type: string, maxLength: 100, example: Miami }
 *                   state: { type: string, maxLength: 100, example: Florida }
 *                   postalCode: { type: string, maxLength: 24, example: '33101' }
 *                   country: { type: string, maxLength: 100, example: USA }
 *               notes: { type: string, maxLength: 500 }
 *               deviceId: { type: string }
 *               os: { type: string, enum: [android, ios, web] }
 *     responses:
 *       201:
 *         description: Order created; data.order.deliveryAddress echoes the address just submitted; data.checkoutUrl is a Stripe-hosted payment page.
 *       422:
 *         description: Validation failed (including a missing/invalid deliveryAddress field), or an item is unavailable.
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

const orderIdParamSchema = bigIntIdParamSchema('id');
const adminOrderRouter = Router();

/**
 * @openapi
 * /admin/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders for administration
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING_PAYMENT, PAID, PREPARING, READY, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: search
 *         description: "Matched against guest name, email, phone, and confirmation code."
 *         schema: { type: string, maxLength: 191, example: aisha }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, guestName], default: createdAt }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200: { description: Orders retrieved successfully. }
 *       401: { description: "Authentication required, or session expired/invalid." }
 */
adminOrderRouter.get('/', validateQuery(listOrdersQuerySchema), orderController.list);

/**
 * @openapi
 * /admin/orders/stats:
 *   get:
 *     tags: [Orders]
 *     summary: Get order counts and revenue for the admin dashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, example: 84 }
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         PENDING_PAYMENT: { type: integer }
 *                         PAID: { type: integer }
 *                         PREPARING: { type: integer }
 *                         READY: { type: integer }
 *                         COMPLETED: { type: integer }
 *                         CANCELLED: { type: integer }
 *                     today: { type: integer, example: 5 }
 *                     revenueCents: { type: integer, example: 452300, description: "Sum of totalCents across orders whose payment succeeded (excludes refunded/unpaid)." }
 *       401: { description: "Authentication required, or session expired/invalid." }
 */
adminOrderRouter.get('/stats', orderController.stats);

/**
 * @openapi
 * /admin/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by ID for administration
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: '1' }
 *     responses:
 *       200: { description: Order retrieved successfully. }
 *       401: { description: "Authentication required, or session expired/invalid." }
 *       404: { description: Order not found. }
 */
adminOrderRouter.get('/:id', validateParams(orderIdParamSchema), orderController.getById);

/**
 * @openapi
 * /admin/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update an order's fulfillment status
 *     description: "Staff-driven lifecycle moves (PAID -> PREPARING -> READY -> COMPLETED, or cancel). PAID itself is set only by the Stripe webhook, never manually. Cancelling refunds via Stripe automatically if the order was already paid."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: '1' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PENDING_PAYMENT, PAID, PREPARING, READY, COMPLETED, CANCELLED] }
 *               cancellationNote: { type: string, maxLength: 500 }
 *     responses:
 *       200: { description: Order status updated successfully. }
 *       401: { description: "Authentication required, or session expired/invalid." }
 *       404: { description: Order not found. }
 *       409: { description: Invalid lifecycle transition. }
 */
adminOrderRouter.patch(
  '/:id/status',
  validateParams(orderIdParamSchema),
  validateBody(updateOrderStatusSchema),
  orderController.updateStatus,
);

module.exports = { orderRouter, adminOrderRouter };
