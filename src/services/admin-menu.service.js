const fs = require('fs/promises');
const path = require('path');
const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');
const { MenuRepository } = require('../repositories/menu.repository');
const { menuService } = require('./menu.service');
const { serializeForJson } = require('../utils/json-serializer');
const { menuUploadDir } = require('../config/upload');

/**
 * Admin-facing CRUD over the same tables the public MenuService reads. Every
 * write invalidates the 'public:menu' cache key, so an edit here shows up in
 * the mobile app immediately rather than after the cache TTL expires (see
 * menu.service.js's shared `menuService` singleton).
 */
class AdminMenuService {
  constructor({ repository = new MenuRepository(), cache = menuService.cache } = {}) {
    this.repository = repository;
    this.cache = cache;
  }

  async findOrThrowCategory(id) {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Menu category not found.');
    }
    return category;
  }

  async findOrThrowItem(id) {
    const item = await this.repository.findMenuItemById(id);
    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Menu item not found.');
    }
    return item;
  }

  async unlinkStoredImage(imageUrl) {
    if (!imageUrl || !imageUrl.includes('/uploads/')) {
      return;
    }
    const filename = imageUrl.split('/').pop();
    await fs.unlink(path.join(menuUploadDir, filename)).catch(() => {});
  }

  // ---- Categories ----
  async listCategories() {
    return serializeForJson(await this.repository.listCategories());
  }

  async createCategory(data) {
    const category = await this.repository.createCategory(data);
    this.cache.invalidate('public:menu');
    return serializeForJson(category);
  }

  async updateCategory(id, data) {
    await this.findOrThrowCategory(id);
    const category = await this.repository.updateCategory(id, data);
    this.cache.invalidate('public:menu');
    return serializeForJson(category);
  }

  async deleteCategory(id) {
    await this.findOrThrowCategory(id);

    const activeItemCount = await this.repository.countActiveItemsInCategory(id);
    if (activeItemCount > 0) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'This category still has menu items in it. Move or delete them first.',
      );
    }

    await this.repository.softDeleteCategory(id, new Date());
    this.cache.invalidate('public:menu');
  }

  // ---- Items ----
  async listItems() {
    return serializeForJson(await this.repository.listItems());
  }

  async createItem(data) {
    const category = await this.findOrThrowCategory(BigInt(data.categoryId));

    const item = await this.repository.createItem({ ...data, categoryId: category.id });
    this.cache.invalidate('public:menu');
    return serializeForJson(item);
  }

  async updateItem(id, data) {
    const existing = await this.findOrThrowItem(id);

    if (data.categoryId) {
      await this.findOrThrowCategory(BigInt(data.categoryId));
    }

    const item = await this.repository.updateItem(id, {
      ...data,
      ...(data.categoryId && { categoryId: BigInt(data.categoryId) }),
    });
    this.cache.invalidate('public:menu');

    // A new "image" file replaces the stored photo — data.imageUrl is only
    // set by the controller when one was actually uploaded (see
    // admin-menu.controller.js's withUploadedImageUrl). Best-effort cleanup
    // of the replaced file: the DB row is the source of truth either way,
    // so a failure here must never surface as an error to the admin.
    if (data.imageUrl && existing.imageUrl && data.imageUrl !== existing.imageUrl) {
      await this.unlinkStoredImage(existing.imageUrl);
    }

    return serializeForJson(item);
  }

  async deleteItem(id) {
    const item = await this.findOrThrowItem(id);

    await this.repository.softDeleteItem(id, new Date());
    this.cache.invalidate('public:menu');
    await this.unlinkStoredImage(item.imageUrl);
  }
}

module.exports = { AdminMenuService };
