const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const { env } = require('./config/env');
const { apiRouter } = require('./routes');
const { swaggerSpec } = require('./swagger/openapi');
const { requestLogger } = require('./middlewares/request-logger.middleware');
const { notFoundHandler } = require('./middlewares/not-found.middleware');
const { errorHandler } = require('./middlewares/error-handler.middleware');
const { webhookController } = require('./controllers/webhook.controller');

const app = express();

const allowedOrigins =
  env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: allowedOrigins !== true }));
app.use(compression());
app.use(requestLogger);

/**
 * @openapi
 * /webhooks/stripe:
 *   post:
 *     tags: [Orders]
 *     summary: Stripe webhook receiver (Stripe-signed only)
 *     description: Registered before the JSON body parser because Stripe's signature verification needs the raw request body. Not for direct client use.
 *     responses:
 *       200: { description: Event acknowledged. }
 *       400: { description: Invalid or missing Stripe signature. }
 */
app.post(
  `${env.API_PREFIX}/webhooks/stripe`,
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook,
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// helmet()'s default CSP blocks the inline script Swagger UI's HTML relies on
// to boot itself, which renders as a blank page rather than an error. Drop
// the CSP header for just this route rather than weakening it globally.
app.use(
  '/api-docs',
  (req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true }),
);
// Uploaded gallery images, served outside API_PREFIX so the stored imageUrl
// stays stable regardless of API versioning. helmet()'s default
// Cross-Origin-Resource-Policy: same-origin would otherwise let browsers
// (the future Admin Panel, on a different origin) silently fail to render
// these — same idea as the Swagger CSP override above.
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(env.uploadPath),
);

app.use(env.API_PREFIX, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
