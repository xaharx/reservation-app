import type { OrderStatus } from '../types/order';

const STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-300',
  PAID: 'bg-sky-100 text-sky-800 border-sky-300',
  PREPARING: 'bg-violet-100 text-violet-800 border-violet-300',
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
