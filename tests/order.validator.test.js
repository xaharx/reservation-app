const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderSchema } = require('../src/validators/order.validator');

function basePayload(overrides = {}) {
  return {
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
    ...overrides,
  };
}

test('createOrderSchema accepts a valid payload with a full delivery address', () => {
  const result = createOrderSchema.safeParse(basePayload());
  assert.equal(result.success, true);
  assert.deepEqual(result.data.deliveryAddress, {
    addressLine1: '123 Main Street',
    addressLine2: 'Apartment 4B',
    city: 'Miami',
    state: 'Florida',
    postalCode: '33101',
    country: 'USA',
  });
});

test('createOrderSchema accepts a delivery address with optional addressLine2/state omitted', () => {
  const result = createOrderSchema.safeParse(
    basePayload({
      deliveryAddress: {
        addressLine1: '123 Main Street',
        city: 'Miami',
        postalCode: '33101',
        country: 'USA',
      },
    }),
  );
  assert.equal(result.success, true);
  assert.equal(result.data.deliveryAddress.addressLine2, undefined);
  assert.equal(result.data.deliveryAddress.state, undefined);
});

test('createOrderSchema rejects an order with no deliveryAddress at all', () => {
  const payload = basePayload();
  delete payload.deliveryAddress;
  const result = createOrderSchema.safeParse(payload);
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'deliveryAddress'));
});

test('createOrderSchema rejects a delivery address missing addressLine1', () => {
  const payload = basePayload();
  delete payload.deliveryAddress.addressLine1;
  const result = createOrderSchema.safeParse(payload);
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((issue) => issue.path.join('.') === 'deliveryAddress.addressLine1'),
  );
});

test('createOrderSchema rejects a delivery address with an empty addressLine1', () => {
  const result = createOrderSchema.safeParse(
    basePayload({ deliveryAddress: { ...basePayload().deliveryAddress, addressLine1: '  ' } }),
  );
  assert.equal(result.success, false);
});

test('createOrderSchema rejects a delivery address missing city', () => {
  const payload = basePayload();
  delete payload.deliveryAddress.city;
  const result = createOrderSchema.safeParse(payload);
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'deliveryAddress.city'));
});

test('createOrderSchema rejects a delivery address missing postalCode', () => {
  const payload = basePayload();
  delete payload.deliveryAddress.postalCode;
  const result = createOrderSchema.safeParse(payload);
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((issue) => issue.path.join('.') === 'deliveryAddress.postalCode'),
  );
});

test('createOrderSchema rejects a delivery address with a malformed postalCode', () => {
  const result = createOrderSchema.safeParse(
    basePayload({
      deliveryAddress: { ...basePayload().deliveryAddress, postalCode: '@@@' },
    }),
  );
  assert.equal(result.success, false);
});

test('createOrderSchema rejects a delivery address missing country', () => {
  const payload = basePayload();
  delete payload.deliveryAddress.country;
  const result = createOrderSchema.safeParse(payload);
  assert.equal(result.success, false);
  assert.ok(
    result.error.issues.some((issue) => issue.path.join('.') === 'deliveryAddress.country'),
  );
});

test('createOrderSchema rejects a delivery address field with the wrong data type', () => {
  const result = createOrderSchema.safeParse(
    basePayload({ deliveryAddress: { ...basePayload().deliveryAddress, addressLine1: 12345 } }),
  );
  assert.equal(result.success, false);
});

test('createOrderSchema rejects an excessively long addressLine1', () => {
  const result = createOrderSchema.safeParse(
    basePayload({
      deliveryAddress: { ...basePayload().deliveryAddress, addressLine1: 'A'.repeat(256) },
    }),
  );
  assert.equal(result.success, false);
});

test('createOrderSchema rejects unknown fields inside deliveryAddress', () => {
  const result = createOrderSchema.safeParse(
    basePayload({
      deliveryAddress: { ...basePayload().deliveryAddress, latitude: 25.7617 },
    }),
  );
  assert.equal(result.success, false);
});

test('createOrderSchema trims whitespace on delivery address fields', () => {
  const result = createOrderSchema.safeParse(
    basePayload({
      deliveryAddress: {
        addressLine1: '  123 Main Street  ',
        city: '  Miami  ',
        postalCode: '  33101  ',
        country: '  USA  ',
      },
    }),
  );
  assert.equal(result.success, true);
  assert.equal(result.data.deliveryAddress.addressLine1, '123 Main Street');
  assert.equal(result.data.deliveryAddress.city, 'Miami');
  assert.equal(result.data.deliveryAddress.postalCode, '33101');
  assert.equal(result.data.deliveryAddress.country, 'USA');
});
