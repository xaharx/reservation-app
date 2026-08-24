import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ANDROID_CHANNEL_ID = 'default';

/**
 * Android 8+ requires a notification channel before any notification (local
 * or remote-triggered) can be shown. Safe to call repeatedly — it's a no-op
 * if the channel already exists. Call once, early, before any notification
 * is shown.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Ora de Nuit',
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch {
    // Non-fatal — worst case, a later notification silently no-ops.
  }
}

/**
 * FCM only auto-displays a system notification when the app is backgrounded
 * or killed; while it's open, "notification" payloads are handed to our own
 * onMessage listener instead (see App.tsx) and nothing appears unless we
 * show something ourselves. This posts a real system notification — not an
 * Alert.alert — so foreground pushes behave the same as backgrounded ones
 * (visible in the system tray and in Android's notification history) and
 * don't get silently dropped by colliding with another Alert.alert call
 * (e.g. the reservation form's own "Booking confirmed" dialog).
 */
export async function showForegroundNotification({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  } catch {
    // Never let a display failure surface to the user.
  }
}
