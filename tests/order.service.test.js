const test = require('node:test');
const assert = require('node:assert/strict');
const { OrderService } = require('../src/services/order.service');

function makeMenuItem(overrides = {}) {
  return {
    id: 1n,
    name: 'Tagliatelle al Tartufo',
    priceCents: 2400,
    currency: 'usd',
    isPublished: true,
    isAvailable: true,
    deletedAt: null,
    ...overrides,
  };
}

function makeOrder(overrides = {}) {
  return {
    id: 1n,
    confirmationCode: 'OD-TESTCODE01',
    guestName: 'Aisha Khan',
    guestEmail: 'aisha@example.com',
    guestPhone: '+923001234567',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    paymentReference: 'cs_test_123',
    currency: 'usd',
    subtotalCents: 2400,
    totalCents: 2400,
    notes: null,
    items: [
      {
        id: 1n,
        menuItemId: 1n,
        itemName: 'Tagliatelle al Tartufo',
        unitCents: 2400,
        quantity: 1,
        lineCents: 2400,
        notes: null,
      },
    ],
    paidAt: null,
    cancelledAt: null,
    cancellationNote: null,
    createdAt: new Date('2026-07-30T08:00:00.000Z'),
    updatedAt: new Date('2026-07-30T08:00:00.000Z'),
    ...overrides,
  };
}

test('OrderService.createOrder computes totals, creates the order, and starts a Checkout Session', async () => {
  let createPayload;
  let updatePayload;
  let checkoutArgs;

  const service = new OrderService({
    menuRepository: {
      findManyMenuItemsByIds: async () => [makeMenuItem()],
    },
    orderRepository: {
      create: async (data) => {
        createPayload = data;
        return makeOrder();
      },
      updateStatus: async (_id, data) => {
        updatePayload = data;
        return makeOrder({ paymentReference: data.paymentReference });
      },
    },
    stripeGateway: {
      createCheckoutSession: async (args) => {
        checkoutArgs = args;
        return { id: 'cs_test_123', url: 'https://checkout.stripe.com/cs_test_123' };
      },
    },
    confirmationCodeGenerator: () => 'OD-TESTCODE01',
    checkoutReturnScheme: 'reservationapp://checkout-complete',
  });

  const result = await service.createOrder({
    firstName: 'Aisha',
    lastName: 'Khan',
    email: 'aisha@example.com',
    phone: '+923001234567',
    items: [{ menuItemId: '1', quantity: 1 }],
  });

  assert.equal(createPayload.guestName, 'Aisha Khan');
  assert.equal(createPayload.subtotalCents, 2400);
  assert.equal(createPayload.totalCents, 2400);
  assert.equal(createPayload.items.create[0].lineCents, 2400);
  assert.equal(checkoutArgs.currency, 'usd');
  assert.equal(checkoutArgs.lineItems[0].unitCents, 2400);
  assert.match(checkoutArgs.successUrl, /status=success&confirmationCode=OD-TESTCODE01/);
  assert.equal(updatePayload.paymentReference, 'cs_test_123');
  assert.equal(result.order.confirmationCode, 'OD-TESTCODE01');
  assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/cs_test_123');
});

test('OrderService.createOrder cancels the order and hides Stripe details if Checkout Session creation fails', async () => {
  let updatePayload;
  const service = new OrderService({
    menuRepository: {
      findManyMenuItemsByIds: async () => [makeMenuItem()],
    },
    orderRepository: {
      create: async () => makeOrder(),
      updateStatus: async (_id, data) => {
        updatePayload = data;
        return makeOrder({ ...data });
      },
    },
    stripeGateway: {
      createCheckoutSession: async () => {
        throw new Error('Invalid API Key provided: sk_test_***');
      },
    },
    confirmationCodeGenerator: () => 'OD-TESTCODE01',
  });

  await assert.rejects(
    () =>
      service.createOrder({
        firstName: 'Aisha',
        lastName: 'Khan',
        email: 'aisha@example.com',
        phone: '+923001234567',
        items: [{ menuItemId: '1', quantity: 1 }],
      }),
    (error) => {
      assert.equal(error.statusCode, 500);
      assert.doesNotMatch(error.message, /sk_test/);
      assert.equal(error.details, undefined);
      return true;
    },
  );

  assert.equal(updatePayload.status, 'CANCELLED');
});

test('OrderService.createOrder rejects an unavailable menu item', async () => {
  const service = new OrderService({
    menuRepository: {
      findManyMenuItemsByIds: async () => [makeMenuItem({ isAvailable: false })],
    },
    orderRepository: { create: async () => makeOrder() },
    stripeGateway: { createCheckoutSession: async () => ({ id: 'x', url: 'https://x' }) },
  });

  await assert.rejects(
    () =>
      service.createOrder({
        firstName: 'Aisha',
        lastName: 'Khan',
        email: 'aisha@example.com',
        phone: '+923001234567',
        items: [{ menuItemId: '1', quantity: 1 }],
      }),
    (error) => error.statusCode === 422,
  );
});

test('OrderService.lookupOrder returns the order when code and email match', async () => {
  const service = new OrderService({
    orderRepository: {
      findByConfirmationCode: async (code) => {
        assert.equal(code, 'OD-TESTCODE01');
        return makeOrder();
      },
    },
  });

  const result = await service.lookupOrder({
    confirmationCode: 'OD-TESTCODE01',
    guestEmail: 'AISHA@EXAMPLE.COM',
  });

  assert.equal(result.confirmationCode, 'OD-TESTCODE01');
  assert.equal(result.items[0].itemName, 'Tagliatelle al Tartufo');
});

test('OrderService.lookupOrder rejects a mismatched email without leaking existence', async () => {
  const service = new OrderService({
    orderRepository: { findByConfirmationCode: async () => makeOrder() },
  });

  await assert.rejects(
    () =>
      service.lookupOrder({ confirmationCode: 'OD-TESTCODE01', guestEmail: 'nope@example.com' }),
    (error) => error.statusCode === 404,
  );
});

test('OrderService.cancelOrder cancels a pending order without issuing a refund', async () => {
  let refundCalled = false;
  let updatePayload;
  const service = new OrderService({
    orderRepository: {
      findByConfirmationCode: async () => makeOrder({ status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' }),
      updateStatus: async (_id, data) => {
        updatePayload = data;
        return makeOrder({ ...data });
      },
    },
    stripeGateway: {
      refundPayment: async () => {
        refundCalled = true;
        return {};
      },
    },
    clock: () => new Date('2026-07-30T09:00:00.000Z'),
  });

  const result = await service.cancelOrder('OD-TESTCODE01', {
    guestEmail: 'aisha@example.com',
    reason: 'Changed my mind',
  });

  assert.equal(refundCalled, false);
  assert.equal(updatePayload.status, 'CANCELLED');
  assert.equal(updatePayload.paymentStatus, 'PENDING');
  assert.equal(result.status, 'CANCELLED');
});

test('OrderService.cancelOrder refunds a paid order via Stripe', async () => {
  let refundArgs;
  const service = new OrderService({
    orderRepository: {
      findByConfirmationCode: async () =>
        makeOrder({ status: 'PAID', paymentStatus: 'PAID', paymentReference: 'pi_test_456' }),
      updateStatus: async (_id, data) => makeOrder({ ...data }),
    },
    stripeGateway: {
      refundPayment: async (args) => {
        refundArgs = args;
        return {};
      },
    },
    clock: () => new Date('2026-07-30T09:00:00.000Z'),
  });

  const result = await service.cancelOrder('OD-TESTCODE01', { guestEmail: 'aisha@example.com' });

  assert.equal(refundArgs.paymentIntentId, 'pi_test_456');
  assert.equal(result.paymentStatus, 'REFUNDED');
});

test('OrderService.cancelOrder refuses to cancel an order that is no longer cancellable', async () => {
  const service = new OrderService({
    orderRepository: {
      findByConfirmationCode: async () => makeOrder({ status: 'COMPLETED' }),
    },
  });

  await assert.rejects(
    () => service.cancelOrder('OD-TESTCODE01', { guestEmail: 'aisha@example.com' }),
    (error) => error.statusCode === 409,
  );
});

test('OrderService.handleCheckoutCompleted marks a matching order as paid', async () => {
  let updatePayload;
  const service = new OrderService({
    orderRepository: {
      findByConfirmationCode: async () => makeOrder({ status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' }),
      updateStatus: async (_id, data) => {
        updatePayload = data;
        return makeOrder({ ...data });
      },
    },
    clock: () => new Date('2026-07-30T09:05:00.000Z'),
  });

  await service.handleCheckoutCompleted({
    client_reference_id: 'OD-TESTCODE01',
    payment_intent: 'pi_test_789',
    metadata: { confirmationCode: 'OD-TESTCODE01' },
  });

  assert.equal(updatePayload.status, 'PAID');
  assert.equal(updatePayload.paymentStatus, 'PAID');
  assert.equal(updatePayload.paymentReference, 'pi_test_789');
});

test('OrderService.handleCheckoutCompleted is a no-op for an already-paid order', async () => {
  let updateCalled = false;
  const service = new OrderService({
    orderRepository: {
      findByConfirmationCode: async () => makeOrder({ status: 'PAID', paymentStatus: 'PAID' }),
      updateStatus: async () => {
        updateCalled = true;
      },
    },
  });

  await service.handleCheckoutCompleted({
    client_reference_id: 'OD-TESTCODE01',
    payment_intent: 'pi_test_789',
  });

  assert.equal(updateCalled, false);
});
