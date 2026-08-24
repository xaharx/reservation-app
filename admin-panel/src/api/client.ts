import axios, { AxiosError } from 'axios';
import type { ErrorEnvelope } from '../types/api';

const TOKEN_STORAGE_KEY = 'ora_admin_token';

// sessionStorage rather than localStorage: cleared when the tab closes,
// which is the right tradeoff for an internal admin tool — it limits how
// long a stolen/XSS-leaked token stays useful, at the cost of having to
// log in again per browser session.
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Listeners the AuthContext registers so a 401 anywhere (token expired,
// account deactivated mid-session, etc.) triggers an immediate logout+
// redirect rather than the user staring at a silently-broken screen.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorEnvelope>) => {
    if (error.response?.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * Turns any axios/API failure into one user-facing string. Never renders a
 * raw backend/network error to the screen — see the app-wide error-handling
 * requirement this maps directly to.
 */
export function toFriendlyErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ErrorEnvelope>(error)) {
    if (!error.response) {
      return 'Could not reach the server. Check your connection and try again.';
    }
    const { status, data } = error.response;
    if (data?.message) {
      return data.message;
    }
    switch (status) {
      case 400:
        return 'That request was invalid.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return "You don't have permission to do that.";
      case 404:
        return 'That item could not be found.';
      case 409:
        return "That action can't be completed right now — the item may have changed.";
      case 422:
        return 'Please check the highlighted fields and try again.';
      default:
        return 'Something went wrong on our end. Please try again shortly.';
    }
  }
  return 'Something went wrong. Please try again.';
}

/** Field-level validation messages, when the backend's 422 includes them. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ErrorEnvelope>(error) && error.response?.data.details) {
    return Object.fromEntries(
      error.response.data.details.map((detail) => [detail.field, detail.message]),
    );
  }
  return {};
}
