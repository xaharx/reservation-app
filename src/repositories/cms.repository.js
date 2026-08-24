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

  // ---- Admin (write) methods below. Public read methods above stay
  // untouched — the admin panel manages the same tables but always sees
  // everything (including unpublished/soft-deleted-aware listings), never
  // the cached/published-only view the mobile app gets. ----

  listBanners() {
    return this.database.banner.findMany({
      where: { deletedAt: null },
      orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  createBanner(data) {
    return this.database.banner.create({ data });
  }

  updateBanner(id, data) {
    return this.database.banner.update({ where: { id }, data });
  }

  softDeleteBanner(id, deletedAt) {
    return this.database.banner.update({ where: { id }, data: { deletedAt } });
  }

  listAbout() {
    return this.database.about.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  createAbout(data) {
    return this.database.about.create({ data });
  }

  updateAbout(id, data) {
    return this.database.about.update({ where: { id }, data });
  }

  softDeleteAbout(id, deletedAt) {
    return this.database.about.update({ where: { id }, data: { deletedAt } });
  }

  listAllGallery() {
    return this.database.gallery.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findGalleryById(id) {
    return this.database.gallery.findUnique({ where: { id } });
  }

  createGalleryImage(data) {
    return this.database.gallery.create({ data });
  }

  updateGalleryImage(id, data) {
    return this.database.gallery.update({ where: { id }, data });
  }

  softDeleteGalleryImage(id, deletedAt) {
    return this.database.gallery.update({ where: { id }, data: { deletedAt } });
  }

  listContacts() {
    return this.database.contact.findMany({
      where: { deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { label: 'asc' }],
    });
  }

  createContact(data) {
    return this.database.contact.create({ data });
  }

  updateContact(id, data) {
    return this.database.contact.update({ where: { id }, data });
  }

  softDeleteContact(id, deletedAt) {
    return this.database.contact.update({ where: { id }, data: { deletedAt } });
  }

  listAllSocialMedia() {
    return this.database.socialMedia.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  createSocialMedia(data) {
    return this.database.socialMedia.create({ data });
  }

  updateSocialMedia(id, data) {
    return this.database.socialMedia.update({ where: { id }, data });
  }

  softDeleteSocialMedia(id, deletedAt) {
    return this.database.socialMedia.update({ where: { id }, data: { deletedAt } });
  }

  listAllSettings() {
    return this.database.appSetting.findMany({ orderBy: { settingKey: 'asc' } });
  }

  upsertSetting(settingKey, data) {
    return this.database.appSetting.upsert({
      where: { settingKey },
      create: { settingKey, ...data },
      update: data,
    });
  }

  deleteSetting(settingKey) {
    return this.database.appSetting.delete({ where: { settingKey } });
  }
}

module.exports = { CmsRepository };
