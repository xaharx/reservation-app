const { prisma } = require('../config/database');

class OrderRepository {
  constructor(database = prisma) {
    this.database = database;
  }

  create(data) {
    return this.database.order.create({ data, include: { items: true } });
  }

  findById(id) {
    return this.database.order.findUnique({ where: { id }, include: { items: true } });
  }

  findByConfirmationCode(confirmationCode) {
    return this.database.order.findUnique({
      where: { confirmationCode },
      include: { items: true },
    });
  }

  async updateStatus(id, data) {
    return this.database.order.update({ where: { id }, data, include: { items: true } });
  }
}

module.exports = { OrderRepository };
