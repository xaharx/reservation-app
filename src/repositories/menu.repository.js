const { prisma } = require('../config/database');

class MenuRepository {
  constructor(database = prisma) {
    this.database = database;
  }

  findPublishedMenu() {
    return this.database.menuCategory.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        items: {
          where: { isPublished: true, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }

  findMenuItemById(id) {
    return this.database.menuItem.findUnique({ where: { id } });
  }

  findManyMenuItemsByIds(ids) {
    return this.database.menuItem.findMany({ where: { id: { in: ids } } });
  }

  // ---- Admin (write) methods below. Public read methods above stay
  // untouched — the admin panel manages the same tables but always sees
  // everything (including unpublished/unavailable/soft-deleted-aware
  // listings), never the cached/published-only view the mobile app gets. ----

  listCategories() {
    return this.database.menuCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findCategoryById(id) {
    return this.database.menuCategory.findUnique({ where: { id } });
  }

  createCategory(data) {
    return this.database.menuCategory.create({ data });
  }

  updateCategory(id, data) {
    return this.database.menuCategory.update({ where: { id }, data });
  }

  softDeleteCategory(id, deletedAt) {
    return this.database.menuCategory.update({ where: { id }, data: { deletedAt } });
  }

  /** Used to block deleting a category that still has active items in it. */
  countActiveItemsInCategory(categoryId) {
    return this.database.menuItem.count({ where: { categoryId, deletedAt: null } });
  }

  listItems() {
    return this.database.menuItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  createItem(data) {
    return this.database.menuItem.create({ data });
  }

  updateItem(id, data) {
    return this.database.menuItem.update({ where: { id }, data });
  }

  softDeleteItem(id, deletedAt) {
    return this.database.menuItem.update({ where: { id }, data: { deletedAt } });
  }
}

module.exports = { MenuRepository };
