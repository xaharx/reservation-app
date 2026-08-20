const { randomUUID } = require('crypto');
const { ReservationRepository } = require('../repositories/reservation.repository');
const { NotificationService } = require('./notification.service');
const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');

const STATUS_TRANSITIONS = Object.freeze({
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SEATED', 'CANCELLED', 'NO_SHOW'],
  SEATED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
});

function createConfirmationCode() {
  return `ON-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

function toReservationResponse(reservation, request) {
  return {
    id: reservation.id.toString(),
    confirmationCode: reservation.confirmationCode,
    firstName: request.firstName,
    lastName: request.lastName,
    email: reservation.guestEmail,
    phone: reservation.guestPhone,
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    reservationTime: reservation.reservationTime.toISOString().slice(11, 16),
    guestCount: reservation.partySize,
    specialRequest: reservation.specialRequests,
    status: reservation.status,
    deviceId:  reservation.deviceId,
    os: reservation.os,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

class ReservationService {
  constructor({
    reservationRepository = new ReservationRepository(),
    notificationService = new NotificationService(),
    confirmationCodeGenerator = createConfirmationCode,
    clock = () => new Date(),
  } = {}) {
    this.reservationRepository = reservationRepository;
    this.notificationService = notificationService;
    this.confirmationCodeGenerator = confirmationCodeGenerator;
    this.clock = clock;
  }

  async createReservation(input) {
    const reservation = await this.reservationRepository.create({
      confirmationCode: this.confirmationCodeGenerator(),
      guestName: `${input.firstName} ${input.lastName}`,
      guestEmail: input.email,
      guestPhone: input.phone,
      reservationDate: new Date(`${input.reservationDate}T00:00:00.000Z`),
      reservationTime: new Date(`1970-01-01T${input.reservationTime}:00.000Z`),
      partySize: input.guestCount,
      specialRequests: input.specialRequest || null,
      source: 'MOBILE_APP',
      deviceId: input.deviceId,
      os: input.os,
      pushToken: input.pushToken,
    });

    await this.notificationService.notifyReservationCreated(reservation);

    return toReservationResponse(reservation, input);
  }

  async getReservationById(id) {
    const reservation = await this.reservationRepository.findById(BigInt(id));
    if (!reservation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Reservation not found.');
    }

    return toReservationResponse(reservation, {
      firstName: reservation.guestName.split(' ')[0],
      lastName: reservation.guestName.split(' ').slice(1).join(' '),
    });
  }

  async lookupReservation(input) {
    const reservation = await this.reservationRepository.findByConfirmationCode(
      input.confirmationCode,
    );

    if (!reservation || reservation.guestEmail.toLowerCase() !== input.guestEmail.toLowerCase()) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Reservation not found.');
    }

    return toReservationResponse(reservation, {
      firstName: reservation.guestName.split(' ')[0],
      lastName: reservation.guestName.split(' ').slice(1).join(' '),
    });
  }

  async cancelReservation(confirmationCode, input) {
    const reservation = await this.reservationRepository.findByConfirmationCode(confirmationCode);

    if (!reservation || reservation.guestEmail.toLowerCase() !== input.guestEmail.toLowerCase()) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Reservation not found.');
    }

    if (!STATUS_TRANSITIONS[reservation.status].includes('CANCELLED')) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        `A reservation with status ${reservation.status} can no longer be cancelled.`,
      );
    }

    const updatedReservation = await this.reservationRepository.updateStatus(reservation.id, {
      status: 'CANCELLED',
      cancelledAt: this.clock(),
      cancellationNote: input.reason || null,
    });

    await this.notificationService.notifyReservationStatusChanged(updatedReservation);

    return toReservationResponse(updatedReservation, {
      firstName: updatedReservation.guestName.split(' ')[0],
      lastName: updatedReservation.guestName.split(' ').slice(1).join(' '),
    });
  }

  async listReservations(query) {
    const { page, limit, status, reservationDate } = query;
    const result = await this.reservationRepository.findMany({
      skip: (page - 1) * limit,
      take: limit,
      status,
      reservationDate: reservationDate ? new Date(`${reservationDate}T00:00:00.000Z`) : undefined,
    });

    return {
      data: result.reservations.map((reservation) =>
        toReservationResponse(reservation, {
          firstName: reservation.guestName.split(' ')[0],
          lastName: reservation.guestName.split(' ').slice(1).join(' '),
        }),
      ),
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async updateReservationStatus(id, input) {
    const reservation = await this.reservationRepository.findById(BigInt(id));
    if (!reservation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Reservation not found.');
    }

    if (!STATUS_TRANSITIONS[reservation.status].includes(input.status)) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        `Cannot change reservation status from ${reservation.status} to ${input.status}.`,
      );
    }

    const updatedReservation = await this.reservationRepository.updateStatus(BigInt(id), {
      status: input.status,
      ...(input.status === 'CANCELLED' && {
        cancelledAt: this.clock(),
        cancellationNote: input.cancellationNote,
      }),
    });

    await this.notificationService.notifyReservationStatusChanged(updatedReservation);

    return toReservationResponse(updatedReservation, {
      firstName: updatedReservation.guestName.split(' ')[0],
      lastName: updatedReservation.guestName.split(' ').slice(1).join(' '),
    });
  }
}

module.exports = {
  ReservationService,
  toReservationResponse,
  createConfirmationCode,
  STATUS_TRANSITIONS,
};
