const { randomUUID } = require('crypto');
const { env } = require('../config/env');
const logger = require('../config/logger');
const { OrderRepository } = require('../repositories/order.repository');
const { MenuRepository } = require('../repositories/menu.repository');
const { StripeGateway } = require('./stripe-gateway');
const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');

// Orders can only be cancelled before they've been handed over — once READY
// or COMPLETED, cancelling (and refunding) no longer makes sense.
const CANCELLABLE_STATUSES = new Set(['PENDING_PAYMENT', 'PAID', 'PREPARING']);

function createConfirmationCode() {
  return `OD-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
}

function toOrderResponse(order) {
  return {
    id: order.id.toString(),
    confirmationCode: order.confirmationCode,
    guestName: order.guestName,
    guestEmail: order.guestEmail,
    guestPhone: order.guestPhone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    notes: order.notes,
    items: (order.items ?? []).map((item) => ({
      id: item.id.toString(),
      menuItemId: item.menuItemId.toString(),
      itemName: item.itemName,
      unitCents: item.unitCents,
      quantity: item.quantity,
      lineCents: item.lineCents,
      notes: item.notes,
    })),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    cancellationNote: order.cancellationNote,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

class OrderService {
  constructor({
    orderRepository = new OrderRepository(),
    menuRepository = new MenuRepository(),
    stripeGateway = new StripeGateway(),
    confirmationCodeGenerator = createConfirmationCode,
    clock = () => new Date(),
    checkoutReturnScheme = env.ORDER_CHECKOUT_RETURN_SCHEME,
  } = {}) {
    this.orderRepository = orderRepository;
    this.menuRepository = menuRepository;
    this.stripeGateway = stripeGateway;
    this.confirmationCodeGenerator = confirmationCodeGenerator;
    this.clock = clock;
    this.checkoutReturnScheme = checkoutReturnScheme;
  }

  async createOrder(input) {
    const requestedIds = [...new Set(input.items.map((item) => BigInt(item.menuItemId)))];
    const menuItems = await this.menuRepository.findManyMenuItemsByIds(requestedIds);
    const menuItemsById = new Map(menuItems.map((item) => [item.id.toString(), item]));

    const lineItems = input.items.map((requested) => {
      const menuItem = menuItemsById.get(requested.menuItemId);
      if (!menuItem || !menuItem.isPublished || !menuItem.isAvailable || menuItem.deletedAt) {
        throw new ApiError(
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          `Menu item ${requested.menuItemId} is not available.`,
        );
      }

      return {
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        unitCents: menuItem.priceCents,
        quantity: requested.quantity,
        lineCents: menuItem.priceCents * requested.quantity,
        notes: requested.notes || null,
        currency: menuItem.currency,
      };
    });

    const currency = lineItems[0].currency;
    if (lineItems.some((item) => item.currency !== currency)) {
      throw new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        'All items in an order must use the same currency.',
      );
    }

    const subtotalCents = lineItems.reduce((sum, item) => sum + item.lineCents, 0);
    const totalCents = subtotalCents; // MVP: no tax/delivery fee modeling yet.
    const confirmationCode = this.confirmationCodeGenerator();

    const order = await this.orderRepository.create({
      confirmationCode,
      guestName: `${input.firstName} ${input.lastName}`,
      guestEmail: input.email,
      guestPhone: input.phone,
      currency,
      subtotalCents,
      totalCents,
      notes: input.notes || null,
      source: 'MOBILE_APP',
      deviceId: input.deviceId,
      os: input.os,
      items: {
        create: lineItems.map(({ currency: _currency, ...item }) => item),
      },
    });

    let checkoutSession;
    try {
      checkoutSession = await this.stripeGateway.createCheckoutSession({
        confirmationCode,
        currency,
        customerEmail: input.email,
        lineItems: lineItems.map((item) => ({
          name: item.itemName,
          unitCents: item.unitCents,
          quantity: item.quantity,
        })),
        successUrl: `${this.checkoutReturnScheme}?status=success&confirmationCode=${confirmationCode}`,
        cancelUrl: `${this.checkoutReturnScheme}?status=cancelled&confirmationCode=${confirmationCode}`,
      });
    } catch (error) {
      // Don't leave an order stuck at PENDING_PAYMENT with no way to pay for
      // it — cancel it so the guest (and admin views) see a clean failure
      // instead of a zombie order. The Stripe error is logged server-side
      // only — error.details is echoed straight to the client by
      // error-handler.middleware.js, so it must never carry raw upstream
      // error text.
      logger.error('Failed to create Stripe Checkout Session for order.', {
        confirmationCode,
        error: error.message,
      });
      await this.orderRepository.updateStatus(order.id, {
        status: 'CANCELLED',
        cancellationNote: 'Checkout session could not be created.',
      });
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Payment processing is temporarily unavailable. Please try again shortly.',
      );
    }

    const updatedOrder = await this.orderRepository.updateStatus(order.id, {
      paymentReference: checkoutSession.id,
    });

    return { order: toOrderResponse(updatedOrder), checkoutUrl: checkoutSession.url };
  }

  async lookupOrder(input) {
    const order = await this.orderRepository.findByConfirmationCode(input.confirmationCode);

    if (!order || order.guestEmail.toLowerCase() !== input.guestEmail.toLowerCase()) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Order not found.');
    }

    return toOrderResponse(order);
  }

  async cancelOrder(confirmationCode, input) {
    const order = await this.orderRepository.findByConfirmationCode(confirmationCode);

    if (!order || order.guestEmail.toLowerCase() !== input.guestEmail.toLowerCase()) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Order not found.');
    }

    if (!CANCELLABLE_STATUSES.has(order.status)) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        `An order with status ${order.status} can no longer be cancelled.`,
      );
    }

    let paymentStatus = order.paymentStatus;
    if (order.paymentStatus === 'PAID' && order.paymentReference) {
      await this.stripeGateway.refundPayment({ paymentIntentId: order.paymentReference });
      paymentStatus = 'REFUNDED';
    }

    const updatedOrder = await this.orderRepository.updateStatus(order.id, {
      status: 'CANCELLED',
      paymentStatus,
      cancelledAt: this.clock(),
      cancellationNote: input.reason || null,
    });

    return toOrderResponse(updatedOrder);
  }

  /**
   * Handles the `checkout.session.completed` webhook Stripe sends once a
   * guest finishes paying. Idempotent: replaying the same event is a no-op
   * if the order is already marked PAID.
   */
  async handleCheckoutCompleted(session) {
    const confirmationCode = session.metadata?.confirmationCode || session.client_reference_id;
    if (!confirmationCode) {
      return;
    }

    const order = await this.orderRepository.findByConfirmationCode(confirmationCode);
    if (!order || order.paymentStatus === 'PAID') {
      return;
    }

    await this.orderRepository.updateStatus(order.id, {
      status: 'PAID',
      paymentStatus: 'PAID',
      paidAt: this.clock(),
      // Swap the stored reference from the Checkout Session id to the
      // PaymentIntent id, since refunds are issued against the PaymentIntent.
      paymentReference: session.payment_intent || order.paymentReference,
    });
  }
}

module.exports = {
  OrderService,
  toOrderResponse,
  createConfirmationCode,
  CANCELLABLE_STATUSES,
};
