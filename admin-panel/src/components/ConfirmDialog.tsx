import { useState } from 'react';
import { Modal } from './Modal';

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onCancel} widthClassName="max-w-md">
      <p className="text-sm text-text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-text-dark hover:bg-card disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            danger ? 'bg-danger hover:bg-danger/90' : 'bg-navy hover:bg-navy-dark'
          }`}
        >
          {isSubmitting ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
