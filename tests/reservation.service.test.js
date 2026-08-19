const test = require('node:test');
const assert = require('node:assert/strict');
const { ReservationService } = require('../src/services/reservation.service');

function makeReservation(status = 'PENDING') {
  return {
    id: 1n,
    confirmationCode: 'ON-TESTCODE01',
    guestName: 'Aisha Khan',
    guestEmail: 'aisha@example.com',
    guestPhone: '+923001234567',
    reservationDate: new Date('2026-08-08T00:00:00.000Z'),
    reservationTime: new Date('1970-01-01T20:00:00.000Z'),
    partySize: 4,
    specialRequests: 'Window table',
    status,
    createdAt: new Date('2026-07-30T08:00:00.000Z'),
    updatedAt: new Date('2026-07-30T08:00:00.000Z'),
  };
}

test('ReservationService maps the mobile request contract to the persistence model', async () => {
  let createdPayload;
  const repository = {
    create: async (payload) => {
      createdPayload = payload;
      return makeReservation();
    },
  };
  const service = new ReservationService({
    reservationRepository: repository,
    confirmationCodeGenerator: () => 'ON-TESTCODE01',
  });

  const result = await service.createReservation({
    firstName: 'Aisha',
    lastName: 'Khan',
    email: 'aisha@example.com',
    phone: '+923001234567',
    reservationDate: '2026-08-08',
    reservationTime: '20:00',
    guestCount: 4,
    specialRequest: 'Window table',
  });

  assert.equal(createdPayload.guestName, 'Aisha Khan');
  assert.equal(createdPayload.partySize, 4);
  assert.equal(createdPayload.source, 'MOBILE_APP');
  assert.equal(result.id, '1');
  assert.equal(result.confirmationCode, 'ON-TESTCODE01');
});

test('ReservationService.lookupReservation returns the reservation when code and email match', async () => {
  const repository = {
    findByConfirmationCode: async (code) => {
      assert.equal(code, 'ON-TESTCODE01');
      return makeReservation('CONFIRMED');
    },
  };
  const service = new ReservationService({ reservationRepository: repository });

  const result = await service.lookupReservation({
    confirmationCode: 'ON-TESTCODE01',
    guestEmail: 'AISHA@EXAMPLE.COM',
  });

  assert.equal(result.confirmationCode, 'ON-TESTCODE01');
  assert.equal(result.status, 'CONFIRMED');
});

test('ReservationService.lookupReservation rejects a mismatched email without leaking existence', async () => {
  const repository = {
    findByConfirmationCode: async () => makeReservation('CONFIRMED'),
  };
  const service = new ReservationService({ reservationRepository: repository });

  await assert.rejects(
    () =>
      service.lookupReservation({
        confirmationCode: 'ON-TESTCODE01',
        guestEmail: 'someone-else@example.com',
      }),
    (error) => error.statusCode === 404,
  );
});

test('ReservationService.lookupReservation rejects an unknown confirmation code', async () => {
  const repository = {
    findByConfirmationCode: async () => null,
  };
  const service = new ReservationService({ reservationRepository: repository });

  await assert.rejects(
    () =>
      service.lookupReservation({
        confirmationCode: 'ON-UNKNOWN01',
        guestEmail: 'aisha@example.com',
      }),
    (error) => error.statusCode === 404,
  );
});

test('ReservationService.cancelReservation cancels a PENDING reservation when code and email match', async () => {
  let updatedId;
  let updatePayload;
  const repository = {
    findByConfirmationCode: async (code) => {
      assert.equal(code, 'ON-TESTCODE01');
      return makeReservation('PENDING');
    },
    updateStatus: async (id, payload) => {
      updatedId = id;
      updatePayload = payload;
      return { ...makeReservation('CANCELLED'), ...payload };
    },
  };
  const service = new ReservationService({
    reservationRepository: repository,
    clock: () => new Date('2026-07-30T09:00:00.000Z'),
  });

  const result = await service.cancelReservation('ON-TESTCODE01', {
    guestEmail: 'aisha@example.com',
    reason: 'Travel change',
  });

  assert.equal(updatedId, 1n);
  assert.equal(updatePayload.status, 'CANCELLED');
  assert.equal(updatePayload.cancellationNote, 'Travel change');
  assert.deepEqual(updatePayload.cancelledAt, new Date('2026-07-30T09:00:00.000Z'));
  assert.equal(result.status, 'CANCELLED');
});

test('ReservationService.cancelReservation rejects a mismatched email without leaking existence', async () => {
  const repository = {
    findByConfirmationCode: async () => makeReservation('PENDING'),
  };
  const service = new ReservationService({ reservationRepository: repository });

  await assert.rejects(
    () =>
      service.cancelReservation('ON-TESTCODE01', {
        guestEmail: 'someone-else@example.com',
      }),
    (error) => error.statusCode === 404,
  );
});

test('ReservationService.cancelReservation refuses to cancel a reservation that is no longer cancellable', async () => {
  const repository = {
    findByConfirmationCode: async () => makeReservation('COMPLETED'),
  };
  const service = new ReservationService({ reservationRepository: repository });

  await assert.rejects(
    () =>
      service.cancelReservation('ON-TESTCODE01', {
        guestEmail: 'aisha@example.com',
      }),
    (error) => error.statusCode === 409,
  );
});

test('ReservationService allows only valid lifecycle transitions', async () => {
  let updatePayload;
  const repository = {
    findById: async () => makeReservation('CONFIRMED'),
    updateStatus: async (_id, payload) => {
      updatePayload = payload;
      return { ...makeReservation(payload.status), ...payload };
    },
  };
  const service = new ReservationService({
    reservationRepository: repository,
    clock: () => new Date('2026-07-30T09:00:00.000Z'),
  });

  const result = await service.updateReservationStatus('1', {
    status: 'CANCELLED',
    cancellationNote: 'Travel change',
  });

  assert.equal(updatePayload.status, 'CANCELLED');
  assert.equal(updatePayload.cancellationNote, 'Travel change');
  assert.equal(result.status, 'CANCELLED');
  await assert.rejects(
    () => service.updateReservationStatus('1', { status: 'COMPLETED' }),
    (error) => error.statusCode === 409,
  );
});
