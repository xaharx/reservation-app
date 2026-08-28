const { z } = require('zod');

const CONFIRMATION_CODE_PATTERN = /^[A-Z0-9-]{6,32}$/;

const orderItemSchema = z.object({
  menuItemId: z.string().regex(/^\d+$/, 'menuItemId must be a positive integer.'),
  quantity: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().max(255).optional(),
});

// Delivery address is captured once at checkout and stored as a snapshot on
// the order itself (see schema.prisma) — it's never re-validated or reused
// across orders, so column sizes/required-ness only need to satisfy this one
// request shape. postalCode is deliberately kept format-generic (not
// US-only) since `country` is free text rather than a fixed value.
const deliveryAddressSchema = z
  .object({
    addressLine1: z.string().trim().min(1, 'Address line 1 is required.').max(255),
    addressLine2: z.string().trim().max(255).optional(),
    city: z.string().trim().min(1, 'City is required.').max(100),
    state: z.string().trim().max(100).optional(),
    postalCode: z
      .string()
      .trim()
      .min(1, 'Postal code is required.')
      .max(24)
      .regex(/^[A-Za-z0-9\s-]{3,24}$/, 'Postal code must be a valid postal/ZIP code.'),
    country: z.string().trim().min(1, 'Country is required.').max(100),
  })
  .strict();

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
    deliveryAddress: deliveryAddressSchema,
    notes: z.string().trim().max(500).optional(),
    deviceId: z.string().max(255).optional(),
    os: z.enum(['android', 'ios', 'web']).optional(),
    pushToken: z.string().max(255).optional(),
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

const ORDER_STATUS_VALUES = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

const listOrdersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(ORDER_STATUS_VALUES).optional(),
    // Matched against guest name, email, phone, and confirmation code.
    search: z.string().trim().min(1).max(191).optional(),
    sortBy: z.enum(['createdAt', 'guestName']).default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict();

const updateOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUS_VALUES),
    cancellationNote: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === 'CANCELLED' && !value.cancellationNote) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cancellationNote'],
        message: 'Cancellation note is required when cancelling an order.',
      });
    }
  });

module.exports = {
  createOrderSchema,
  deliveryAddressSchema,
  lookupOrderSchema,
  orderCancellationParamsSchema,
  cancelOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
};
