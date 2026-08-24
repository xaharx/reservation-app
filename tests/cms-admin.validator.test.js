const test = require('node:test');
const assert = require('node:assert/strict');
const {
  bannerSchema,
  bannerUpdateSchema,
  contactSchema,
  galleryCreateSchema,
  galleryUpdateSchema,
  settingSchema,
} = require('../src/validators/cms-admin.validator');

test('bannerSchema requires title, imageUrl, and a valid placement', () => {
  const result = bannerSchema.safeParse({ title: 'Sale', imageUrl: 'https://x/y.jpg', placement: 'HOME_HERO' });
  assert.equal(result.success, true);
  assert.equal(result.data.sortOrder, 0);
  assert.equal(result.data.isPublished, false);
});

test('bannerSchema rejects an invalid placement', () => {
  const result = bannerSchema.safeParse({ title: 'Sale', imageUrl: 'x', placement: 'NOT_REAL' });
  assert.equal(result.success, false);
});

test('bannerUpdateSchema does not force defaults onto fields the caller omitted', () => {
  const result = bannerUpdateSchema.safeParse({ title: 'New title only' });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { title: 'New title only' });
  assert.equal('sortOrder' in result.data, false);
  assert.equal('isPublished' in result.data, false);
});

test('contactSchema validates latitude/longitude bounds', () => {
  const valid = contactSchema.safeParse({ label: 'Main', latitude: 45, longitude: 90 });
  assert.equal(valid.success, true);

  const invalid = contactSchema.safeParse({ label: 'Main', latitude: 999 });
  assert.equal(invalid.success, false);
});

test('galleryCreateSchema treats the string "false" as actually false', () => {
  const result = galleryCreateSchema.safeParse({ isPublished: 'false' });
  assert.equal(result.success, true);
  assert.equal(result.data.isPublished, false);
});

test('galleryUpdateSchema leaves isPublished untouched when omitted', () => {
  const result = galleryUpdateSchema.safeParse({ title: 'New caption' });
  assert.equal(result.success, true);
  assert.equal('isPublished' in result.data, false);
});

test('settingSchema accepts any JSON-serializable value', () => {
  const result = settingSchema.safeParse({ value: { nested: [1, 2, 3] } });
  assert.equal(result.success, true);
});

test('settingSchema rejects unknown top-level fields', () => {
  const result = settingSchema.safeParse({ value: 1, settingKey: 'sneaky' });
  assert.equal(result.success, false);
});
