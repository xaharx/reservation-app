import type { ReservationStatus } from '../types/reservation';

const STYLES: Record<ReservationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  SEATED: 'bg-sky-100 text-sky-800 border-sky-300',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
  NO_SHOW: 'bg-orange-100 text-orange-800 border-orange-300',
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
