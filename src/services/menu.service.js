const { env } = require('../config/env');
const { MenuRepository } = require('../repositories/menu.repository');
const { InMemoryCache } = require('../utils/in-memory-cache');
const { serializeForJson } = require('../utils/json-serializer');

// Google Image Search thumbnail hosts are short-lived proxy URLs, not image
// storage. They intermittently fail on iOS (and can disappear at any time),
// so never publish them to native clients as menu artwork. Menu photos should
// instead be uploaded through the existing admin image upload flow, which
// stores a stable URL in the menu_items.image_url column.
function isTransientGoogleThumbnailUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    return /^encrypted-tbn\d+\.gstatic\.com$/i.test(new URL(value).hostname);
  } catch {
    // Leave malformed/other URLs alone so the native client's normal error
    // fallback handles them without changing the public API contract.
    return false;
  }
}

class MenuService {
  constructor({
    repository = new MenuRepository(),
    cache = new InMemoryCache(),
    cacheTtlMilliseconds = env.CACHE_TTL_SECONDS * 1000,
  } = {}) {
    this.repository = repository;
    this.cache = cache;
    this.cacheTtlMilliseconds = cacheTtlMilliseconds;
  }

  getMenu() {
    return this.cache.remember('public:menu', this.cacheTtlMilliseconds, async () => {
      const categories = await this.repository.findPublishedMenu();
      return serializeForJson(
        categories
          .filter((category) => category.items.length > 0)
          .map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            items: category.items
              .filter((item) => item.isAvailable)
              .map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                priceCents: item.priceCents,
                currency: item.currency,
                imageUrl: isTransientGoogleThumbnailUrl(item.imageUrl) ? null : item.imageUrl,
              })),
          })),
      );
    });
  }
}

const menuService = new MenuService();

module.exports = { MenuService, menuService, isTransientGoogleThumbnailUrl };
