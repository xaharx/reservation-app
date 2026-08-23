const { Router } = require('express');
const { healthRouter } = require('./health.routes');
const { reservationRouter, adminReservationRouter } = require('./reservation.routes');
const { cmsRouter } = require('./cms.routes');
const { menuRouter } = require('./menu.routes');
const { orderRouter } = require('./order.routes');
const { deviceRouter } = require('./device.routes');

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/reservations', reservationRouter);
apiRouter.use('/admin/reservations', adminReservationRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/devices', deviceRouter);
apiRouter.use('/', cmsRouter);

// Note: POST /webhooks/stripe is registered directly on the Express app in
// app.js (before the global express.json() body parser), because Stripe's
// signature verification needs the raw, unparsed request body.

module.exports = { apiRouter };
