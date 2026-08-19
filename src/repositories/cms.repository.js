const { prisma } = require('../config/database');

class CmsRepository {
  constructor(database = prisma, clock = () => new Date()) {
    this.database = database;
    this.clock = clock;
  }

  findPublishedAbout() {
    return this.database.about.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findPublishedGallery(take) {
    return this.database.gallery.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      ...(take && { take }),
    });
  }

  findPublishedContacts() {
    return this.database.contact.findMany({
      where: { deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { label: 'asc' }],
    });
  }

  findPublicSettings() {
    return this.database.appSetting.findMany({
      where: { isPublic: true },
      orderBy: { settingKey: 'asc' },
    });
  }

  findPublishedSocialMedia() {
    return this.database.socialMedia.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findActiveHomeBanners() {
    const now = this.clock();

    return this.database.banner.findMany({
      where: {
        placement: 'HOME_HERO',
        isPublished: true,
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async findHomeContent() {
    const [banners, aboutSections, featuredGallery] = await Promise.all([
      this.findActiveHomeBanners(),
      this.database.about.findMany({
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: 3,
      }),
      this.findPublishedGallery(8),
    ]);

    return { banners, aboutSections, featuredGallery };
  }
}

module.exports = { CmsRepository };
