const { z } = require('zod');

const registerDeviceSchema = z
  .object({
    deviceId: z.string().trim().min(1, 'Device ID is required.').max(255),
    os: z.enum(['android', 'ios', 'web'], {
      errorMap: () => ({ message: 'os must be one of: android, ios, web.' }),
    }),
    firebaseToken: z.string().trim().min(1).max(255).optional(),
    appVersion: z.string().trim().max(30).optional(),
    osVersion: z.string().trim().max(30).optional(),
    deviceModel: z.string().trim().max(120).optional(),
    deviceManufacturer: z.string().trim().max(120).optional(),
    locale: z.string().trim().max(35).optional(),
    timezone: z.string().trim().max(60).optional(),
    notificationPermissionStatus: z
      .enum(['granted', 'denied', 'provisional', 'not-determined'])
      .optional(),
  })
  .strict();

module.exports = { registerDeviceSchema };
