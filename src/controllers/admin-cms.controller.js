const { HTTP_STATUS } = require('../constants/http-status');
const { AdminCmsService } = require('../services/admin-cms.service');
const { asyncHandler } = require('../utils/async-handler');
const { toPublicUploadUrl } = require('../config/upload');
const { ApiError } = require('../utils/api-error');

function createAdminCmsController(adminCmsService = new AdminCmsService()) {
  function listHandler(message, list) {
    return asyncHandler(async (_req, res) => {
      const data = await list();
      res.status(HTTP_STATUS.OK).json({ success: true, message, data });
    });
  }

  function createHandler(message, create) {
    return asyncHandler(async (req, res) => {
      const data = await create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ success: true, message, data });
    });
  }

  function updateHandler(message, update) {
    return asyncHandler(async (req, res) => {
      const data = await update(BigInt(req.params.id), req.body);
      res.status(HTTP_STATUS.OK).json({ success: true, message, data });
    });
  }

  function deleteHandler(message, remove) {
    return asyncHandler(async (req, res) => {
      await remove(BigInt(req.params.id));
      res.status(HTTP_STATUS.OK).json({ success: true, message, data: null });
    });
  }

  return {
    listBanners: listHandler('Banners retrieved successfully.', () =>
      adminCmsService.listBanners(),
    ),
    createBanner: createHandler('Banner created successfully.', (body) =>
      adminCmsService.createBanner(body),
    ),
    updateBanner: updateHandler('Banner updated successfully.', (id, body) =>
      adminCmsService.updateBanner(id, body),
    ),
    deleteBanner: deleteHandler('Banner deleted successfully.', (id) =>
      adminCmsService.deleteBanner(id),
    ),

    listAbout: listHandler('About sections retrieved successfully.', () =>
      adminCmsService.listAbout(),
    ),
    createAbout: createHandler('About section created successfully.', (body) =>
      adminCmsService.createAbout(body),
    ),
    updateAbout: updateHandler('About section updated successfully.', (id, body) =>
      adminCmsService.updateAbout(id, body),
    ),
    deleteAbout: deleteHandler('About section deleted successfully.', (id) =>
      adminCmsService.deleteAbout(id),
    ),

    listGallery: listHandler('Gallery retrieved successfully.', () =>
      adminCmsService.listGallery(),
    ),
    createGalleryImage: asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'An "image" file is required.');
      }
      const image = await adminCmsService.createGalleryImage({
        ...req.body,
        imageUrl: toPublicUploadUrl(req.file.filename),
      });
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Gallery image uploaded successfully.',
        data: image,
      });
    }),
    updateGalleryImage: updateHandler('Gallery image updated successfully.', (id, body) =>
      adminCmsService.updateGalleryImage(id, body),
    ),
    deleteGalleryImage: deleteHandler('Gallery image deleted successfully.', (id) =>
      adminCmsService.deleteGalleryImage(id),
    ),

    listContacts: listHandler('Contact information retrieved successfully.', () =>
      adminCmsService.listContacts(),
    ),
    createContact: createHandler('Contact created successfully.', (body) =>
      adminCmsService.createContact(body),
    ),
    updateContact: updateHandler('Contact updated successfully.', (id, body) =>
      adminCmsService.updateContact(id, body),
    ),
    deleteContact: deleteHandler('Contact deleted successfully.', (id) =>
      adminCmsService.deleteContact(id),
    ),

    listSocialMedia: listHandler('Social media links retrieved successfully.', () =>
      adminCmsService.listSocialMedia(),
    ),
    createSocialMedia: createHandler('Social media link created successfully.', (body) =>
      adminCmsService.createSocialMedia(body),
    ),
    updateSocialMedia: updateHandler('Social media link updated successfully.', (id, body) =>
      adminCmsService.updateSocialMedia(id, body),
    ),
    deleteSocialMedia: deleteHandler('Social media link deleted successfully.', (id) =>
      adminCmsService.deleteSocialMedia(id),
    ),

    listSettings: listHandler('Settings retrieved successfully.', () =>
      adminCmsService.listSettings(),
    ),
    upsertSetting: asyncHandler(async (req, res) => {
      const setting = await adminCmsService.upsertSetting(req.params.key, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Setting saved successfully.',
        data: setting,
      });
    }),
    deleteSetting: asyncHandler(async (req, res) => {
      await adminCmsService.deleteSetting(req.params.key);
      res.status(HTTP_STATUS.OK).json({ success: true, message: 'Setting deleted successfully.', data: null });
    }),
  };
}

const adminCmsController = createAdminCmsController();

module.exports = { createAdminCmsController, adminCmsController };
