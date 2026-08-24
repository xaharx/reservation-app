const { Router } = require('express');
const { healthRouter } = require('./health.routes');
const { reservationRouter, adminReservationRouter } = require('./reservation.routes');
const { cmsRouter } = require('./cms.routes');
const { menuRouter } = require('./menu.routes');
const { orderRouter, adminOrderRouter } = require('./order.routes');
const { deviceRouter } = require('./device.routes');
const { authRouter } = require('./auth.routes');
const { adminCmsRouter } = require('./admin-cms.routes');
const { authenticate } = require('../middlewares/authenticate.middleware');

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/reservations', reservationRouter);
apiRouter.use('/admin/auth', authRouter);
// Every /admin/* route below this line requires a valid admin session —
// these were previously unauthenticated, callable by anyone who knew the URL.
apiRouter.use('/admin/reservations', authenticate, adminReservationRouter);
apiRouter.use('/menu', menuRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/admin/orders', authenticate, adminOrderRouter);
apiRouter.use('/devices', deviceRouter);
// adminCmsRouter applies its own authenticate() internally (see
// admin-cms.routes.js) rather than here, since it covers many sub-paths.
apiRouter.use('/admin', adminCmsRouter);
apiRouter.use('/', cmsRouter);

// Note: POST /webhooks/stripe is registered directly on the Express app in
// app.js (before the global express.json() body parser), because Stripe's
// signature verification needs the raw, unparsed request body.

module.exports = { apiRouter };
