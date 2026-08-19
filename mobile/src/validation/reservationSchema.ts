import { z } from 'zod';

/**
 * Mirrors the rules enforced server-side in
 * ReservationApp/src/validators/reservation.validator.js (createReservationSchema),
 * so the mobile app rejects bad input before it ever reaches the API.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^\+?[1-9]\d{6,31}$/;

function isCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isTodayOrFuture(value: string): boolean {
  const today = new Date();
  const currentDate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [year, month, day] = value.split('-').map(Number);
  const requestedDate = Date.UTC(year, month - 1, day);

  return requestedDate >= currentDate;
}

// Not part of the backend schema yet (see reservation.service.js) — the Prisma
// `Reservation.occasion` column exists but nothing writes to it today. Validated
// here so the UI is ready as soon as the API accepts it.
export const OCCASIONS = ['FAMILY', 'COUPLE'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const reservationFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.')
    .max(80, 'First name must be 80 characters or fewer.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required.')
    .max(80, 'Last name must be 80 characters or fewer.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(191, 'Email is too long.'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, 'Enter a valid phone number, e.g. +923001234567.'),
  reservationDate: z
    .string()
    .min(1, 'Please select a date.')
    .refine(isCalendarDate, 'Enter a valid date.')
    .refine(isTodayOrFuture, 'Date cannot be in the past.'),
  reservationTime: z
    .string()
    .min(1, 'Please select a time.')
    .regex(TIME_PATTERN, 'Please select a valid time.'),
  guestCount: z
    .number()
    .int('Select the number of guests.')
    .min(1, 'At least 1 guest is required.')
    .max(20, 'Maximum of 20 guests.'),
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;
export type ReservationFormField = keyof ReservationFormValues | 'occasion';
