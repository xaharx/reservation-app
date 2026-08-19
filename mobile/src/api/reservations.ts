import { Platform } from 'react-native';
import { API_BASE_URL } from './config';

export type ApiFieldError = { field: string; message: string };

/**
 * Thrown for both network failures and error envelopes returned by the API
 * (see ReservationApp/docs/api-contract.md "Response envelopes"). `status`
 * is 0 for a network failure (no response was ever received).
 */
export class ApiRequestError extends Error {
  status: number;
  code?: string;
  fieldErrors: ApiFieldError[];

  constructor(message: string, status: number, code?: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

type SuccessEnvelope<T> = { success: true; message: string; data: T };
type ErrorEnvelope = {
  success: false;
  message: string;
  code?: string;
  errors?: ApiFieldError[];
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.', 0);
  }

  let payload: SuccessEnvelope<T> | ErrorEnvelope | undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message ?? 'Something went wrong. Please try again.';
    const code = payload && !payload.success ? payload.code : undefined;
    const fieldErrors = payload && !payload.success ? payload.errors ?? [] : [];
    throw new ApiRequestError(message, response.status, code, fieldErrors);
  }

  return payload.data;
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ReservationResponse = {
  id: string;
  confirmationCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequest: string | null;
  status: ReservationStatus;
  deviceId: string | null;
  os: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateReservationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequest?: string;
};

export function createReservation(input: CreateReservationInput): Promise<ReservationResponse> {
  return postJson<ReservationResponse>('/reservations', {
    ...input,
    os: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
  });
}

export type LookupReservationInput = {
  confirmationCode: string;
  guestEmail: string;
};

export function lookupReservation(input: LookupReservationInput): Promise<ReservationResponse> {
  return postJson<ReservationResponse>('/reservations/lookup', input);
}

export type CancelReservationInput = {
  confirmationCode: string;
  guestEmail: string;
  reason?: string;
};

export function cancelReservation({
  confirmationCode,
  ...body
}: CancelReservationInput): Promise<ReservationResponse> {
  return postJson<ReservationResponse>(
    `/reservations/${encodeURIComponent(confirmationCode)}/cancellation`,
    body,
  );
}
