import { PermissionsAndroid, Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  requestPermission,
  setBackgroundMessageHandler,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

/**
 * Requests notification permission on both platforms. Safe to call
 * repeatedly (a no-op once granted) and never throws — a denial just means
 * we won't have a token to send along with reservations/orders, which the
 * rest of the app already treats as optional.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    const authStatus = await requestPermission(getMessaging(getApp()));
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/**
 * Returns the current FCM registration token, or null if permission wasn't
 * granted or the token couldn't be fetched (no network, Play Services
 * unavailable on the emulator, etc). Callers already treat pushToken as
 * optional, so this degrading to null just means no push for that guest.
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      return null;
    }
    return await getToken(getMessaging(getApp()));
  } catch {
    return null;
  }
}

/**
 * Registers the background/quit-state message handler. Must be called as
 * early as possible outside the React tree (see index.ts) — Firebase
 * requires this exact setup, and the OS displays the notification
 * automatically for "notification"-type messages, so this handler only
 * needs to exist, not do anything.
 */
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(getApp()), async () => {
    // No-op: FCM "notification" payloads are displayed by the OS
    // automatically when the app is backgrounded or killed.
  });
}
