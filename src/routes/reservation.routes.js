const { Router } = require('express');
const { reservationController } = require('../controllers/reservation.controller');
const {
  validateBody,
  validateParams,
  validateQuery,
} = require('../validators/validate-request.middleware');
const {
  createReservationSchema,
  reservationIdSchema,
  lookupReservationSchema,
  cancellationParamsSchema,
  cancelReservationSchema,
  updateReservationStatusSchema,
  listReservationsQuerySchema,
} = require('../validators/reservation.validator');

const reservationRouter = Router();

/**
 * @openapi
 * /reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Create a restaurant reservation
 *     description: Creates a pending reservation from the mobile application.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [firstName, lastName, email, phone, reservationDate, reservationTime, guestCount, deviceId, os]
 *             properties:
 *               firstName: { type: string, example: Aisha }
 *               lastName: { type: string, example: Khan }
 *               email: { type: string, format: email, example: aisha@example.com }
 *               phone: { type: string, example: '+923001234567' }
 *               reservationDate: { type: string, format: date, example: '2026-08-08' }
 *               reservationTime: { type: string, example: '20:00' }
 *               guestCount: { type: integer, minimum: 1, maximum: 20, example: 4 }
 *               specialRequest: { type: string, maxLength: 5000, example: Window table if available }
 *               deviceId: { type: string, example: A1B2C3D4E5 }
 *               os: { type: string, enum: [android, ios, web], example: android }
 *     responses:
 *       201:
 *         description: Reservation created successfully.
 *       422:
 *         description: Validation failed.
 *       500:
 *         description: Unexpected server error.
 */
reservationRouter.post('/', validateBody(createReservationSchema), reservationController.create);

/**
 * @openapi
 * /reservations/lookup:
 *   post:
 *     tags: [Reservations]
 *     summary: Securely look up a reservation by confirmation code and guest email
 *     description: Returns a reservation only when the confirmation code and guest email match, preventing enumeration by confirmation code alone.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [confirmationCode, guestEmail]
 *             properties:
 *               confirmationCode: { type: string, example: ON-AB12CD34 }
 *               guestEmail: { type: string, format: email, example: aisha@example.com }
 *     responses:
 *       200:
 *         description: Reservation retrieved successfully.
 *       404:
 *         description: No reservation matches the confirmation code and email pair.
 *       422:
 *         description: Validation failed.
 */
reservationRouter.post(
  '/lookup',
  validateBody(lookupReservationSchema),
  reservationController.lookup,
);

/**
 * @openapi
 * /reservations/{confirmationCode}/cancellation:
 *   post:
 *     tags: [Reservations]
 *     summary: Cancel a reservation by confirmation code
 *     description: Cancels a PENDING or CONFIRMED reservation when the confirmation code and guest email match.
 *     parameters:
 *       - in: path
 *         name: confirmationCode
 *         required: true
 *         schema: { type: string, example: ON-AB12CD34 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [guestEmail]
 *             properties:
 *               guestEmail: { type: string, format: email, example: aisha@example.com }
 *               reason: { type: string, maxLength: 500, example: Travel change }
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully.
 *       404:
 *         description: No reservation matches the confirmation code and email pair.
 *       409:
 *         description: Reservation is no longer cancellable.
 *       422:
 *         description: Validation failed.
 */
reservationRouter.post(
  '/:confirmationCode/cancellation',
  validateParams(cancellationParamsSchema),
  validateBody(cancelReservationSchema),
  reservationController.cancel,
);

/**
 * @openapi
 * /reservations/{id}:
 *   get:
 *     tags: [Reservations]
 *     summary: Get a reservation by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: '1' }
 *     responses:
 *       200: { description: Reservation retrieved successfully. }
 *       404: { description: Reservation not found. }
 */
reservationRouter.get('/:id', validateParams(reservationIdSchema), reservationController.getById);

const adminReservationRouter = Router();

/**
 * @openapi
 * /admin/reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: List reservations for administration
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
 *         schema: { type: string, enum: [PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW] }
 *       - in: query
 *         name: reservationDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         description: Matched against guest name, email, phone, and confirmation code.
 *         schema: { type: string, maxLength: 191, example: aisha }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [reservationDate, createdAt, guestName], default: reservationDate }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200: { description: Reservations retrieved successfully. }
 *       401: { description: 'Authentication required, or session expired/invalid.' }
 */
adminReservationRouter.get(
  '/',
  validateQuery(listReservationsQuerySchema),
  reservationController.list,
);

/**
 * @openapi
 * /admin/reservations/stats:
 *   get:
 *     tags: [Reservations]
 *     summary: Get reservation counts for the admin dashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Reservation statistics retrieved successfully.
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
 *                     total: { type: integer, example: 128 }
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         PENDING: { type: integer }
 *                         CONFIRMED: { type: integer }
 *                         SEATED: { type: integer }
 *                         COMPLETED: { type: integer }
 *                         CANCELLED: { type: integer }
 *                         NO_SHOW: { type: integer }
 *                     today: { type: integer, example: 6 }
 *                     upcoming: { type: integer, example: 41 }
 *       401: { description: 'Authentication required, or session expired/invalid.' }
 */
adminReservationRouter.get('/stats', reservationController.stats);

/**
 * @openapi
 * /admin/reservations/{id}/status:
 *   patch:
 *     tags: [Reservations]
 *     summary: Update a reservation lifecycle status
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
 *               status: { type: string, enum: [PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW] }
 *               cancellationNote: { type: string, maxLength: 500 }
 *     responses:
 *       200: { description: Reservation status updated successfully. }
 *       401: { description: 'Authentication required, or session expired/invalid.' }
 *       404: { description: Reservation not found. }
 *       409: { description: Invalid lifecycle transition. }
 */
adminReservationRouter.patch(
  '/:id/status',
  validateParams(reservationIdSchema),
  validateBody(updateReservationStatusSchema),
  reservationController.updateStatus,
);

module.exports = { reservationRouter, adminReservationRouter };
