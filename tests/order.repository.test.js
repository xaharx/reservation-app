const test = require('node:test');
const assert = require('node:assert/strict');
const { OrderRepository } = require('../src/repositories/order.repository');

function makeFakeDatabase() {
  const calls = {};
  return {
    calls,
    order: {
      findMany: async (args) => {
        calls.findManyArgs = args;
        return [];
      },
      count: async (args) => {
        calls.countArgs = args;
        return 0;
      },
      groupBy: async (args) => {
        calls.groupByArgs = args;
        return [];
      },
      aggregate: async (args) => {
        calls.aggregateArgs = args;
        return { _sum: { totalCents: null } };
      },
    },
    $transaction: async (queries) => Promise.all(queries),
  };
}

test('OrderRepository.findMany builds an OR search clause across name/email/phone/code', async () => {
  const database = makeFakeDatabase();
  const repository = new OrderRepository(database);

  await repository.findMany({ skip: 0, take: 20, search: 'aisha' });

  assert.deepEqual(database.calls.findManyArgs.where.OR, [
    { guestName: { contains: 'aisha' } },
    { guestEmail: { contains: 'aisha' } },
    { guestPhone: { contains: 'aisha' } },
    { confirmationCode: { contains: 'aisha' } },
  ]);
});

test('OrderRepository.findMany omits the OR clause when no search term is given', async () => {
  const database = makeFakeDatabase();
  const repository = new OrderRepository(database);

  await repository.findMany({ skip: 0, take: 20 });

  assert.equal('OR' in database.calls.findManyArgs.where, false);
});

test('OrderRepository.findMany defaults to sorting by createdAt (direction passed through as-is)', async () => {
  const database = makeFakeDatabase();
  const repository = new OrderRepository(database);

  await repository.findMany({ skip: 0, take: 20, sortDir: 'desc' });

  assert.deepEqual(database.calls.findManyArgs.orderBy, [{ createdAt: 'desc' }, { id: 'asc' }]);
});

test('OrderRepository.findMany sorts by guestName ascending when requested', async () => {
  const database = makeFakeDatabase();
  const repository = new OrderRepository(database);

  await repository.findMany({ skip: 0, take: 20, sortBy: 'guestName', sortDir: 'asc' });

  assert.deepEqual(database.calls.findManyArgs.orderBy, [{ guestName: 'asc' }, { id: 'asc' }]);
});

test('OrderRepository.countByDateRange builds a gte/lt range when both bounds are given', async () => {
  const database = makeFakeDatabase();
  const repository = new OrderRepository(database);
  const from = new Date('2026-08-24T00:00:00.000Z');
  const to = new Date('2026-08-25T00:00:00.000Z');

  await repository.countByDateRange({ from, to });

  assert.deepEqual(database.calls.countArgs.where.createdAt, { gte: from, lt: to });
});

test('OrderRepository.countByDateRange counts everything when no bounds are given', async () => {
  const database = makeFakeDatabase();
  const repository = new OrderRepository(database);

  await repository.countByDateRange({});

  assert.equal('createdAt' in database.calls.countArgs.where, false);
});

test('OrderRepository.sumPaidRevenueCents only sums orders whose payment succeeded', async () => {
  const database = makeFakeDatabase();
  database.order.aggregate = async (args) => {
    database.calls.aggregateArgs = args;
    return { _sum: { totalCents: 45600 } };
  };
  const repository = new OrderRepository(database);

  const result = await repository.sumPaidRevenueCents();

  assert.equal(database.calls.aggregateArgs.where.paymentStatus, 'PAID');
  assert.equal(result, 45600);
});

test('OrderRepository.sumPaidRevenueCents returns 0 instead of null when there are no paid orders', async () => {
  const database = makeFakeDatabase();
  const repository = new OrderRepository(database);

  const result = await repository.sumPaidRevenueCents();

  assert.equal(result, 0);
});
