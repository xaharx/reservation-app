const { Router } = require('express');
const { adminCmsController } = require('../controllers/admin-cms.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { galleryImageUpload } = require('../config/upload');
const {
  validateBody,
  validateParams,
} = require('../validators/validate-request.middleware');
const { bigIntIdParamSchema } = require('../validators/id-param.validator');
const {
  bannerSchema,
  bannerUpdateSchema,
  aboutSchema,
  aboutUpdateSchema,
  contactSchema,
  contactUpdateSchema,
  socialMediaSchema,
  socialMediaUpdateSchema,
  settingSchema,
  settingKeyParamSchema,
  galleryCreateSchema,
  galleryUpdateSchema,
} = require('../validators/cms-admin.validator');

const idParams = bigIntIdParamSchema('id');

// Every route in this file manages content the public /home, /about,
// /gallery, /contact, /settings, /social-media endpoints serve to the
// mobile app — see admin-cms.service.js for the cache-invalidation side of
// that relationship. All of it requires an authenticated admin session.
const adminCmsRouter = Router();
adminCmsRouter.use(authenticate);

// ---- Banners (Home) ----
/**
 * @openapi
 * /admin/banners:
 *   get:
 *     tags: [CMS Admin]
 *     summary: List all banners
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Banners retrieved successfully. }
 *   post:
 *     tags: [CMS Admin]
 *     summary: Create a banner
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, imageUrl, placement]
 *             properties:
 *               title: { type: string }
 *               subtitle: { type: string }
 *               imageUrl: { type: string }
 *               actionLabel: { type: string }
 *               actionUrl: { type: string }
 *               placement: { type: string, enum: [HOME_HERO, HOME_PROMOTION, RESERVATION, APP_MODAL] }
 *               startsAt: { type: string, format: date-time }
 *               endsAt: { type: string, format: date-time }
 *               sortOrder: { type: integer, default: 0 }
 *               isPublished: { type: boolean, default: false }
 *     responses:
 *       201: { description: Banner created successfully. }
 *       422: { description: Validation failed. }
 */
adminCmsRouter.get('/banners', adminCmsController.listBanners);
adminCmsRouter.post('/banners', validateBody(bannerSchema), adminCmsController.createBanner);

/**
 * @openapi
 * /admin/banners/{id}:
 *   patch:
 *     tags: [CMS Admin]
 *     summary: Update a banner
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Banner updated successfully. }
 *       404: { description: Banner not found. }
 *   delete:
 *     tags: [CMS Admin]
 *     summary: Delete a banner
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Banner deleted successfully. }
 *       404: { description: Banner not found. }
 */
adminCmsRouter.patch(
  '/banners/:id',
  validateParams(idParams),
  validateBody(bannerUpdateSchema),
  adminCmsController.updateBanner,
);
adminCmsRouter.delete('/banners/:id', validateParams(idParams), adminCmsController.deleteBanner);

// ---- About ----
/**
 * @openapi
 * /admin/about:
 *   get:
 *     tags: [CMS Admin]
 *     summary: List all about sections
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: About sections retrieved successfully. }
 *   post:
 *     tags: [CMS Admin]
 *     summary: Create an about section
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sectionKey, title, content]
 *             properties:
 *               sectionKey: { type: string }
 *               title: { type: string }
 *               content: { type: string }
 *               imageUrl: { type: string }
 *               sortOrder: { type: integer, default: 0 }
 *               isPublished: { type: boolean, default: true }
 *     responses:
 *       201: { description: About section created successfully. }
 *       422: { description: Validation failed. }
 */
adminCmsRouter.get('/about', adminCmsController.listAbout);
adminCmsRouter.post('/about', validateBody(aboutSchema), adminCmsController.createAbout);

/**
 * @openapi
 * /admin/about/{id}:
 *   patch:
 *     tags: [CMS Admin]
 *     summary: Update an about section
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: About section updated successfully. }
 *       404: { description: About section not found. }
 *   delete:
 *     tags: [CMS Admin]
 *     summary: Delete an about section
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: About section deleted successfully. }
 *       404: { description: About section not found. }
 */
adminCmsRouter.patch(
  '/about/:id',
  validateParams(idParams),
  validateBody(aboutUpdateSchema),
  adminCmsController.updateAbout,
);
adminCmsRouter.delete('/about/:id', validateParams(idParams), adminCmsController.deleteAbout);

// ---- Gallery ----
/**
 * @openapi
 * /admin/gallery:
 *   get:
 *     tags: [CMS Admin]
 *     summary: List all gallery images
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Gallery retrieved successfully. }
 *   post:
 *     tags: [CMS Admin]
 *     summary: Upload a gallery image
 *     description: multipart/form-data — the file field must be named "image".
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image: { type: string, format: binary }
 *               title: { type: string }
 *               altText: { type: string }
 *               category: { type: string }
 *               sortOrder: { type: integer, default: 0 }
 *               isPublished: { type: string, enum: ['true', 'false'], default: 'true' }
 *     responses:
 *       201: { description: Gallery image uploaded successfully. }
 *       400: { description: Missing/invalid image file. }
 *       422: { description: Validation failed. }
 */
adminCmsRouter.get('/gallery', adminCmsController.listGallery);
adminCmsRouter.post(
  '/gallery',
  galleryImageUpload,
  validateBody(galleryCreateSchema),
  adminCmsController.createGalleryImage,
);

/**
 * @openapi
 * /admin/gallery/{id}:
 *   patch:
 *     tags: [CMS Admin]
 *     summary: Update gallery image metadata (does not replace the file)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Gallery image updated successfully. }
 *       404: { description: Gallery image not found. }
 *   delete:
 *     tags: [CMS Admin]
 *     summary: Delete a gallery image
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Gallery image deleted successfully. }
 *       404: { description: Gallery image not found. }
 */
adminCmsRouter.patch(
  '/gallery/:id',
  validateParams(idParams),
  validateBody(galleryUpdateSchema),
  adminCmsController.updateGalleryImage,
);
adminCmsRouter.delete(
  '/gallery/:id',
  validateParams(idParams),
  adminCmsController.deleteGalleryImage,
);

// ---- Contact ----
/**
 * @openapi
 * /admin/contact:
 *   get:
 *     tags: [CMS Admin]
 *     summary: List all contact entries
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Contact information retrieved successfully. }
 *   post:
 *     tags: [CMS Admin]
 *     summary: Create a contact entry
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label]
 *             properties:
 *               label: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               addressLine1: { type: string }
 *               addressLine2: { type: string }
 *               city: { type: string }
 *               country: { type: string }
 *               postalCode: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               openingHours: { type: object }
 *               isPrimary: { type: boolean, default: false }
 *     responses:
 *       201: { description: Contact created successfully. }
 *       422: { description: Validation failed. }
 */
adminCmsRouter.get('/contact', adminCmsController.listContacts);
adminCmsRouter.post('/contact', validateBody(contactSchema), adminCmsController.createContact);

/**
 * @openapi
 * /admin/contact/{id}:
 *   patch:
 *     tags: [CMS Admin]
 *     summary: Update a contact entry
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Contact updated successfully. }
 *       404: { description: Contact not found. }
 *   delete:
 *     tags: [CMS Admin]
 *     summary: Delete a contact entry
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Contact deleted successfully. }
 *       404: { description: Contact not found. }
 */
adminCmsRouter.patch(
  '/contact/:id',
  validateParams(idParams),
  validateBody(contactUpdateSchema),
  adminCmsController.updateContact,
);
adminCmsRouter.delete('/contact/:id', validateParams(idParams), adminCmsController.deleteContact);

// ---- Social media ----
/**
 * @openapi
 * /admin/social-media:
 *   get:
 *     tags: [CMS Admin]
 *     summary: List all social media links
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Social media links retrieved successfully. }
 *   post:
 *     tags: [CMS Admin]
 *     summary: Create a social media link
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [platform, profileUrl]
 *             properties:
 *               platform: { type: string }
 *               profileUrl: { type: string }
 *               iconUrl: { type: string }
 *               sortOrder: { type: integer, default: 0 }
 *               isPublished: { type: boolean, default: true }
 *     responses:
 *       201: { description: Social media link created successfully. }
 *       422: { description: Validation failed. }
 */
adminCmsRouter.get('/social-media', adminCmsController.listSocialMedia);
adminCmsRouter.post(
  '/social-media',
  validateBody(socialMediaSchema),
  adminCmsController.createSocialMedia,
);

/**
 * @openapi
 * /admin/social-media/{id}:
 *   patch:
 *     tags: [CMS Admin]
 *     summary: Update a social media link
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Social media link updated successfully. }
 *       404: { description: Social media link not found. }
 *   delete:
 *     tags: [CMS Admin]
 *     summary: Delete a social media link
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Social media link deleted successfully. }
 *       404: { description: Social media link not found. }
 */
adminCmsRouter.patch(
  '/social-media/:id',
  validateParams(idParams),
  validateBody(socialMediaUpdateSchema),
  adminCmsController.updateSocialMedia,
);
adminCmsRouter.delete(
  '/social-media/:id',
  validateParams(idParams),
  adminCmsController.deleteSocialMedia,
);

// ---- Settings ----
/**
 * @openapi
 * /admin/settings:
 *   get:
 *     tags: [CMS Admin]
 *     summary: List all application settings (public and private)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Settings retrieved successfully. }
 */
adminCmsRouter.get('/settings', adminCmsController.listSettings);

/**
 * @openapi
 * /admin/settings/{key}:
 *   put:
 *     tags: [CMS Admin]
 *     summary: Create or update a setting by key
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string, example: reservation_lead_time_minutes }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value: {}
 *               description: { type: string }
 *               isPublic: { type: boolean, default: false }
 *     responses:
 *       200: { description: Setting saved successfully. }
 *       422: { description: Validation failed. }
 *   delete:
 *     tags: [CMS Admin]
 *     summary: Delete a setting by key
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Setting deleted successfully. }
 *       404: { description: Setting not found. }
 */
adminCmsRouter.put(
  '/settings/:key',
  validateParams(settingKeyParamSchema),
  validateBody(settingSchema),
  adminCmsController.upsertSetting,
);
adminCmsRouter.delete(
  '/settings/:key',
  validateParams(settingKeyParamSchema),
  adminCmsController.deleteSetting,
);

module.exports = { adminCmsRouter };
