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
    getById: asyncHandler(async (req, res) => {
      const order = await orderService.getOrderById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order retrieved successfully.',
        data: order,
      });
    }),
    list: asyncHandler(async (req, res) => {
      const result = await orderService.listOrders(req.validated.query);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Orders retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    }),
    stats: asyncHandler(async (req, res) => {
      const stats = await orderService.getOrderStats();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order statistics retrieved successfully.',
        data: stats,
      });
    }),
    updateStatus: asyncHandler(async (req, res) => {
      const order = await orderService.updateOrderStatus(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order status updated successfully.',
        data: order,
      });
    }),
  };
}

const orderController = createOrderController();

module.exports = { createOrderController, orderController };
