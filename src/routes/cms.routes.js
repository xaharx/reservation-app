const { Router } = require('express');
const { cmsController } = require('../controllers/cms.controller');

const cmsRouter = Router();

/**
 * @openapi
 * /home:
 *   get:
 *     tags: [CMS]
 *     summary: Get home-screen content
 *     responses:
 *       200: { description: Home content retrieved successfully. }
 */
cmsRouter.get('/home', cmsController.getHome);

/**
 * @openapi
 * /about:
 *   get:
 *     tags: [CMS]
 *     summary: Get published about sections
 *     responses:
 *       200: { description: About content retrieved successfully. }
 */
cmsRouter.get('/about', cmsController.getAbout);

/**
 * @openapi
 * /gallery:
 *   get:
 *     tags: [CMS]
 *     summary: Get published gallery images
 *     responses:
 *       200: { description: Gallery retrieved successfully. }
 */
cmsRouter.get('/gallery', cmsController.getGallery);

/**
 * @openapi
 * /contact:
 *   get:
 *     tags: [CMS]
 *     summary: Get restaurant contact information
 *     responses:
 *       200: { description: Contact information retrieved successfully. }
 */
cmsRouter.get('/contact', cmsController.getContact);

/**
 * @openapi
 * /settings:
 *   get:
 *     tags: [CMS]
 *     summary: Get public application settings
 *     responses:
 *       200: { description: Settings retrieved successfully. }
 */
cmsRouter.get('/settings', cmsController.getSettings);

/**
 * @openapi
 * /social-media:
 *   get:
 *     tags: [CMS]
 *     summary: Get published social-media links
 *     responses:
 *       200: { description: Social media retrieved successfully. }
 */
cmsRouter.get('/social-media', cmsController.getSocialMedia);

module.exports = { cmsRouter };
