const test = require('node:test');
const assert = require('node:assert/strict');
const {
  menuCategorySchema,
  menuCategoryUpdateSchema,
  menuItemSchema,
  menuItemUpdateSchema,
} = require('../src/validators/menu-admin.validator');

test('menuCategorySchema requires a name and defaults sortOrder/isPublished', () => {
  const result = menuCategorySchema.safeParse({ name: 'Starters' });
  assert.equal(result.success, true);
  assert.equal(result.data.sortOrder, 0);
  assert.equal(result.data.isPublished, true);
});

test('menuCategorySchema rejects an empty name', () => {
  const result = menuCategorySchema.safeParse({ name: '' });
  assert.equal(result.success, false);
});

test('menuCategoryUpdateSchema does not force defaults onto fields the caller omitted', () => {
  const result = menuCategoryUpdateSchema.safeParse({ name: 'Small Plates' });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { name: 'Small Plates' });
  assert.equal('sortOrder' in result.data, false);
  assert.equal('isPublished' in result.data, false);
});

test('menuItemSchema requires categoryId, name, and priceCents, and coerces multipart string fields', () => {
  const result = menuItemSchema.safeParse({
    categoryId: '1',
    name: 'Tiramisu',
    priceCents: '900',
    isAvailable: 'false',
  });
  assert.equal(result.success, true);
  assert.equal(result.data.priceCents, 900);
  assert.equal(result.data.isAvailable, false);
  assert.equal(result.data.currency, 'usd');
  assert.equal(result.data.isPublished, true);
});

test('menuItemSchema rejects a non-numeric categoryId', () => {
  const result = menuItemSchema.safeParse({ categoryId: 'abc', name: 'Tiramisu', priceCents: 900 });
  assert.equal(result.success, false);
});

test('menuItemSchema treats the multipart string "false" as actually false, not truthy', () => {
  const result = menuItemSchema.safeParse({
    categoryId: '1',
    name: 'Tiramisu',
    priceCents: 900,
    isPublished: 'false',
  });
  assert.equal(result.success, true);
  assert.equal(result.data.isPublished, false);
});

test('menuItemUpdateSchema leaves isAvailable/isPublished untouched when omitted', () => {
  const result = menuItemUpdateSchema.safeParse({ name: 'Tiramisu al Caffè' });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { name: 'Tiramisu al Caffè' });
  assert.equal('isAvailable' in result.data, false);
  assert.equal('isPublished' in result.data, false);
  assert.equal('sortOrder' in result.data, false);
});

test('menuItemUpdateSchema rejects unknown fields', () => {
  const result = menuItemUpdateSchema.safeParse({ name: 'x', imageUrl: 'sneaky' });
  assert.equal(result.success, false);
});
