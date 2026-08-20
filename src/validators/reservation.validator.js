const { z } = require('zod');

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^\+?[1-9]\d{6,31}$/;

function isCalendarDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isTodayOrFuture(value) {
  const today = new Date();
  const currentDate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [year, month, day] = value.split('-').map(Number);
  const requestedDate = Date.UTC(year, month - 1, day);

  return requestedDate >= currentDate;
}

const createReservationSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required.').max(80),
    lastName: z.string().trim().min(1, 'Last name is required.').max(80),
    email: z.string().trim().toLowerCase().email('Email must be valid.').max(191),
    phone: z
      .string()
      .trim()
      .regex(PHONE_PATTERN, 'Phone must be a valid international phone number.'),
    reservationDate: z
      .string()
      .refine(isCalendarDate, 'Reservation date must be a valid YYYY-MM-DD date.')
      .refine(isTodayOrFuture, 'Reservation date cannot be in the past.'),
    reservationTime: z.string().regex(TIME_PATTERN, 'Reservation time must use HH:mm format.'),
    guestCount: z.coerce.number().int().min(1).max(20),
    specialRequest: z.string().trim().max(5000).optional(),
    deviceId: z.string().max(255).optional(),
    os: z.enum(["android","ios","web"]).optional(),
    pushToken: z.string().max(255).optional(),
  })
  .strict();

const reservationIdSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+$/, 'Reservation ID must be a positive integer.')
      .refine((value) => BigInt(value) > 0n, 'Reservation ID must be a positive integer.')
      .refine(
        (value) => BigInt(value) <= 18446744073709551615n,
        'Reservation ID exceeds the supported range.',
      ),
  })
  .strict();

const CONFIRMATION_CODE_PATTERN = /^[A-Z0-9-]{6,32}$/;

const lookupReservationSchema = z
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

const cancellationParamsSchema = z
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

const cancelReservationSchema = z
  .object({
    guestEmail: z.string().trim().toLowerCase().email('Email must be valid.').max(191),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

const updateReservationStatusSchema = z
  .object({
    status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    cancellationNote: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === 'CANCELLED' && !value.cancellationNote) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cancellationNote'],
        message: 'Cancellation note is required when cancelling a reservation.',
      });
    }
  });

const listReservationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
      .optional(),
    reservationDate: z
      .string()
      .refine(isCalendarDate, 'Reservation date must be a valid YYYY-MM-DD date.')
      .optional(),
  })
  .strict();

module.exports = {
  createReservationSchema,
  reservationIdSchema,
  lookupReservationSchema,
  cancellationParamsSchema,
  cancelReservationSchema,
  updateReservationStatusSchema,
  listReservationsQuerySchema,
};
