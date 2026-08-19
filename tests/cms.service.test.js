const test = require('node:test');
const assert = require('node:assert/strict');
const { CmsService } = require('../src/services/cms.service');
const { InMemoryCache } = require('../src/utils/in-memory-cache');

test('CmsService caches public gallery reads and serializes BigInt values', async () => {
  let galleryReads = 0;
  const repository = {
    findPublishedGallery: async () => {
      galleryReads += 1;
      return [{ id: 42n, imageUrl: 'https://cdn.example.com/gallery.jpg' }];
    },
  };
  const service = new CmsService({
    repository,
    cache: new InMemoryCache(),
    cacheTtlMilliseconds: 60_000,
  });

  const firstResponse = await service.getGallery();
  const secondResponse = await service.getGallery();

  assert.equal(galleryReads, 1);
  assert.deepEqual(firstResponse, secondResponse);
  assert.equal(firstResponse[0].id, '42');
});
