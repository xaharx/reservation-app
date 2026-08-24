const { Router } = require('express');
const { authController } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { validateBody } = require('../validators/validate-request.middleware');
const { loginSchema } = require('../validators/auth.validator');

const authRouter = Router();

/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in to the Admin Panel
 *     description: "Returns a JWT to send as Authorization: Bearer <token> on subsequent /admin/* requests."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: admin@oradenuit.com }
 *               password: { type: string, example: replace_with_a_strong_password }
 *     responses:
 *       200:
 *         description: Logged in successfully.
 *       401:
 *         description: Invalid email or password.
 *       422:
 *         description: Validation failed.
 */
authRouter.post('/login', validateBody(loginSchema), authController.login);

/**
 * @openapi
 * /admin/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated admin user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current admin user retrieved successfully. }
 *       401: { description: 'Authentication required, or session expired/invalid.' }
 */
authRouter.get('/me', authenticate, authController.me);

/**
 * @openapi
 * /admin/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out of the Admin Panel
 *     description: Tokens are stateless — this confirms intent for a consistent API surface; the frontend discards the token client-side.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out successfully. }
 *       401: { description: 'Authentication required, or session expired/invalid.' }
 */
authRouter.post('/logout', authenticate, authController.logout);

module.exports = { authRouter };
