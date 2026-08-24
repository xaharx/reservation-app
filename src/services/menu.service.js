const { env } = require('../config/env');
const { MenuRepository } = require('../repositories/menu.repository');
const { InMemoryCache } = require('../utils/in-memory-cache');
const { serializeForJson } = require('../utils/json-serializer');

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
                imageUrl: item.imageUrl,
              })),
          })),
      );
    });
  }
}

const menuService = new MenuService();

module.exports = { MenuService, menuService };
