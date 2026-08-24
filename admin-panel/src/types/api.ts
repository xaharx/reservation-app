// Mirrors the backend's response envelope exactly (see
// ReservationApp/src/controllers/*.js and error-handler.middleware.js) —
// this file has no logic, just the shape, so it should never drift from
// what the API actually returns.

export type ApiFieldError = { field: string; message: string };

export type SuccessEnvelope<T> = {
  success: true;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

export type ErrorEnvelope = {
  success: false;
  message: string;
  details?: ApiFieldError[];
};
