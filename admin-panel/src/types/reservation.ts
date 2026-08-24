// Matches src/services/reservation.service.js's toReservationResponse() and
// the STATUS_TRANSITIONS matrix exactly — the UI must never offer a
// transition the backend would reject.
export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SEATED', 'CANCELLED', 'NO_SHOW'],
  SEATED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export type Reservation = {
  id: string;
  confirmationCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequest: string | null;
  status: ReservationStatus;
  deviceId: string | null;
  os: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReservationListParams = {
  page?: number;
  limit?: number;
  status?: ReservationStatus;
  reservationDate?: string;
  search?: string;
  sortBy?: 'reservationDate' | 'createdAt' | 'guestName';
  sortDir?: 'asc' | 'desc';
};

export type ReservationStats = {
  total: number;
  byStatus: Record<ReservationStatus, number>;
  today: number;
  upcoming: number;
};
