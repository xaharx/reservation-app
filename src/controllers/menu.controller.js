const { HTTP_STATUS } = require('../constants/http-status');
const { MenuService } = require('../services/menu.service');
const { asyncHandler } = require('../utils/async-handler');

function createMenuController(menuService = new MenuService()) {
  return {
    getMenu: asyncHandler(async (_req, res) => {
      const menu = await menuService.getMenu();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Menu retrieved successfully.',
        data: menu,
      });
    }),
  };
}

const menuController = createMenuController();

module.exports = { createMenuController, menuController };
