const test = require('node:test');
const assert = require('node:assert/strict');
const { DeviceService } = require('../src/services/device.service');

/**
 * Fake repository that behaves like a real unique-key upsert: one Map keyed
 * by deviceId, so these tests exercise the same "create vs update, exactly
 * one row" semantics the real Prisma upsert enforces via the DB constraint.
 */
function makeRepository() {
  const rows = new Map();
  return {
    rows,
    async upsertByDeviceId(deviceId, { createData, updateData }) {
      const existing = rows.get(deviceId);
      if (!existing) {
        const created = { id: BigInt(rows.size + 1), ...createData };
        rows.set(deviceId, created);
        return created;
      }
      const updated = { ...existing, ...updateData };
      rows.set(deviceId, updated);
      return updated;
    },
    async findByDeviceId(deviceId) {
      return rows.get(deviceId) ?? null;
    },
  };
}

test('DeviceService.registerDevice creates exactly one row on first launch', async () => {
  const repository = makeRepository();
  const service = new DeviceService({
    deviceRepository: repository,
    clock: () => new Date('2026-08-23T10:00:00.000Z'),
  });

  const result = await service.registerDevice({
    deviceId: 'ABC123',
    os: 'ios',
    firebaseToken: 'TOKEN123',
  });

  assert.equal(result.deviceId, 'ABC123');
  assert.equal(result.os, 'ios');
  assert.equal(result.registered, true);
  assert.equal(repository.rows.size, 1);
  const row = repository.rows.get('ABC123');
  assert.deepEqual(row.firstLaunchedAt, new Date('2026-08-23T10:00:00.000Z'));
  assert.deepEqual(row.lastLaunchedAt, new Date('2026-08-23T10:00:00.000Z'));
  assert.equal(row.firebaseToken, 'TOKEN123');
});

test('DeviceService.registerDevice on a second launch updates the same row instead of creating another', async () => {
  const repository = makeRepository();
  const service = new DeviceService({ deviceRepository: repository });

  await service.registerDevice({ deviceId: 'ABC123', os: 'ios', firebaseToken: 'TOKEN123' });
  await service.registerDevice({ deviceId: 'ABC123', os: 'ios', firebaseToken: 'TOKEN123' });
  await service.registerDevice({ deviceId: 'ABC123', os: 'ios', firebaseToken: 'TOKEN123' });

  assert.equal(repository.rows.size, 1);
});

test('DeviceService.registerDevice preserves firstLaunchedAt across later launches', async () => {
  const repository = makeRepository();
  const firstLaunch = new Date('2026-08-20T09:00:00.000Z');
  const secondLaunch = new Date('2026-08-23T10:00:00.000Z');
  let now = firstLaunch;
  const service = new DeviceService({ deviceRepository: repository, clock: () => now });

  await service.registerDevice({ deviceId: 'ABC123', os: 'android' });
  now = secondLaunch;
  await service.registerDevice({ deviceId: 'ABC123', os: 'android' });

  const row = repository.rows.get('ABC123');
  assert.deepEqual(row.firstLaunchedAt, firstLaunch);
  assert.deepEqual(row.lastLaunchedAt, secondLaunch);
});

test('DeviceService.registerDevice updates lastLaunchedAt on every registration', async () => {
  const repository = makeRepository();
  let now = new Date('2026-08-20T09:00:00.000Z');
  const service = new DeviceService({ deviceRepository: repository, clock: () => now });

  await service.registerDevice({ deviceId: 'ABC123', os: 'android' });
  now = new Date('2026-08-21T09:00:00.000Z');
  await service.registerDevice({ deviceId: 'ABC123', os: 'android' });
  now = new Date('2026-08-22T09:00:00.000Z');
  await service.registerDevice({ deviceId: 'ABC123', os: 'android' });

  assert.deepEqual(repository.rows.get('ABC123').lastLaunchedAt, now);
});

test('DeviceService.registerDevice updates the firebase token when a new one is supplied', async () => {
  const repository = makeRepository();
  const service = new DeviceService({ deviceRepository: repository });

  await service.registerDevice({ deviceId: 'ABC123', os: 'android', firebaseToken: 'OLD_TOKEN' });
  await service.registerDevice({ deviceId: 'ABC123', os: 'android', firebaseToken: 'NEW_TOKEN' });

  assert.equal(repository.rows.get('ABC123').firebaseToken, 'NEW_TOKEN');
});

test('DeviceService.registerDevice does not overwrite a stored token when no token is supplied (refresh handling)', async () => {
  const repository = makeRepository();
  const service = new DeviceService({ deviceRepository: repository });

  await service.registerDevice({ deviceId: 'ABC123', os: 'android', firebaseToken: 'KEEP_ME' });
  // Simulates a plain app-launch registration where the token wasn't
  // resupplied (e.g. Firebase hasn't reissued one) — must not go null.
  await service.registerDevice({ deviceId: 'ABC123', os: 'android' });

  assert.equal(repository.rows.get('ABC123').firebaseToken, 'KEEP_ME');
});

test('DeviceService.registerDevice records the latest os/app metadata on every call', async () => {
  const repository = makeRepository();
  const service = new DeviceService({ deviceRepository: repository });

  await service.registerDevice({ deviceId: 'ABC123', os: 'android', appVersion: '1.0.0' });
  await service.registerDevice({ deviceId: 'ABC123', os: 'android', appVersion: '1.1.0' });

  assert.equal(repository.rows.get('ABC123').appVersion, '1.1.0');
});
