const { Router } = require('express');
const { adminMenuController } = require('../controllers/admin-menu.controller');
const { menuItemImageUpload } = require('../config/upload');
const { validateBody, validateParams } = require('../validators/validate-request.middleware');
const { bigIntIdParamSchema } = require('../validators/id-param.validator');
const {
  menuCategorySchema,
  menuCategoryUpdateSchema,
  menuItemSchema,
  menuItemUpdateSchema,
} = require('../validators/menu-admin.validator');

const idParams = bigIntIdParamSchema('id');

// Manages the same tables the public GET /menu endpoint serves to the
// mobile app — see admin-menu.service.js for the cache-invalidation side of
// that relationship. Mounted behind `authenticate` in routes/index.js, same
// as /admin/reservations and /admin/orders.
const adminMenuRouter = Router();

// ---- Categories ----
/**
 * @openapi
 * /admin/menu/categories:
 *   get:
 *     tags: [Menu Admin]
 *     summary: List all menu categories
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Menu categories retrieved successfully. }
 *   post:
 *     tags: [Menu Admin]
 *     summary: Create a menu category
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Starters }
 *               description: { type: string }
 *               sortOrder: { type: integer, default: 0 }
 *               isPublished: { type: boolean, default: true }
 *     responses:
 *       201: { description: Menu category created successfully. }
 *       422: { description: Validation failed. }
 */
adminMenuRouter.get('/categories', adminMenuController.listCategories);
adminMenuRouter.post(
  '/categories',
  validateBody(menuCategorySchema),
  adminMenuController.createCategory,
);

/**
 * @openapi
 * /admin/menu/categories/{id}:
 *   patch:
 *     tags: [Menu Admin]
 *     summary: Update a menu category
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Menu category updated successfully. }
 *       404: { description: Menu category not found. }
 *   delete:
 *     tags: [Menu Admin]
 *     summary: Delete a menu category
 *     description: "Fails with 409 if the category still has active menu items — move or delete them first."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Menu category deleted successfully. }
 *       404: { description: Menu category not found. }
 *       409: { description: Category still has active menu items. }
 */
adminMenuRouter.patch(
  '/categories/:id',
  validateParams(idParams),
  validateBody(menuCategoryUpdateSchema),
  adminMenuController.updateCategory,
);
adminMenuRouter.delete(
  '/categories/:id',
  validateParams(idParams),
  adminMenuController.deleteCategory,
);

// ---- Items ----
/**
 * @openapi
 * /admin/menu/items:
 *   get:
 *     tags: [Menu Admin]
 *     summary: List all menu items
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Menu items retrieved successfully. }
 *   post:
 *     tags: [Menu Admin]
 *     summary: Create a menu item
 *     description: "multipart/form-data — the photo is optional; if included, the file field must be named \"image\"."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [categoryId, name, priceCents]
 *             properties:
 *               categoryId: { type: string, example: '1' }
 *               name: { type: string, example: Tagliatelle al Tartufo }
 *               description: { type: string }
 *               priceCents: { type: integer, minimum: 0, example: 2400 }
 *               currency: { type: string, example: usd }
 *               image: { type: string, format: binary }
 *               isAvailable: { type: string, enum: ['true', 'false'], default: 'true' }
 *               sortOrder: { type: integer, default: 0 }
 *               isPublished: { type: string, enum: ['true', 'false'], default: 'true' }
 *     responses:
 *       201: { description: Menu item created successfully. }
 *       404: { description: Menu category not found. }
 *       422: { description: Validation failed. }
 */
adminMenuRouter.get('/items', adminMenuController.listItems);
adminMenuRouter.post(
  '/items',
  menuItemImageUpload,
  validateBody(menuItemSchema),
  adminMenuController.createItem,
);

/**
 * @openapi
 * /admin/menu/items/{id}:
 *   patch:
 *     tags: [Menu Admin]
 *     summary: Update a menu item
 *     description: "multipart/form-data — including a new \"image\" file replaces the stored photo (and deletes the old file); omitting it leaves the current photo untouched."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Menu item updated successfully. }
 *       404: { description: Menu item or menu category not found. }
 *   delete:
 *     tags: [Menu Admin]
 *     summary: Delete a menu item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Menu item deleted successfully. }
 *       404: { description: Menu item not found. }
 */
adminMenuRouter.patch(
  '/items/:id',
  validateParams(idParams),
  menuItemImageUpload,
  validateBody(menuItemUpdateSchema),
  adminMenuController.updateItem,
);
adminMenuRouter.delete('/items/:id', validateParams(idParams), adminMenuController.deleteItem);

module.exports = { adminMenuRouter };
