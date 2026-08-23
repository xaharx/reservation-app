const test = require('node:test');
const assert = require('node:assert/strict');
const { registerDeviceSchema } = require('../src/validators/device.validator');

test('registerDeviceSchema accepts a minimal valid payload', () => {
  const result = registerDeviceSchema.safeParse({ deviceId: 'ABC123', os: 'ios' });
  assert.equal(result.success, true);
});

test('registerDeviceSchema accepts a full payload with all optional fields', () => {
  const result = registerDeviceSchema.safeParse({
    deviceId: 'ABC123',
    os: 'ios',
    firebaseToken: 'firebase-token',
    appVersion: '1.0.0',
    osVersion: '18.5',
    deviceModel: 'iPhone',
    deviceManufacturer: 'Apple',
    locale: 'en-US',
    timezone: 'America/New_York',
    notificationPermissionStatus: 'granted',
  });
  assert.equal(result.success, true);
});

test('registerDeviceSchema rejects a missing deviceId', () => {
  const result = registerDeviceSchema.safeParse({ os: 'ios' });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'deviceId'));
});

test('registerDeviceSchema rejects an empty deviceId', () => {
  const result = registerDeviceSchema.safeParse({ deviceId: '', os: 'ios' });
  assert.equal(result.success, false);
});

test('registerDeviceSchema rejects an invalid os value', () => {
  const result = registerDeviceSchema.safeParse({ deviceId: 'ABC123', os: 'windows-phone' });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'os'));
});

test('registerDeviceSchema rejects a missing os', () => {
  const result = registerDeviceSchema.safeParse({ deviceId: 'ABC123' });
  assert.equal(result.success, false);
});

test('registerDeviceSchema treats firebaseToken as optional', () => {
  const result = registerDeviceSchema.safeParse({ deviceId: 'ABC123', os: 'android' });
  assert.equal(result.success, true);
  assert.equal(result.data.firebaseToken, undefined);
});

test('registerDeviceSchema rejects unknown fields', () => {
  const result = registerDeviceSchema.safeParse({
    deviceId: 'ABC123',
    os: 'android',
    extraField: 'not allowed',
  });
  assert.equal(result.success, false);
});
