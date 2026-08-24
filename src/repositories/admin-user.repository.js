const { prisma } = require('../config/database');

class AdminUserRepository {
  constructor(database = prisma) {
    this.database = database;
  }

  async findByEmail(email) {
    return this.database.adminUser.findUnique({ where: { email } });
  }

  async findById(id) {
    return this.database.adminUser.findUnique({ where: { id } });
  }

  async updateLastLoginAt(id, lastLoginAt) {
    return this.database.adminUser.update({ where: { id }, data: { lastLoginAt } });
  }
}

module.exports = { AdminUserRepository };
