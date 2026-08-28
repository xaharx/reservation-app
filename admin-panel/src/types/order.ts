// Matches src/services/order.service.js's toOrderResponse() and the
// ORDER_STATUS_TRANSITIONS matrix exactly — the UI must never offer a
// transition the backend would reject. PAID is not a transition target
// here: it's only ever set by the Stripe webhook, never by staff.
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type OrderPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  itemName: string;
  unitCents: number;
  quantity: number;
  lineCents: number;
  notes: string | null;
};

// Snapshot of where the order was to be delivered, captured at checkout —
// matches src/services/order.service.js's toOrderResponse() exactly. Null
// for any order placed before this feature existed.
export type DeliveryAddress = {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
};

export type Order = {
  id: string;
  confirmationCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  deliveryAddress: DeliveryAddress | null;
  items: OrderItem[];
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderListParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  sortBy?: 'createdAt' | 'guestName';
  sortDir?: 'asc' | 'desc';
};

export type OrderStats = {
  total: number;
  byStatus: Record<OrderStatus, number>;
  today: number;
  // Sum of totalCents across orders whose payment actually succeeded
  // (excludes refunded/unpaid) — real revenue, not an estimate.
  revenueCents: number;
};
