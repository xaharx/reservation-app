import { apiClient } from './client';
import type { SuccessEnvelope } from '../types/api';
import type { Order, OrderListParams, OrderStats, OrderStatus } from '../types/order';

export type OrderListResult = {
  data: Order[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchOrders(params: OrderListParams): Promise<OrderListResult> {
  const response = await apiClient.get<SuccessEnvelope<Order[]>>('/admin/orders', { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function fetchOrderStats(): Promise<OrderStats> {
  const response = await apiClient.get<SuccessEnvelope<OrderStats>>('/admin/orders/stats');
  return response.data.data;
}

export async function fetchOrderById(id: string): Promise<Order> {
  const response = await apiClient.get<SuccessEnvelope<Order>>(`/admin/orders/${id}`);
  return response.data.data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  cancellationNote?: string,
): Promise<Order> {
  const response = await apiClient.patch<SuccessEnvelope<Order>>(`/admin/orders/${id}/status`, {
    status,
    ...(cancellationNote ? { cancellationNote } : {}),
  });
  return response.data.data;
}
