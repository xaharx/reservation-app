import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import { ApiRequestError, type ApiFieldError } from './reservations';

export { ApiRequestError };

type SuccessEnvelope<T> = { success: true; message: string; data: T };
type ErrorEnvelope = {
  success: false;
  message: string;
  code?: string;
  errors?: ApiFieldError[];
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.', 0);
  }

  let payload: SuccessEnvelope<T> | ErrorEnvelope | undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message ?? 'Something went wrong. Please try again.';
    const code = payload && !payload.success ? payload.code : undefined;
    const fieldErrors = payload && !payload.success ? payload.errors ?? [] : [];
    throw new ApiRequestError(message, response.status, code, fieldErrors);
  }

  return payload.data;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type OrderItemResponse = {
  id: string;
  menuItemId: string;
  itemName: string;
  unitCents: number;
  quantity: number;
  lineCents: number;
  notes: string | null;
};

export type OrderResponse = {
  id: string;
  confirmationCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  items: OrderItemResponse[];
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  items: { menuItemId: string; quantity: number; notes?: string }[];
  notes?: string;
  pushToken?: string | null;
};

export type CreateOrderResult = {
  order: OrderResponse;
  checkoutUrl: string;
};

export function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { pushToken, ...rest } = input;
  return postJson<CreateOrderResult>('/orders', {
    ...rest,
    ...(pushToken ? { pushToken } : {}),
    os: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
  });
}

export type LookupOrderInput = {
  confirmationCode: string;
  guestEmail: string;
};

export function lookupOrder(input: LookupOrderInput): Promise<OrderResponse> {
  return postJson<OrderResponse>('/orders/lookup', input);
}

export type CancelOrderInput = {
  confirmationCode: string;
  guestEmail: string;
  reason?: string;
};

export function cancelOrder({ confirmationCode, ...body }: CancelOrderInput): Promise<OrderResponse> {
  return postJson<OrderResponse>(
    `/orders/${encodeURIComponent(confirmationCode)}/cancellation`,
    body,
  );
}
