const { DeviceRepository } = require('../repositories/device.repository');

/**
 * Registers or refreshes a single device/installation record. Never creates
 * a second row for the same deviceId — see DeviceRepository.upsertByDeviceId,
 * which relies on the unique index on device_id to make this atomic.
 */
class DeviceService {
  constructor({ deviceRepository = new DeviceRepository(), clock = () => new Date() } = {}) {
    this.deviceRepository = deviceRepository;
    this.clock = clock;
  }

  async registerDevice(input) {
    const now = this.clock();

    const metadata = {
      os: input.os,
      appVersion: input.appVersion ?? null,
      osVersion: input.osVersion ?? null,
      deviceModel: input.deviceModel ?? null,
      deviceManufacturer: input.deviceManufacturer ?? null,
      locale: input.locale ?? null,
      timezone: input.timezone ?? null,
      notificationPermissionStatus: input.notificationPermissionStatus ?? null,
    };

    // A missing/empty firebaseToken must never clobber a previously stored
    // one (tokens aren't resent on every launch, only when Firebase issues a
    // new one) — so it's only included in the update payload when present.
    const updateData = {
      ...metadata,
      lastLaunchedAt: now,
      isActive: true,
      ...(input.firebaseToken ? { firebaseToken: input.firebaseToken } : {}),
    };

    const createData = {
      ...metadata,
      deviceId: input.deviceId,
      firebaseToken: input.firebaseToken ?? null,
      firstLaunchedAt: now,
      lastLaunchedAt: now,
      isActive: true,
    };

    const device = await this.deviceRepository.upsertByDeviceId(input.deviceId, {
      createData,
      updateData,
    });

    return {
      deviceId: device.deviceId,
      os: device.os,
      registered: true,
    };
  }
}

module.exports = { DeviceService };
