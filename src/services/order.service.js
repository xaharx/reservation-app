const { randomUUID } = require('crypto');
const { env } = require('../config/env');
const logger = require('../config/logger');
const { OrderRepository } = require('../repositories/order.repository');
const { MenuRepository } = require('../repositories/menu.repository');
const { StripeGateway } = require('./stripe-gateway');
const { NotificationService } = require('./notification.service');
const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');

// Orders can only be cancelled before they've been handed over — once READY
// or COMPLETED, cancelling (and refunding) no longer makes sense.
const CANCELLABLE_STATUSES = new Set(['PENDING_PAYMENT', 'PAID', 'PREPARING']);

// Staff-driven lifecycle, set via PATCH /admin/orders/:id/status. PAID itself
// is only ever set by the Stripe webhook (handleCheckoutCompleted), never by
// staff, so it isn't a target of any transition here.
const ORDER_STATUS_TRANSITIONS = Object.freeze({
  PENDING_PAYMENT: ['CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
});

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
    notificationService = new NotificationService(),
    confirmationCodeGenerator = createConfirmationCode,
    clock = () => new Date(),
    checkoutReturnScheme = env.ORDER_CHECKOUT_RETURN_SCHEME,
  } = {}) {
    this.orderRepository = orderRepository;
    this.menuRepository = menuRepository;
    this.stripeGateway = stripeGateway;
    this.notificationService = notificationService;
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
      pushToken: input.pushToken,
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

    await this.notificationService.notifyOrderCancelled(updatedOrder);

    return toOrderResponse(updatedOrder);
  }

  async getOrderById(id) {
    const order = await this.orderRepository.findById(BigInt(id));
    if (!order) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Order not found.');
    }

    return toOrderResponse(order);
  }

  async listOrders(query) {
    const { page, limit, status, search, sortBy, sortDir } = query;
    const result = await this.orderRepository.findMany({
      skip: (page - 1) * limit,
      take: limit,
      status,
      search,
      sortBy,
      sortDir,
    });

    return {
      data: result.orders.map((order) => toOrderResponse(order)),
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Dashboard stats, computed from real counts only — no invented figures.
   * "Today" is orders placed today (by createdAt); revenue only counts
   * orders whose payment actually succeeded (excludes refunded ones).
   */
  async getOrderStats() {
    const now = this.clock();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [statusRows, total, today, revenueCents] = await Promise.all([
      this.orderRepository.countByStatus(),
      this.orderRepository.countByDateRange({}),
      this.orderRepository.countByDateRange({ from: startOfToday, to: startOfTomorrow }),
      this.orderRepository.sumPaidRevenueCents(),
    ]);

    const byStatus = {
      PENDING_PAYMENT: 0,
      PAID: 0,
      PREPARING: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const row of statusRows) {
      byStatus[row.status] = row._count._all;
    }

    return { total, byStatus, today, revenueCents };
  }

  async updateOrderStatus(id, input) {
    const order = await this.orderRepository.findById(BigInt(id));
    if (!order) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Order not found.');
    }

    if (!ORDER_STATUS_TRANSITIONS[order.status].includes(input.status)) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        `Cannot change order status from ${order.status} to ${input.status}.`,
      );
    }

    if (input.status === 'CANCELLED') {
      // Same refund behaviour as the guest-initiated cancellation endpoint.
      let paymentStatus = order.paymentStatus;
      if (order.paymentStatus === 'PAID' && order.paymentReference) {
        await this.stripeGateway.refundPayment({ paymentIntentId: order.paymentReference });
        paymentStatus = 'REFUNDED';
      }

      const cancelledOrder = await this.orderRepository.updateStatus(BigInt(id), {
        status: 'CANCELLED',
        paymentStatus,
        cancelledAt: this.clock(),
        cancellationNote: input.cancellationNote,
      });

      await this.notificationService.notifyOrderCancelled(cancelledOrder);

      return toOrderResponse(cancelledOrder);
    }

    const updatedOrder = await this.orderRepository.updateStatus(BigInt(id), {
      status: input.status,
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

    const updatedOrder = await this.orderRepository.updateStatus(order.id, {
      status: 'PAID',
      paymentStatus: 'PAID',
      paidAt: this.clock(),
      // Swap the stored reference from the Checkout Session id to the
      // PaymentIntent id, since refunds are issued against the PaymentIntent.
      paymentReference: session.payment_intent || order.paymentReference,
    });

    await this.notificationService.notifyOrderPaid(updatedOrder);
  }
}

module.exports = {
  OrderService,
  toOrderResponse,
  createConfirmationCode,
  CANCELLABLE_STATUSES,
  ORDER_STATUS_TRANSITIONS,
};
