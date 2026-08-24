import { useEffect, useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { Spinner } from '../components/Spinner';
import { fetchReservationStats } from '../api/reservations';
import { toFriendlyErrorMessage } from '../api/client';
import type { ReservationStats } from '../types/reservation';

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
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
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReservationStats()
      .then(setStats)
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppLayout title="Dashboard">
      {isLoading && <Spinner label="Loading dashboard…" />}
      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total reservations" value={stats.total} accent />
            <StatCard label="Today" value={stats.today} />
            <StatCard label="Upcoming" value={stats.upcoming} />
            <StatCard label="Pending" value={stats.byStatus.PENDING} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              By status
            </h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatCard label="Confirmed" value={stats.byStatus.CONFIRMED} />
              <StatCard label="Seated" value={stats.byStatus.SEATED} />
              <StatCard label="Completed" value={stats.byStatus.COMPLETED} />
              <StatCard label="Cancelled" value={stats.byStatus.CANCELLED} />
              <StatCard label="No-shows" value={stats.byStatus.NO_SHOW} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
