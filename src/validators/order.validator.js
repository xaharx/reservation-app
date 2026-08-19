const { z } = require('zod');

const CONFIRMATION_CODE_PATTERN = /^[A-Z0-9-]{6,32}$/;

const orderItemSchema = z.object({
  menuItemId: z.string().regex(/^\d+$/, 'menuItemId must be a positive integer.'),
  quantity: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().max(255).optional(),
});

const createOrderSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required.').max(80),
    lastName: z.string().trim().min(1, 'Last name is required.').max(80),
    email: z.string().trim().toLowerCase().email('Email must be valid.').max(191),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{6,31}$/, 'Phone must be a valid international phone number.'),
    items: z.array(orderItemSchema).min(1, 'At least one item is required.').max(50),
    notes: z.string().trim().max(500).optional(),
    deviceId: z.string().max(255).optional(),
    os: z.enum(['android', 'ios', 'web']).optional(),
  })
  .strict();

const lookupOrderSchema = z
  .object({
    confirmationCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        CONFIRMATION_CODE_PATTERN,
        'Confirmation code must be 6-32 uppercase letters, numbers, or hyphens.',
      ),
    guestEmail: z.string().trim().toLowerCase().email('Email must be valid.').max(191),
  })
  .strict();

const orderCancellationParamsSchema = z
  .object({
    confirmationCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        CONFIRMATION_CODE_PATTERN,
        'Confirmation code must be 6-32 uppercase letters, numbers, or hyphens.',
      ),
  })
  .strict();

const cancelOrderSchema = z
  .object({
    guestEmail: z.string().trim().toLowerCase().email('Email must be valid.').max(191),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

module.exports = {
  createOrderSchema,
  lookupOrderSchema,
  orderCancellationParamsSchema,
  cancelOrderSchema,
};
