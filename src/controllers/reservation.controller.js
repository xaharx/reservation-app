const { HTTP_STATUS } = require('../constants/http-status');
const { ReservationService } = require('../services/reservation.service');
const { asyncHandler } = require('../utils/async-handler');

function createReservationController(reservationService = new ReservationService()) {
  return {
    create: asyncHandler(async (req, res) => {
      const reservation = await reservationService.createReservation(req.body);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Reservation created successfully.',
        data: reservation,
      });
    }),
    getById: asyncHandler(async (req, res) => {
      const reservation = await reservationService.getReservationById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reservation retrieved successfully.',
        data: reservation,
      });
    }),
    lookup: asyncHandler(async (req, res) => {
      const reservation = await reservationService.lookupReservation(req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reservation retrieved successfully.',
        data: reservation,
      });
    }),
    cancel: asyncHandler(async (req, res) => {
      const reservation = await reservationService.cancelReservation(
        req.params.confirmationCode,
        req.body,
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reservation cancelled successfully.',
        data: reservation,
      });
    }),
    list: asyncHandler(async (req, res) => {
      const result = await reservationService.listReservations(req.validated.query);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reservations retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    }),
    stats: asyncHandler(async (req, res) => {
      const stats = await reservationService.getReservationStats();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reservation statistics retrieved successfully.',
        data: stats,
      });
    }),
    updateStatus: asyncHandler(async (req, res) => {
      const reservation = await reservationService.updateReservationStatus(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reservation status updated successfully.',
        data: reservation,
      });
    }),
  };
}

const reservationController = createReservationController();

module.exports = { createReservationController, reservationController };
