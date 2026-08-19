import { Platform } from 'react-native';

/**
 * The backend runs locally during development (see ReservationApp/.env —
 * PORT=3000, API_PREFIX=/api/v1). Android emulators can't reach the host
 * machine's `localhost`, so they use the `10.0.2.2` alias instead; iOS
 * simulator and web can use `localhost` directly. Override with
 * EXPO_PUBLIC_API_BASE_URL (e.g. in a `.env` file) when testing against a
 * physical device or a non-local backend.
 */
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${DEFAULT_HOST}:3000/api/v1`;
