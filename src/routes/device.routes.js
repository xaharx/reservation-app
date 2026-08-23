const { Router } = require('express');
const { deviceController } = require('../controllers/device.controller');
const { validateBody } = require('../validators/validate-request.middleware');
const { registerDeviceSchema } = require('../validators/device.validator');

const deviceRouter = Router();

/**
 * @openapi
 * /devices/register:
 *   post:
 *     tags: [Devices]
 *     summary: Register or refresh an app installation
 *     description: >
 *       Called on every app launch and whenever the Firebase Cloud Messaging
 *       token changes. Upserts by deviceId — exactly one row exists per
 *       installation. firstLaunchedAt is only ever set on the first call;
 *       lastLaunchedAt updates every time. Omitting firebaseToken never
 *       overwrites a previously stored token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [deviceId, os]
 *             properties:
 *               deviceId: { type: string, maxLength: 255, example: ABC123 }
 *               os: { type: string, enum: [android, ios, web], example: ios }
 *               firebaseToken: { type: string, maxLength: 255, example: firebase-token }
 *               appVersion: { type: string, maxLength: 30, example: '1.0.0' }
 *               osVersion: { type: string, maxLength: 30, example: '18.5' }
 *               deviceModel: { type: string, maxLength: 120, example: iPhone }
 *               deviceManufacturer: { type: string, maxLength: 120, example: Apple }
 *               locale: { type: string, maxLength: 35, example: en-US }
 *               timezone: { type: string, maxLength: 60, example: America/New_York }
 *               notificationPermissionStatus:
 *                 type: string
 *                 enum: [granted, denied, provisional, not-determined]
 *                 example: granted
 *     responses:
 *       200:
 *         description: Device registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Device registered successfully. }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deviceId: { type: string, example: ABC123 }
 *                     os: { type: string, example: ios }
 *                     registered: { type: boolean, example: true }
 *       422:
 *         description: Validation failed.
 *       500:
 *         description: Unexpected server error.
 */
deviceRouter.post('/register', validateBody(registerDeviceSchema), deviceController.register);

module.exports = { deviceRouter };
