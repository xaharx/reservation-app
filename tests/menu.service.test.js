const test = require('node:test');
const assert = require('node:assert/strict');
const { MenuService, isTransientGoogleThumbnailUrl } = require('../src/services/menu.service');
const { InMemoryCache } = require('../src/utils/in-memory-cache');

test('identifies Google Image Search thumbnails as transient sources', () => {
  assert.equal(
    isTransientGoogleThumbnailUrl(
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQexample&s=10',
    ),
    true,
  );
  assert.equal(isTransientGoogleThumbnailUrl('https://images.example.com/menu/bruschetta.jpg'), false);
});

test('omits transient Google thumbnails from the public menu response', async () => {
  const repository = {
    findPublishedMenu: async () => [
      {
        id: 1n,
        name: 'Antipasti',
        description: 'To start',
        items: [
          {
            id: 1n,
            name: 'Bruschetta',
            description: null,
            priceCents: 850,
            currency: 'usd',
            isAvailable: true,
            imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQexample&s=10',
          },
          {
            id: 2n,
            name: 'Carpaccio',
            description: null,
            priceCents: 1600,
            currency: 'usd',
            isAvailable: true,
            imageUrl: 'https://images.example.com/menu/carpaccio.jpg',
          },
        ],
      },
    ],
  };
  const service = new MenuService({
    repository,
    cache: new InMemoryCache(),
    cacheTtlMilliseconds: 1000,
  });

  const menu = await service.getMenu();

  assert.equal(menu[0].items[0].imageUrl, null);
  assert.equal(menu[0].items[1].imageUrl, 'https://images.example.com/menu/carpaccio.jpg');
});
