import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_STORAGE_KEY = 'ora_device_id';

let cachedDeviceId: string | null = null;

/**
 * Not cryptographically secure — deliberately so. This is an installation
 * identifier, not a security credential (see registerDevice.ts), so
 * Math.random() entropy is fine and avoids pulling in a native crypto
 * module just to generate one string.
 */
function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Returns a stable identifier for this app installation, generating and
 * persisting one on first call. Deliberately NOT a hardware identifier
 * (IMEI / Android ID / IDFA) — those are quasi-permanent and more
 * identifying than needed here. A random UUID scoped to this install
 * resets on uninstall/reinstall, which is exactly the "one record per
 * installation" semantics the backend expects, without collecting
 * anything more identifying than necessary.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }

    const generated = generateUuidV4();
    await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    cachedDeviceId = generated;
    return generated;
  } catch {
    // AsyncStorage unavailable for some reason — fall back to a
    // per-session id rather than throwing. Registration will just create a
    // fresh row next launch instead of updating the same one, which is
    // degraded but harmless.
    const fallback = generateUuidV4();
    cachedDeviceId = fallback;
    return fallback;
  }
}
