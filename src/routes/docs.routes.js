/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Check API availability
 *     responses:
 *       200:
 *         description: API is running.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
const { Router } = require('express');

const docsRouter = Router();

module.exports = { docsRouter };
