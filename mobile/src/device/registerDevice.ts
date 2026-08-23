import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { API_BASE_URL } from '../api/config';
import { getDeviceId } from './deviceId';
import { getPushToken } from '../notifications/push';
// Plain JSON import (not a native module) — same version string used to
// build the app, so it can never drift from what's actually installed.
import appConfig from '../../app.json';

function resolveOs(): 'android' | 'ios' | 'web' {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
}

/**
 * Registers or refreshes this installation with POST /devices/register.
 * Deliberately fire-and-forget: callers must not await this in a way that
 * blocks rendering, and a failure here must never surface to the user —
 * device tracking is analytics/push plumbing, not a feature the user is
 * using. Errors are swallowed and only surfaced via console.warn in dev.
 */
export async function registerDevice(firebaseTokenOverride?: string | null): Promise<void> {
  try {
    const [deviceId, firebaseToken] = await Promise.all([
      getDeviceId(),
      firebaseTokenOverride !== undefined ? firebaseTokenOverride : getPushToken(),
    ]);

    const body: Record<string, unknown> = {
      deviceId,
      os: resolveOs(),
      appVersion: appConfig?.expo?.version,
      osVersion: String(Device.osVersion ?? Platform.Version ?? ''),
      deviceModel: Device.modelName ?? undefined,
      deviceManufacturer: Device.manufacturer ?? undefined,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    if (firebaseToken) {
      body.firebaseToken = firebaseToken;
    }

    const response = await fetch(`${API_BASE_URL}/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok && __DEV__) {
      // Never log firebaseToken or other device metadata, even in dev.
      console.warn('Device registration responded with status', response.status);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(
        'Device registration failed (non-blocking):',
        error instanceof Error ? error.message : error,
      );
    }
  }
}
