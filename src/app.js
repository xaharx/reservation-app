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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use(env.API_PREFIX, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
