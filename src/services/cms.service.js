const { env } = require('../config/env');
const { CmsRepository } = require('../repositories/cms.repository');
const { InMemoryCache } = require('../utils/in-memory-cache');
const { serializeForJson } = require('../utils/json-serializer');

class CmsService {
  constructor({
    repository = new CmsRepository(),
    cache = new InMemoryCache(),
    cacheTtlMilliseconds = env.CACHE_TTL_SECONDS * 1000,
  } = {}) {
    this.repository = repository;
    this.cache = cache;
    this.cacheTtlMilliseconds = cacheTtlMilliseconds;
  }

  async getCached(key, loader) {
    const data = await this.cache.remember(key, this.cacheTtlMilliseconds, loader);
    return serializeForJson(data);
  }

  getHome() {
    return this.getCached('public:home', () => this.repository.findHomeContent());
  }

  getAbout() {
    return this.getCached('public:about', () => this.repository.findPublishedAbout());
  }

  getGallery() {
    return this.getCached('public:gallery', () => this.repository.findPublishedGallery());
  }

  getContact() {
    return this.getCached('public:contact', () => this.repository.findPublishedContacts());
  }

  getSettings() {
    return this.getCached('public:settings', () => this.repository.findPublicSettings());
  }

  getSocialMedia() {
    return this.getCached('public:social-media', () => this.repository.findPublishedSocialMedia());
  }
}

module.exports = { CmsService };
