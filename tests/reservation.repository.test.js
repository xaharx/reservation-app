const test = require('node:test');
const assert = require('node:assert/strict');
const { ReservationRepository } = require('../src/repositories/reservation.repository');

function makeFakeDatabase() {
  const calls = {};
  return {
    calls,
    reservation: {
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
    },
    $transaction: async (queries) => Promise.all(queries),
  };
}

test('ReservationRepository.findMany builds an OR search clause across name/email/phone/code', async () => {
  const database = makeFakeDatabase();
  const repository = new ReservationRepository(database);

  await repository.findMany({ skip: 0, take: 20, search: 'aisha' });

  assert.deepEqual(database.calls.findManyArgs.where.OR, [
    { guestName: { contains: 'aisha' } },
    { guestEmail: { contains: 'aisha' } },
    { guestPhone: { contains: 'aisha' } },
    { confirmationCode: { contains: 'aisha' } },
  ]);
});

test('ReservationRepository.findMany omits the OR clause when no search term is given', async () => {
  const database = makeFakeDatabase();
  const repository = new ReservationRepository(database);

  await repository.findMany({ skip: 0, take: 20 });

  assert.equal('OR' in database.calls.findManyArgs.where, false);
});

test('ReservationRepository.findMany defaults ordering to reservationDate/time ascending', async () => {
  const database = makeFakeDatabase();
  const repository = new ReservationRepository(database);

  await repository.findMany({ skip: 0, take: 20 });

  assert.deepEqual(database.calls.findManyArgs.orderBy, [
    { reservationDate: 'asc' },
    { reservationTime: 'asc' },
    { id: 'asc' },
  ]);
});

test('ReservationRepository.findMany sorts by createdAt desc when requested', async () => {
  const database = makeFakeDatabase();
  const repository = new ReservationRepository(database);

  await repository.findMany({ skip: 0, take: 20, sortBy: 'createdAt', sortDir: 'desc' });

  assert.deepEqual(database.calls.findManyArgs.orderBy, [{ createdAt: 'desc' }, { id: 'asc' }]);
});

test('ReservationRepository.countByDateRange builds a gte/lt range when both bounds are given', async () => {
  const database = makeFakeDatabase();
  const repository = new ReservationRepository(database);
  const from = new Date('2026-08-24T00:00:00.000Z');
  const to = new Date('2026-08-25T00:00:00.000Z');

  await repository.countByDateRange({ from, to });

  assert.deepEqual(database.calls.countArgs.where.reservationDate, { gte: from, lt: to });
});

test('ReservationRepository.countByDateRange counts everything when no bounds are given', async () => {
  const database = makeFakeDatabase();
  const repository = new ReservationRepository(database);

  await repository.countByDateRange({});

  assert.equal('reservationDate' in database.calls.countArgs.where, false);
});
