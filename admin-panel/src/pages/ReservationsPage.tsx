import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { fetchReservations } from '../api/reservations';
import { toFriendlyErrorMessage } from '../api/client';
import type { Reservation, ReservationListParams, ReservationStatus } from '../types/reservation';

const STATUS_OPTIONS: ReservationStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SEATED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const [reservationDate, setReservationDate] = useState('');
  const [sortBy, setSortBy] = useState<ReservationListParams['sortBy']>('reservationDate');
  const [sortDir, setSortDir] = useState<ReservationListParams['sortDir']>('asc');

  // Debounce the free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchReservations({
      page,
      limit: 20,
      ...(status && { status }),
      ...(reservationDate && { reservationDate }),
      ...(search && { search }),
      sortBy,
      sortDir,
    })
      .then((result) => {
        if (cancelled) return;
        setReservations(result.data);
        setMeta(result.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(toFriendlyErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, status, reservationDate, search, sortBy, sortDir]);

  function toggleSort(column: NonNullable<ReservationListParams['sortBy']>) {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  function sortIndicator(column: string) {
    if (sortBy !== column) return null;
    return <span className="text-gold">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>;
  }

  return (
    <AppLayout title="Reservations">
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-card-border bg-cream p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1 block text-xs font-medium text-text-muted">Search</label>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Name, email, phone, or code"
            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Status</label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ReservationStatus | '');
              setPage(1);
            }}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Date</label>
          <input
            type="date"
            value={reservationDate}
            onChange={(event) => {
              setReservationDate(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        {(status || reservationDate || search) && (
          <button
            type="button"
            onClick={() => {
              setStatus('');
              setReservationDate('');
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:text-text-dark"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-card-border bg-cream">
        {isLoading ? (
          <Spinner label="Loading reservations…" />
        ) : reservations.length === 0 ? (
          <EmptyState
            title="No reservations found"
            description="Try adjusting your filters, or check back once new bookings come in."
          />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-card-border bg-card/60 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => toggleSort('guestName')}
                  >
                    Customer{sortIndicator('guestName')}
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => toggleSort('reservationDate')}
                  >
                    Date / Time{sortIndicator('reservationDate')}
                  </th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Status</th>
                  <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => toggleSort('createdAt')}
                  >
                    Created{sortIndicator('createdAt')}
                  </th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-card-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{reservation.confirmationCode}</td>
                    <td className="px-4 py-3">
                      {reservation.firstName} {reservation.lastName}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{reservation.email}</td>
                    <td className="px-4 py-3 text-text-muted">{reservation.phone}</td>
                    <td className="px-4 py-3">
                      {formatDate(reservation.reservationDate)} · {formatTime(reservation.reservationTime)}
                    </td>
                    <td className="px-4 py-3">{reservation.guestCount}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(reservation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/reservations/${reservation.id}`}
                        className="text-sm font-medium text-navy hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-card-border px-4 py-3 text-sm text-text-muted">
              <span>
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-card-border px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-card-border px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
