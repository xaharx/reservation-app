import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { fetchOrders } from '../api/orders';
import { toFriendlyErrorMessage } from '../api/client';
import { formatMoney } from '../utils/format';
import type { Order, OrderListParams, OrderStatus } from '../types/order';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [sortBy, setSortBy] = useState<OrderListParams['sortBy']>('createdAt');
  const [sortDir, setSortDir] = useState<OrderListParams['sortDir']>('desc');

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

    fetchOrders({
      page,
      limit: 20,
      ...(status && { status }),
      ...(search && { search }),
      sortBy,
      sortDir,
    })
      .then((result) => {
        if (cancelled) return;
        setOrders(result.data);
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
  }, [page, status, search, sortBy, sortDir]);

  function toggleSort(column: NonNullable<OrderListParams['sortBy']>) {
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
    <AppLayout title="Orders">
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
              setStatus(event.target.value as OrderStatus | '');
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
        {(status || search) && (
          <button
            type="button"
            onClick={() => {
              setStatus('');
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
          <Spinner label="Loading orders…" />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="Try adjusting your filters, or check back once new orders come in."
          />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-card-border bg-card/60 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('guestName')}>
                    Customer{sortIndicator('guestName')}
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('createdAt')}>
                    Placed{sortIndicator('createdAt')}
                  </th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-card-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{order.confirmationCode}</td>
                    <td className="px-4 py-3">{order.guestName}</td>
                    <td className="px-4 py-3 text-text-muted">{order.guestEmail}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item
                      {order.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'}
                    </td>
                    <td className="px-4 py-3">{formatMoney(order.totalCents, order.currency)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${order.id}`}
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
