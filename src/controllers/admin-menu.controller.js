const { HTTP_STATUS } = require('../constants/http-status');
const { AdminMenuService } = require('../services/admin-menu.service');
const { asyncHandler } = require('../utils/async-handler');
const { toPublicUploadUrl, MENU_SUBDIR } = require('../config/upload');

function withUploadedImageUrl(body, file) {
  return { ...body, ...(file && { imageUrl: toPublicUploadUrl(file.filename, MENU_SUBDIR) }) };
}

function createAdminMenuController(adminMenuService = new AdminMenuService()) {
  return {
    listCategories: asyncHandler(async (_req, res) => {
      const data = await adminMenuService.listCategories();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Menu categories retrieved successfully.',
        data,
      });
    }),
    createCategory: asyncHandler(async (req, res) => {
      const data = await adminMenuService.createCategory(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Menu category created successfully.',
        data,
      });
    }),
    updateCategory: asyncHandler(async (req, res) => {
      const data = await adminMenuService.updateCategory(BigInt(req.params.id), req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Menu category updated successfully.',
        data,
      });
    }),
    deleteCategory: asyncHandler(async (req, res) => {
      await adminMenuService.deleteCategory(BigInt(req.params.id));
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Menu category deleted successfully.',
        data: null,
      });
    }),

    listItems: asyncHandler(async (_req, res) => {
      const data = await adminMenuService.listItems();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Menu items retrieved successfully.',
        data,
      });
    }),
    createItem: asyncHandler(async (req, res) => {
      const data = await adminMenuService.createItem(withUploadedImageUrl(req.body, req.file));
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Menu item created successfully.',
        data,
      });
    }),
    updateItem: asyncHandler(async (req, res) => {
      const data = await adminMenuService.updateItem(
        BigInt(req.params.id),
        withUploadedImageUrl(req.body, req.file),
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Menu item updated successfully.',
        data,
      });
    }),
    deleteItem: asyncHandler(async (req, res) => {
      await adminMenuService.deleteItem(BigInt(req.params.id));
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Menu item deleted successfully.',
        data: null,
      });
    }),
  };
}

const adminMenuController = createAdminMenuController();

module.exports = { createAdminMenuController, adminMenuController };
