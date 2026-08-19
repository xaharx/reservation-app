const { prisma } = require('../config/database');

class ReservationRepository {
  constructor(database = prisma) {
    this.database = database;
  }

  async create(data) {
    return this.database.reservation.create({ data });
  }

  async findById(id) {
    return this.database.reservation.findUnique({ where: { id } });
  }

  async findByConfirmationCode(confirmationCode) {
    return this.database.reservation.findUnique({ where: { confirmationCode } });
  }

  async findMany({ skip, take, status, reservationDate }) {
    const where = {
      ...(status && { status }),
      ...(reservationDate && { reservationDate }),
    };
    const [reservations, total] = await this.database.$transaction([
      this.database.reservation.findMany({
        where,
        skip,
        take,
        orderBy: [{ reservationDate: 'asc' }, { reservationTime: 'asc' }, { id: 'asc' }],
      }),
      this.database.reservation.count({ where }),
    ]);

    return { reservations, total };
  }

  async updateStatus(id, data) {
    return this.database.reservation.update({ where: { id }, data });
  }
}

module.exports = { ReservationRepository };
