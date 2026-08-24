const fs = require('fs/promises');
const path = require('path');
const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');
const { CmsRepository } = require('../repositories/cms.repository');
const { cmsService } = require('./cms.service');
const { serializeForJson } = require('../utils/json-serializer');
const { galleryUploadDir } = require('../config/upload');

/**
 * Admin-facing CRUD over the same tables the public CmsService reads. Every
 * write invalidates whichever public cache key(s) that content feeds, so an
 * edit here shows up in the mobile app immediately rather than after the
 * cache TTL expires (see cms.service.js's shared `cmsService` singleton).
 */
class AdminCmsService {
  constructor({ repository = new CmsRepository(), cache = cmsService.cache } = {}) {
    this.repository = repository;
    this.cache = cache;
  }

  async findOrThrow(finder, id, notFoundMessage) {
    const record = await finder(id);
    if (!record) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, notFoundMessage);
    }
    return record;
  }

  // ---- Banners ----
  async listBanners() {
    return serializeForJson(await this.repository.listBanners());
  }

  async createBanner(data) {
    const banner = await this.repository.createBanner(data);
    this.cache.invalidate('public:home');
    return serializeForJson(banner);
  }

  async updateBanner(id, data) {
    const banner = await this.repository.updateBanner(id, data);
    this.cache.invalidate('public:home');
    return serializeForJson(banner);
  }

  async deleteBanner(id) {
    await this.repository.softDeleteBanner(id, new Date());
    this.cache.invalidate('public:home');
  }

  // ---- About ----
  async listAbout() {
    return serializeForJson(await this.repository.listAbout());
  }

  async createAbout(data) {
    const about = await this.repository.createAbout(data);
    this.cache.invalidate('public:about');
    this.cache.invalidate('public:home');
    return serializeForJson(about);
  }

  async updateAbout(id, data) {
    const about = await this.repository.updateAbout(id, data);
    this.cache.invalidate('public:about');
    this.cache.invalidate('public:home');
    return serializeForJson(about);
  }

  async deleteAbout(id) {
    await this.repository.softDeleteAbout(id, new Date());
    this.cache.invalidate('public:about');
    this.cache.invalidate('public:home');
  }

  // ---- Gallery ----
  async listGallery() {
    return serializeForJson(await this.repository.listAllGallery());
  }

  async createGalleryImage(data) {
    const image = await this.repository.createGalleryImage(data);
    this.cache.invalidate('public:gallery');
    this.cache.invalidate('public:home');
    return serializeForJson(image);
  }

  async updateGalleryImage(id, data) {
    const image = await this.repository.updateGalleryImage(id, data);
    this.cache.invalidate('public:gallery');
    this.cache.invalidate('public:home');
    return serializeForJson(image);
  }

  async deleteGalleryImage(id) {
    const image = await this.findOrThrow(
      (imageId) => this.repository.findGalleryById(imageId),
      id,
      'Gallery image not found.',
    );

    await this.repository.softDeleteGalleryImage(id, new Date());
    this.cache.invalidate('public:gallery');
    this.cache.invalidate('public:home');

    // Best-effort cleanup of the underlying file — the DB row is the source
    // of truth either way, so a failure here (e.g. already missing) must
    // never surface as an error to the admin.
    if (image.imageUrl && image.imageUrl.includes(`/uploads/`)) {
      const filename = image.imageUrl.split('/').pop();
      await fs.unlink(path.join(galleryUploadDir, filename)).catch(() => {});
    }
  }

  // ---- Contact ----
  async listContacts() {
    return serializeForJson(await this.repository.listContacts());
  }

  async createContact(data) {
    const contact = await this.repository.createContact(data);
    this.cache.invalidate('public:contact');
    return serializeForJson(contact);
  }

  async updateContact(id, data) {
    const contact = await this.repository.updateContact(id, data);
    this.cache.invalidate('public:contact');
    return serializeForJson(contact);
  }

  async deleteContact(id) {
    await this.repository.softDeleteContact(id, new Date());
    this.cache.invalidate('public:contact');
  }

  // ---- Social media ----
  async listSocialMedia() {
    return serializeForJson(await this.repository.listAllSocialMedia());
  }

  async createSocialMedia(data) {
    const entry = await this.repository.createSocialMedia(data);
    this.cache.invalidate('public:social-media');
    return serializeForJson(entry);
  }

  async updateSocialMedia(id, data) {
    const entry = await this.repository.updateSocialMedia(id, data);
    this.cache.invalidate('public:social-media');
    return serializeForJson(entry);
  }

  async deleteSocialMedia(id) {
    await this.repository.softDeleteSocialMedia(id, new Date());
    this.cache.invalidate('public:social-media');
  }

  // ---- Settings ----
  async listSettings() {
    return serializeForJson(await this.repository.listAllSettings());
  }

  async upsertSetting(settingKey, data) {
    const setting = await this.repository.upsertSetting(settingKey, data);
    this.cache.invalidate('public:settings');
    return serializeForJson(setting);
  }

  async deleteSetting(settingKey) {
    await this.repository.deleteSetting(settingKey);
    this.cache.invalidate('public:settings');
  }
}

module.exports = { AdminCmsService };
