const { prisma } = require('../config/database');

function buildOrderBy(sortBy, sortDir) {
  const direction = sortDir === 'desc' ? 'desc' : 'asc';

  if (sortBy === 'createdAt') {
    return [{ createdAt: direction }, { id: 'asc' }];
  }
  if (sortBy === 'guestName') {
    return [{ guestName: direction }, { id: 'asc' }];
  }
  // Default: same ordering the admin list always used before sort support
  // existed, just direction-aware now.
  return [{ reservationDate: direction }, { reservationTime: direction }, { id: 'asc' }];
}

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

  async findMany({ skip, take, status, reservationDate, search, sortBy, sortDir }) {
    const where = {
      ...(status && { status }),
      ...(reservationDate && { reservationDate }),
      ...(search && {
        OR: [
          { guestName: { contains: search } },
          { guestEmail: { contains: search } },
          { guestPhone: { contains: search } },
          { confirmationCode: { contains: search } },
        ],
      }),
    };
    const [reservations, total] = await this.database.$transaction([
      this.database.reservation.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(sortBy, sortDir),
      }),
      this.database.reservation.count({ where }),
    ]);

    return { reservations, total };
  }

  async updateStatus(id, data) {
    return this.database.reservation.update({ where: { id }, data });
  }

  /** One row per status with its count, e.g. [{ status: 'PENDING', _count: { _all: 12 } }, ...]. */
  async countByStatus() {
    return this.database.reservation.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }

  /** Bounds are exclusive/inclusive as passed — the service owns "today" math, this just counts. */
  async countByDateRange({ from, to } = {}) {
    return this.database.reservation.count({
      where: {
        ...((from || to) && {
          reservationDate: {
            ...(from && { gte: from }),
            ...(to && { lt: to }),
          },
        }),
      },
    });
  }
}

module.exports = { ReservationRepository };
