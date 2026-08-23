const { HTTP_STATUS } = require('../constants/http-status');
const { DeviceService } = require('../services/device.service');
const { asyncHandler } = require('../utils/async-handler');

function createDeviceController(deviceService = new DeviceService()) {
  return {
    register: asyncHandler(async (req, res) => {
      const result = await deviceService.registerDevice(req.body);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Device registered successfully.',
        data: result,
      });
    }),
  };
}

const deviceController = createDeviceController();

module.exports = { createDeviceController, deviceController };
