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
}

module.exports = { MenuRepository };
