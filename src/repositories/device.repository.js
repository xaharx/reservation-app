const { prisma } = require('../config/database');

class DeviceRepository {
  constructor(database = prisma) {
    this.database = database;
  }

  /**
   * Single round trip, atomic upsert keyed on the unique deviceId column —
   * this is what guarantees exactly one row per installation no matter how
   * many times the app launches concurrently or registers a token refresh.
   */
  async upsertByDeviceId(deviceId, { createData, updateData }) {
    return this.database.device.upsert({
      where: { deviceId },
      create: createData,
      update: updateData,
    });
  }

  async findByDeviceId(deviceId) {
    return this.database.device.findUnique({ where: { deviceId } });
  }
}

module.exports = { DeviceRepository };
