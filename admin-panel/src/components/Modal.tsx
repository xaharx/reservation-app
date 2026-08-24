import type { ReactNode } from 'react';

export function Modal({
  title,
  onClose,
  children,
  widthClassName = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full ${widthClassName} rounded-xl bg-cream shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h2 className="text-lg font-semibold text-text-dark">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-text-muted hover:bg-card hover:text-text-dark"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
