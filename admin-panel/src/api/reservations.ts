import { apiClient } from './client';
import type { SuccessEnvelope } from '../types/api';
import type {
  Reservation,
  ReservationListParams,
  ReservationStats,
  ReservationStatus,
} from '../types/reservation';

export type ReservationListResult = {
  data: Reservation[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchReservations(
  params: ReservationListParams,
): Promise<ReservationListResult> {
  const response = await apiClient.get<SuccessEnvelope<Reservation[]>>('/admin/reservations', {
    params,
  });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function fetchReservationStats(): Promise<ReservationStats> {
  const response = await apiClient.get<SuccessEnvelope<ReservationStats>>(
    '/admin/reservations/stats',
  );
  return response.data.data;
}

export async function fetchReservationById(id: string): Promise<Reservation> {
  const response = await apiClient.get<SuccessEnvelope<Reservation>>(`/reservations/${id}`);
  return response.data.data;
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  cancellationNote?: string,
): Promise<Reservation> {
  const response = await apiClient.patch<SuccessEnvelope<Reservation>>(
    `/admin/reservations/${id}/status`,
    { status, ...(cancellationNote ? { cancellationNote } : {}) },
  );
  return response.data.data;
}
