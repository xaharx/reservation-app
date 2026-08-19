const { Router } = require('express');
const { menuController } = require('../controllers/menu.controller');

const menuRouter = Router();

/**
 * @openapi
 * /menu:
 *   get:
 *     tags: [Menu]
 *     summary: Get the published menu grouped by category
 *     responses:
 *       200: { description: Menu retrieved successfully. }
 */
menuRouter.get('/', menuController.getMenu);

module.exports = { menuRouter };
