const { HTTP_STATUS } = require('../constants/http-status');
const { OrderService } = require('../services/order.service');
const { asyncHandler } = require('../utils/async-handler');

function createOrderController(orderService = new OrderService()) {
  return {
    create: asyncHandler(async (req, res) => {
      const result = await orderService.createOrder(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Order created successfully. Complete payment to confirm it.',
        data: result,
      });
    }),
    lookup: asyncHandler(async (req, res) => {
      const order = await orderService.lookupOrder(req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order retrieved successfully.',
        data: order,
      });
    }),
    cancel: asyncHandler(async (req, res) => {
      const order = await orderService.cancelOrder(req.params.confirmationCode, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order cancelled successfully.',
        data: order,
      });
    }),
  };
}

const orderController = createOrderController();

module.exports = { createOrderController, orderController };
