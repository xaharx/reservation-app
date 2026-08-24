const { prisma } = require('../config/database');

function buildOrderBy(sortBy, sortDir) {
  const direction = sortDir === 'desc' ? 'desc' : 'asc';

  if (sortBy === 'guestName') {
    return [{ guestName: direction }, { id: 'asc' }];
  }
  // Default: most-recent-first, matching how orders are naturally reviewed.
  return [{ createdAt: direction }, { id: 'asc' }];
}

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

  async findMany({ skip, take, status, search, sortBy, sortDir }) {
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { guestName: { contains: search } },
          { guestEmail: { contains: search } },
          { guestPhone: { contains: search } },
          { confirmationCode: { contains: search } },
        ],
      }),
    };
    const [orders, total] = await this.database.$transaction([
      this.database.order.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(sortBy, sortDir),
        include: { items: true },
      }),
      this.database.order.count({ where }),
    ]);

    return { orders, total };
  }

  /** One row per status with its count, e.g. [{ status: 'PAID', _count: { _all: 12 } }, ...]. */
  async countByStatus() {
    return this.database.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }

  /** Bounds are exclusive/inclusive as passed — the service owns "today" math, this just counts. */
  async countByDateRange({ from, to } = {}) {
    return this.database.order.count({
      where: {
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lt: to }),
          },
        }),
      },
    });
  }

  /** Sum of totalCents for orders that were actually paid for (successful revenue only). */
  async sumPaidRevenueCents() {
    const result = await this.database.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalCents: true },
    });
    return result._sum.totalCents ?? 0;
  }
}

module.exports = { OrderRepository };
