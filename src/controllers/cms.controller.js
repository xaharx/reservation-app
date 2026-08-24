const { HTTP_STATUS } = require('../constants/http-status');
const { cmsService: defaultCmsService } = require('../services/cms.service');
const { asyncHandler } = require('../utils/async-handler');

function createCmsController(cmsService = defaultCmsService) {
  function createReadHandler(message, getData) {
    return asyncHandler(async (_req, res) => {
      const data = await getData();
      res.status(HTTP_STATUS.OK).json({ success: true, message, data });
    });
  }

  return {
    getHome: createReadHandler('Home content retrieved successfully.', () => cmsService.getHome()),
    getAbout: createReadHandler('About content retrieved successfully.', () =>
      cmsService.getAbout(),
    ),
    getGallery: createReadHandler('Gallery retrieved successfully.', () => cmsService.getGallery()),
    getContact: createReadHandler('Contact information retrieved successfully.', () =>
      cmsService.getContact(),
    ),
    getSettings: createReadHandler('Settings retrieved successfully.', () =>
      cmsService.getSettings(),
    ),
    getSocialMedia: createReadHandler('Social media retrieved successfully.', () =>
      cmsService.getSocialMedia(),
    ),
  };
}

const cmsController = createCmsController();

module.exports = { createCmsController, cmsController };
