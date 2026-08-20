const logger = require('../config/logger');
const { PushNotificationService } = require('./push-notification.service');
const { EmailService } = require('./email.service');

const RESERVATION_STATUS_COPY = {
  PENDING: {
    title: 'Reservation received',
    body: (r) => `We've received your reservation for ${r.partySize} on ${r.dateLabel} at ${r.timeLabel}. Confirmation code ${r.confirmationCode}.`,
  },
  CONFIRMED: {
    title: 'Reservation confirmed',
    body: (r) => `Your table for ${r.partySize} on ${r.dateLabel} at ${r.timeLabel} is confirmed. See you soon!`,
  },
  SEATED: {
    title: "You're seated",
    body: (r) => `Enjoy your evening at Ora de Nuit, party of ${r.partySize}.`,
  },
  COMPLETED: {
    title: 'Thank you for dining with us',
    body: () => 'We hope you enjoyed your visit to Ora de Nuit. We\'d love to see you again soon.',
  },
  CANCELLED: {
    title: 'Reservation cancelled',
    body: (r) => `Your reservation (${r.confirmationCode}) for ${r.dateLabel} at ${r.timeLabel} has been cancelled.`,
  },
  NO_SHOW: {
    title: 'We missed you',
    body: (r) => `We held your table for ${r.dateLabel} at ${r.timeLabel} but missed you. Reach out if you'd like to rebook.`,
  },
};

function formatDateLabel(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTimeLabel(time) {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

function formatMoney(cents, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  );
}

function emailShell(title, bodyHtml) {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #2B2118;">
      <h2 style="color: #C9A24B; letter-spacing: 1px;">Ora de Nuit</h2>
      <h3>${title}</h3>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #7A6A55;">This is an automated message — please don't reply directly to this email.</p>
    </div>
  `;
}

class NotificationService {
  constructor({
    pushService = new PushNotificationService(),
    emailService = new EmailService(),
  } = {}) {
    this.pushService = pushService;
    this.emailService = emailService;
  }

  /**
   * Fires push + email concurrently and never throws — notification
   * delivery must never break the reservation/order flow that triggered it.
   */
  async _dispatch({ pushToken, pushTitle, pushBody, pushData, emailTo, emailSubject, emailHtml }) {
    const results = await Promise.allSettled([
      this.pushService.send({ token: pushToken, title: pushTitle, body: pushBody, data: pushData }),
      this.emailService.send({ to: emailTo, subject: emailSubject, html: emailHtml, text: pushBody }),
    ]);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('Notification dispatch failed unexpectedly.', {
          channel: index === 0 ? 'push' : 'email',
          error: result.reason?.message,
        });
      }
    });
  }

  async notifyReservationCreated(reservation) {
    await this._notifyReservationStatus(reservation, 'PENDING');
  }

  async notifyReservationStatusChanged(reservation) {
    await this._notifyReservationStatus(reservation, reservation.status);
  }

  async _notifyReservationStatus(reservation, status) {
    const copy = RESERVATION_STATUS_COPY[status];
    if (!copy) {
      return;
    }

    const view = {
      confirmationCode: reservation.confirmationCode,
      partySize: reservation.partySize,
      dateLabel: formatDateLabel(reservation.reservationDate),
      timeLabel: formatTimeLabel(reservation.reservationTime),
    };
    const body = copy.body(view);

    await this._dispatch({
      pushToken: reservation.pushToken,
      pushTitle: copy.title,
      pushBody: body,
      pushData: { type: 'reservation', confirmationCode: reservation.confirmationCode, status },
      emailTo: reservation.guestEmail,
      emailSubject: `${copy.title} — ${reservation.confirmationCode}`,
      emailHtml: emailShell(copy.title, `<p>${body}</p>`),
    });
  }

  async notifyOrderPaid(order) {
    const itemsList = (order.items || [])
      .map((item) => `<li>${item.quantity} × ${item.itemName}</li>`)
      .join('');
    const total = formatMoney(order.totalCents, order.currency);
    const body = `Your order (${order.confirmationCode}) is confirmed. Total: ${total}.`;

    await this._dispatch({
      pushToken: order.pushToken,
      pushTitle: 'Order confirmed',
      pushBody: body,
      pushData: { type: 'order', confirmationCode: order.confirmationCode, status: 'PAID' },
      emailTo: order.guestEmail,
      emailSubject: `Order confirmed — ${order.confirmationCode}`,
      emailHtml: emailShell('Order confirmed', `<p>${body}</p><ul>${itemsList}</ul>`),
    });
  }

  async notifyOrderCancelled(order) {
    const body = `Your order (${order.confirmationCode}) has been cancelled.${
      order.paymentStatus === 'REFUNDED' ? ' A refund has been issued.' : ''
    }`;

    await this._dispatch({
      pushToken: order.pushToken,
      pushTitle: 'Order cancelled',
      pushBody: body,
      pushData: { type: 'order', confirmationCode: order.confirmationCode, status: 'CANCELLED' },
      emailTo: order.guestEmail,
      emailSubject: `Order cancelled — ${order.confirmationCode}`,
      emailHtml: emailShell('Order cancelled', `<p>${body}</p>`),
    });
  }
}

module.exports = { NotificationService };
