const path = require('path');
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
app.use(
  helmet({
    // helmet's default CSP includes `upgrade-insecure-requests`, which tells
    // the browser to silently rewrite the page's own subresource requests
    // (scripts, styles, favicon) to https. This server is plain HTTP only
    // (no TLS on this port) — with the directive on, browsers upgrade the
    // Admin Panel's JS/CSS/favicon requests to https, get no TLS listener,
    // and fail with ERR_SSL_PROTOCOL_ERROR instead of loading over http.
    // Drop just that directive; add TLS in front (e.g. nginx) before
    // re-enabling it.
    contentSecurityPolicy: {
      useDefaults: true,
      directives: { upgradeInsecureRequests: null },
    },
  }),
);
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

// Admin Panel (React/Vite SPA), served under /admin so it shares the API's
// origin — no CORS_ORIGIN entry needed for it. Build it first with
// `cd admin-panel && npm run build`; this serves the resulting dist/ folder
// and falls back to its index.html for any /admin/* path so client-side
// routing (React Router) works on a hard refresh/direct link too.
// A bare '/admin/*' string trips up newer path-to-regexp releases ("Missing
// parameter name"), and the required-name syntax that replaces it
// ('/admin/*splat') differs across path-to-regexp/Express versions. A plain
// RegExp path sidesteps that parsing entirely and works everywhere.
const adminPanelDistPath = path.join(__dirname, '../admin-panel/dist');
app.use('/admin', express.static(adminPanelDistPath));
app.get(/^\/admin(\/.*)?$/, (req, res, next) => {
  res.sendFile(path.join(adminPanelDistPath, 'index.html'), (err) => {
    if (err) next(err);
  });
});
app.get('/', (req, res) => res.redirect('/admin/'));

app.use(env.API_PREFIX, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
