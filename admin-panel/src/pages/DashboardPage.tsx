import { useEffect, useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { Spinner } from '../components/Spinner';
import { fetchReservationStats } from '../api/reservations';
import { fetchOrderStats } from '../api/orders';
import { toFriendlyErrorMessage } from '../api/client';
import { formatMoney } from '../utils/format';
import type { ReservationStats } from '../types/reservation';
import type { OrderStats } from '../types/order';

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent ? 'border-gold bg-navy text-cream' : 'border-card-border bg-cream text-text-dark'
      }`}
    >
      <p className={`text-sm ${accent ? 'text-gold-soft' : 'text-text-muted'}`}>{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchReservationStats(), fetchOrderStats()])
      .then(([reservations, orders]) => {
        setReservationStats(reservations);
        setOrderStats(orders);
      })
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppLayout title="Dashboard">
      {isLoading && <Spinner label="Loading dashboard…" />}
      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {reservationStats && (
        <div className="mb-8 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Reservations
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total reservations" value={reservationStats.total} accent />
            <StatCard label="Today" value={reservationStats.today} />
            <StatCard label="Upcoming" value={reservationStats.upcoming} />
            <StatCard label="Pending" value={reservationStats.byStatus.PENDING} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Confirmed" value={reservationStats.byStatus.CONFIRMED} />
            <StatCard label="Seated" value={reservationStats.byStatus.SEATED} />
            <StatCard label="Completed" value={reservationStats.byStatus.COMPLETED} />
            <StatCard label="Cancelled" value={reservationStats.byStatus.CANCELLED} />
            <StatCard label="No-shows" value={reservationStats.byStatus.NO_SHOW} />
          </div>
        </div>
      )}

      {orderStats && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Orders</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total orders" value={orderStats.total} accent />
            <StatCard label="Today" value={orderStats.today} />
            <StatCard label="Revenue (paid)" value={formatMoney(orderStats.revenueCents, 'usd')} />
            <StatCard label="Preparing" value={orderStats.byStatus.PREPARING} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Pending payment" value={orderStats.byStatus.PENDING_PAYMENT} />
            <StatCard label="Paid" value={orderStats.byStatus.PAID} />
            <StatCard label="Ready" value={orderStats.byStatus.READY} />
            <StatCard label="Completed" value={orderStats.byStatus.COMPLETED} />
            <StatCard label="Cancelled" value={orderStats.byStatus.CANCELLED} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
