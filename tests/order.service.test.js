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
    deliveryAddressLine1: '123 Main Street',
    deliveryAddressLine2: 'Apartment 4B',
    deliveryCity: 'Miami',
    deliveryState: 'Florida',
    deliveryPostalCode: '33101',
    deliveryCountry: 'USA',
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
    deliveryAddress: {
      addressLine1: '123 Main Street',
      addressLine2: 'Apartment 4B',
      city: 'Miami',
      state: 'Florida',
      postalCode: '33101',
      country: 'USA',
    },
  });

  assert.equal(createPayload.guestName, 'Aisha Khan');
  assert.equal(createPayload.subtotalCents, 2400);
  assert.equal(createPayload.totalCents, 2400);
  assert.equal(createPayload.items.create[0].lineCents, 2400);
  assert.equal(createPayload.deliveryAddressLine1, '123 Main Street');
  assert.equal(createPayload.deliveryAddressLine2, 'Apartment 4B');
  assert.equal(createPayload.deliveryCity, 'Miami');
  assert.equal(createPayload.deliveryState, 'Florida');
  assert.equal(createPayload.deliveryPostalCode, '33101');
  assert.equal(createPayload.deliveryCountry, 'USA');
  assert.equal(checkoutArgs.currency, 'usd');
  assert.equal(checkoutArgs.lineItems[0].unitCents, 2400);
  assert.match(checkoutArgs.successUrl, /status=success&confirmationCode=OD-TESTCODE01/);
  assert.equal(updatePayload.paymentReference, 'cs_test_123');
  assert.equal(result.order.confirmationCode, 'OD-TESTCODE01');
  assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/cs_test_123');
  // The order response echoes back exactly what was submitted, so the guest
  // (and the restaurant) can see where this order is meant to be delivered.
  assert.deepEqual(result.order.deliveryAddress, {
    addressLine1: '123 Main Street',
    addressLine2: 'Apartment 4B',
    city: 'Miami',
    state: 'Florida',
    postalCode: '33101',
    country: 'USA',
  });
});

test('OrderService.createOrder omits optional addressLine2/state from the stored order when not provided', async () => {
  let createPayload;
  const service = new OrderService({
    menuRepository: { findManyMenuItemsByIds: async () => [makeMenuItem()] },
    orderRepository: {
      create: async (data) => {
        createPayload = data;
        return makeOrder({ deliveryAddressLine2: null, deliveryState: null });
      },
      updateStatus: async (_id, data) => makeOrder({ ...data, deliveryAddressLine2: null, deliveryState: null }),
    },
    stripeGateway: {
      createCheckoutSession: async () => ({ id: 'cs_test_123', url: 'https://checkout.stripe.com/cs_test_123' }),
    },
    confirmationCodeGenerator: () => 'OD-TESTCODE01',
  });

  const result = await service.createOrder({
    firstName: 'Aisha',
    lastName: 'Khan',
    email: 'aisha@example.com',
    phone: '+923001234567',
    items: [{ menuItemId: '1', quantity: 1 }],
    deliveryAddress: {
      addressLine1: '123 Main Street',
      city: 'Miami',
      postalCode: '33101',
      country: 'USA',
    },
  });

  assert.equal(createPayload.deliveryAddressLine2, null);
  assert.equal(createPayload.deliveryState, null);
  assert.equal(result.order.deliveryAddress.addressLine2, null);
  assert.equal(result.order.deliveryAddress.state, null);
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
        deliveryAddress: {
          addressLine1: '123 Main Street',
          city: 'Miami',
          postalCode: '33101',
          country: 'USA',
        },
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
  assert.equal(result.deliveryAddress.addressLine1, '123 Main Street');
  assert.equal(result.deliveryAddress.city, 'Miami');
});

test('OrderService.lookupOrder returns a null deliveryAddress for an order placed before this feature existed', async () => {
  const service = new OrderService({
    orderRepository: {
      findByConfirmationCode: async () =>
        makeOrder({
          deliveryAddressLine1: null,
          deliveryAddressLine2: null,
          deliveryCity: null,
          deliveryState: null,
          deliveryPostalCode: null,
          deliveryCountry: null,
        }),
    },
  });

  const result = await service.lookupOrder({
    confirmationCode: 'OD-TESTCODE01',
    guestEmail: 'aisha@example.com',
  });

  assert.equal(result.deliveryAddress, null);
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

test('OrderService.getOrderById returns the order for a valid id', async () => {
  const service = new OrderService({
    orderRepository: {
      findById: async (id) => {
        assert.equal(id, 1n);
        return makeOrder();
      },
    },
  });

  const result = await service.getOrderById('1');

  assert.equal(result.confirmationCode, 'OD-TESTCODE01');
  assert.deepEqual(result.deliveryAddress, {
    addressLine1: '123 Main Street',
    addressLine2: 'Apartment 4B',
    city: 'Miami',
    state: 'Florida',
    postalCode: '33101',
    country: 'USA',
  });
});

test('OrderService.getOrderById rejects an unknown id', async () => {
  const service = new OrderService({
    orderRepository: { findById: async () => null },
  });

  await assert.rejects(
    () => service.getOrderById('999'),
    (error) => error.statusCode === 404,
  );
});

test('OrderService.listOrders passes search/sort through to the repository', async () => {
  let capturedArgs;
  const service = new OrderService({
    orderRepository: {
      findMany: async (args) => {
        capturedArgs = args;
        return { orders: [], total: 0 };
      },
    },
  });

  await service.listOrders({
    page: 2,
    limit: 10,
    status: 'PAID',
    search: 'aisha',
    sortBy: 'guestName',
    sortDir: 'asc',
  });

  assert.equal(capturedArgs.skip, 10);
  assert.equal(capturedArgs.take, 10);
  assert.equal(capturedArgs.status, 'PAID');
  assert.equal(capturedArgs.search, 'aisha');
  assert.equal(capturedArgs.sortBy, 'guestName');
  assert.equal(capturedArgs.sortDir, 'asc');
});

test('OrderService.getOrderStats aggregates status counts, today, and paid-only revenue from real data', async () => {
  const service = new OrderService({
    orderRepository: {
      countByStatus: async () => [
        { status: 'PAID', _count: { _all: 4 } },
        { status: 'COMPLETED', _count: { _all: 9 } },
      ],
      countByDateRange: async ({ from, to } = {}) => {
        if (from && to) return 3; // today
        return 0;
      },
      sumPaidRevenueCents: async () => 45600,
    },
    clock: () => new Date('2026-08-24T15:00:00.000Z'),
  });

  const stats = await service.getOrderStats();

  assert.equal(stats.today, 3);
  assert.equal(stats.revenueCents, 45600);
  assert.equal(stats.byStatus.PAID, 4);
  assert.equal(stats.byStatus.COMPLETED, 9);
  // Statuses with no rows from the DB must still be present, at 0 — not
  // omitted, so the dashboard can render every status without guarding.
  assert.equal(stats.byStatus.PENDING_PAYMENT, 0);
  assert.equal(stats.byStatus.PREPARING, 0);
  assert.equal(stats.byStatus.READY, 0);
  assert.equal(stats.byStatus.CANCELLED, 0);
});

test('OrderService.updateOrderStatus allows a valid staff transition (PAID -> PREPARING) without touching payment', async () => {
  let updatePayload;
  const service = new OrderService({
    orderRepository: {
      findById: async () => makeOrder({ status: 'PAID', paymentStatus: 'PAID' }),
      updateStatus: async (_id, data) => {
        updatePayload = data;
        return makeOrder({ ...data });
      },
    },
  });

  const result = await service.updateOrderStatus('1', { status: 'PREPARING' });

  assert.deepEqual(updatePayload, { status: 'PREPARING' });
  assert.equal(result.status, 'PREPARING');
});

test('OrderService.updateOrderStatus rejects an invalid lifecycle transition', async () => {
  const service = new OrderService({
    orderRepository: { findById: async () => makeOrder({ status: 'PENDING_PAYMENT' }) },
  });

  await assert.rejects(
    () => service.updateOrderStatus('1', { status: 'COMPLETED' }),
    (error) => error.statusCode === 409,
  );
});

test('OrderService.updateOrderStatus rejects an unknown order id', async () => {
  const service = new OrderService({
    orderRepository: { findById: async () => null },
  });

  await assert.rejects(
    () => service.updateOrderStatus('999', { status: 'PREPARING' }),
    (error) => error.statusCode === 404,
  );
});

test('OrderService.updateOrderStatus cancelling a paid order refunds via Stripe, same as guest self-cancel', async () => {
  let refundArgs;
  let updatePayload;
  const service = new OrderService({
    orderRepository: {
      findById: async () =>
        makeOrder({ status: 'PREPARING', paymentStatus: 'PAID', paymentReference: 'pi_test_456' }),
      updateStatus: async (_id, data) => {
        updatePayload = data;
        return makeOrder({ ...data });
      },
    },
    stripeGateway: {
      refundPayment: async (args) => {
        refundArgs = args;
        return {};
      },
    },
    clock: () => new Date('2026-07-30T09:00:00.000Z'),
  });

  const result = await service.updateOrderStatus('1', {
    status: 'CANCELLED',
    cancellationNote: 'Kitchen ran out of stock',
  });

  assert.equal(refundArgs.paymentIntentId, 'pi_test_456');
  assert.equal(updatePayload.paymentStatus, 'REFUNDED');
  assert.equal(updatePayload.cancellationNote, 'Kitchen ran out of stock');
  assert.equal(result.status, 'CANCELLED');
  assert.equal(result.paymentStatus, 'REFUNDED');
});
