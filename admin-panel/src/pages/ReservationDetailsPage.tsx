import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { fetchReservationById, updateReservationStatus } from '../api/reservations';
import { toFriendlyErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { STATUS_TRANSITIONS, type Reservation, type ReservationStatus } from '../types/reservation';

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-dark">{value ?? '—'}</dd>
    </div>
  );
}

export function ReservationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(null);
  const [cancellationNote, setCancellationNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function load() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    fetchReservationById(id)
      .then(setReservation)
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [id]);

  async function applyStatusChange(status: ReservationStatus, note?: string) {
    if (!id) return;
    setIsSaving(true);
    try {
      const updated = await updateReservationStatus(id, status, note);
      setReservation(updated);
      showToast('success', `Status updated to ${status.replace('_', ' ')}.`);
      setPendingStatus(null);
      setCancellationNote('');
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function handleStatusClick(status: ReservationStatus) {
    if (status === 'CANCELLED') {
      setPendingStatus(status);
      return;
    }
    applyStatusChange(status);
  }

  return (
    <AppLayout title="Reservation details">
      <Link to="/reservations" className="mb-4 inline-block text-sm text-navy hover:underline">
        ← Back to reservations
      </Link>

      {isLoading && <Spinner label="Loading reservation…" />}
      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {reservation && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-card-border bg-cream p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-dark">
                  {reservation.confirmationCode}
                </h2>
                <StatusBadge status={reservation.status} />
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="First name" value={reservation.firstName} />
                <Field label="Last name" value={reservation.lastName} />
                <Field label="Email" value={reservation.email} />
                <Field label="Phone" value={reservation.phone} />
                <Field label="Reservation date" value={reservation.reservationDate} />
                <Field label="Reservation time" value={reservation.reservationTime} />
                <Field label="Guest count" value={reservation.guestCount} />
                <Field label="Special request" value={reservation.specialRequest} />
              </dl>
            </section>

            <section className="rounded-xl border border-card-border bg-cream p-5">
              <h2 className="mb-4 text-base font-semibold text-text-dark">Metadata</h2>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Device ID" value={reservation.deviceId} />
                <Field label="OS" value={reservation.os} />
                <Field
                  label="Created"
                  value={new Date(reservation.createdAt).toLocaleString()}
                />
                <Field
                  label="Last updated"
                  value={new Date(reservation.updatedAt).toLocaleString()}
                />
              </dl>
            </section>
          </div>

          <aside className="rounded-xl border border-card-border bg-cream p-5">
            <h2 className="mb-3 text-base font-semibold text-text-dark">Change status</h2>
            {STATUS_TRANSITIONS[reservation.status].length === 0 ? (
              <p className="text-sm text-text-muted">
                This reservation is in a final state and can no longer be changed.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {STATUS_TRANSITIONS[reservation.status].map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleStatusClick(status)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                      status === 'CANCELLED'
                        ? 'border-danger/30 text-danger hover:bg-danger/10'
                        : 'border-card-border text-text-dark hover:bg-card'
                    }`}
                  >
                    Mark as {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {pendingStatus === 'CANCELLED' && (
        <Modal title="Cancel reservation" onClose={() => setPendingStatus(null)}>
          <p className="mb-3 text-sm text-text-muted">
            A cancellation note is required — it's included in the notification sent to the guest.
          </p>
          <textarea
            value={cancellationNote}
            onChange={(event) => setCancellationNote(event.target.value)}
            rows={3}
            placeholder="e.g. Cancelled at guest's request"
            className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingStatus(null)}
              className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium hover:bg-card"
            >
              Never mind
            </button>
            <button
              type="button"
              disabled={!cancellationNote.trim() || isSaving}
              onClick={() => applyStatusChange('CANCELLED', cancellationNote.trim())}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? 'Cancelling…' : 'Cancel reservation'}
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
