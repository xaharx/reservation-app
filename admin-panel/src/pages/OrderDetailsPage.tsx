import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { Spinner } from '../components/Spinner';
import { Modal } from '../components/Modal';
import { fetchOrderById, updateOrderStatus } from '../api/orders';
import { toFriendlyErrorMessage } from '../api/client';
import { formatMoney } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { ORDER_STATUS_TRANSITIONS, type Order, type OrderStatus } from '../types/order';

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-dark">{value ?? '—'}</dd>
    </div>
  );
}

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [cancellationNote, setCancellationNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function load() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    fetchOrderById(id)
      .then(setOrder)
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [id]);

  async function applyStatusChange(status: OrderStatus, note?: string) {
    if (!id) return;
    setIsSaving(true);
    try {
      const updated = await updateOrderStatus(id, status, note);
      setOrder(updated);
      showToast('success', `Status updated to ${status.replace('_', ' ')}.`);
      setPendingStatus(null);
      setCancellationNote('');
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function handleStatusClick(status: OrderStatus) {
    if (status === 'CANCELLED') {
      setPendingStatus(status);
      return;
    }
    applyStatusChange(status);
  }

  return (
    <AppLayout title="Order details">
      <Link to="/orders" className="mb-4 inline-block text-sm text-navy hover:underline">
        ← Back to orders
      </Link>

      {isLoading && <Spinner label="Loading order…" />}
      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {order && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-xl border border-card-border bg-cream p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-dark">{order.confirmationCode}</h2>
                <OrderStatusBadge status={order.status} />
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Guest name" value={order.guestName} />
                <Field label="Email" value={order.guestEmail} />
                <Field label="Phone" value={order.guestPhone} />
                <Field label="Payment status" value={order.paymentStatus} />
                <Field label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
                <Field label="Total" value={formatMoney(order.totalCents, order.currency)} />
                <Field label="Notes" value={order.notes} />
              </dl>
            </section>

            <section className="rounded-xl border border-card-border bg-cream p-5">
              <h2 className="mb-4 text-base font-semibold text-text-dark">Items</h2>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-card-border text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="py-2">Item</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Unit price</th>
                    <th className="py-2">Line total</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-card-border/60 last:border-0">
                      <td className="py-2">{item.itemName}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">{formatMoney(item.unitCents, order.currency)}</td>
                      <td className="py-2">{formatMoney(item.lineCents, order.currency)}</td>
                      <td className="py-2 text-text-muted">{item.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-xl border border-card-border bg-cream p-5">
              <h2 className="mb-4 text-base font-semibold text-text-dark">Metadata</h2>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Paid at" value={order.paidAt ? new Date(order.paidAt).toLocaleString() : null} />
                <Field
                  label="Cancelled at"
                  value={order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : null}
                />
                <Field label="Cancellation note" value={order.cancellationNote} />
                <Field label="Created" value={new Date(order.createdAt).toLocaleString()} />
                <Field label="Last updated" value={new Date(order.updatedAt).toLocaleString()} />
              </dl>
            </section>
          </div>

          <aside className="rounded-xl border border-card-border bg-cream p-5">
            <h2 className="mb-3 text-base font-semibold text-text-dark">Change status</h2>
            {ORDER_STATUS_TRANSITIONS[order.status].length === 0 ? (
              <p className="text-sm text-text-muted">
                This order is in a final state and can no longer be changed.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {ORDER_STATUS_TRANSITIONS[order.status].map((status) => (
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
            {order.paymentStatus === 'PAID' && (
              <p className="mt-3 text-xs text-text-muted">
                Cancelling a paid order automatically issues a Stripe refund.
              </p>
            )}
          </aside>
        </div>
      )}

      {pendingStatus === 'CANCELLED' && (
        <Modal title="Cancel order" onClose={() => setPendingStatus(null)}>
          <p className="mb-3 text-sm text-text-muted">
            A cancellation note is required — it's included in the notification sent to the guest.
            {order?.paymentStatus === 'PAID' && ' This will also issue a Stripe refund.'}
          </p>
          <textarea
            value={cancellationNote}
            onChange={(event) => setCancellationNote(event.target.value)}
            rows={3}
            placeholder="e.g. Kitchen ran out of stock"
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
              {isSaving ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
