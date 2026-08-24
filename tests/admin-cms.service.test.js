const test = require('node:test');
const assert = require('node:assert/strict');
const { AdminCmsService } = require('../src/services/admin-cms.service');

function makeFakeCache() {
  const invalidated = [];
  return { invalidated, invalidate: (key) => invalidated.push(key) };
}

function makeFakeRepository(overrides = {}) {
  return {
    createBanner: async (data) => ({ id: 1n, ...data }),
    updateBanner: async (id, data) => ({ id, ...data }),
    softDeleteBanner: async () => {},
    createAbout: async (data) => ({ id: 1n, ...data }),
    updateAbout: async (id, data) => ({ id, ...data }),
    softDeleteAbout: async () => {},
    createGalleryImage: async (data) => ({ id: 1n, ...data }),
    updateGalleryImage: async (id, data) => ({ id, ...data }),
    softDeleteGalleryImage: async () => {},
    findGalleryById: async () => ({ id: 1n, imageUrl: 'http://localhost:3000/uploads/gallery/abc.jpg' }),
    createContact: async (data) => ({ id: 1n, ...data }),
    updateContact: async (id, data) => ({ id, ...data }),
    softDeleteContact: async () => {},
    createSocialMedia: async (data) => ({ id: 1n, ...data }),
    updateSocialMedia: async (id, data) => ({ id, ...data }),
    softDeleteSocialMedia: async () => {},
    upsertSetting: async (settingKey, data) => ({ settingKey, ...data }),
    deleteSetting: async () => {},
    ...overrides,
  };
}

test('AdminCmsService.createBanner invalidates the home cache', async () => {
  const cache = makeFakeCache();
  const service = new AdminCmsService({ repository: makeFakeRepository(), cache });

  await service.createBanner({ title: 'Sale', imageUrl: 'x', placement: 'HOME_HERO' });

  assert.deepEqual(cache.invalidated, ['public:home']);
});

test('AdminCmsService.createAbout invalidates both about and home caches', async () => {
  const cache = makeFakeCache();
  const service = new AdminCmsService({ repository: makeFakeRepository(), cache });

  await service.createAbout({ sectionKey: 'story', title: 'Our Story', content: '...' });

  assert.deepEqual(cache.invalidated, ['public:about', 'public:home']);
});

test('AdminCmsService.createContact invalidates only the contact cache', async () => {
  const cache = makeFakeCache();
  const service = new AdminCmsService({ repository: makeFakeRepository(), cache });

  await service.createContact({ label: 'Main' });

  assert.deepEqual(cache.invalidated, ['public:contact']);
});

test('AdminCmsService.createSocialMedia invalidates only the social-media cache', async () => {
  const cache = makeFakeCache();
  const service = new AdminCmsService({ repository: makeFakeRepository(), cache });

  await service.createSocialMedia({ platform: 'instagram', profileUrl: 'https://instagram.com/x' });

  assert.deepEqual(cache.invalidated, ['public:social-media']);
});

test('AdminCmsService.upsertSetting invalidates only the settings cache', async () => {
  const cache = makeFakeCache();
  const service = new AdminCmsService({ repository: makeFakeRepository(), cache });

  await service.upsertSetting('reservation_lead_time_minutes', { value: 30 });

  assert.deepEqual(cache.invalidated, ['public:settings']);
});

test('AdminCmsService.deleteGalleryImage throws 404 when the image does not exist', async () => {
  const repository = makeFakeRepository({ findGalleryById: async () => null });
  const service = new AdminCmsService({ repository, cache: makeFakeCache() });

  await assert.rejects(
    () => service.deleteGalleryImage(999n),
    (error) => error.statusCode === 404,
  );
});

test('AdminCmsService.deleteGalleryImage invalidates gallery and home caches on success', async () => {
  const cache = makeFakeCache();
  const service = new AdminCmsService({ repository: makeFakeRepository(), cache });

  await service.deleteGalleryImage(1n);

  assert.deepEqual(cache.invalidated, ['public:gallery', 'public:home']);
});

test('AdminCmsService.deleteGalleryImage never throws even if the underlying file is already gone', async () => {
  // fs.unlink on a nonexistent path rejects — the service must swallow that,
  // never let a cleanup failure surface as an API error.
  const cache = makeFakeCache();
  const service = new AdminCmsService({ repository: makeFakeRepository(), cache });

  await assert.doesNotReject(() => service.deleteGalleryImage(1n));
});
