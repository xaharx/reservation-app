import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { toFriendlyErrorMessage } from '../../api/client';
import { createBanner, deleteBanner, fetchBanners, updateBanner } from '../../api/cms';
import type { Banner, BannerPlacement } from '../../types/cms';

const PLACEMENTS: BannerPlacement[] = [
  'HOME_HERO',
  'HOME_PROMOTION',
  'RESERVATION',
  'APP_MODAL',
];

type FormState = {
  title: string;
  subtitle: string;
  imageUrl: string;
  actionLabel: string;
  actionUrl: string;
  placement: BannerPlacement;
  sortOrder: number;
  isPublished: boolean;
};

const emptyForm: FormState = {
  title: '',
  subtitle: '',
  imageUrl: '',
  actionLabel: '',
  actionUrl: '',
  placement: 'HOME_HERO',
  sortOrder: 0,
  isPublished: false,
};

export function HomePage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  function load() {
    setIsLoading(true);
    fetchBanners()
      .then(setBanners)
      .catch((err) => showToast('error', toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [showToast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        subtitle: form.subtitle || undefined,
        actionLabel: form.actionLabel || undefined,
        actionUrl: form.actionUrl || undefined,
      };
      if (editing) {
        await updateBanner(editing.id, payload);
        showToast('success', 'Banner updated.');
      } else {
        await createBanner(payload);
        showToast('success', 'Banner created.');
      }
      setEditing(null);
      setIsCreating(false);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteBanner(deleteTarget.id);
      showToast('success', 'Banner deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  const isModalOpen = isCreating || Boolean(editing);

  return (
    <AppLayout title="Home">
      <p className="mb-4 text-sm text-text-muted">
        Manages the banners the mobile app's Home screen aggregates (hero, promotions, and other
        placements). The Home content itself is a computed view of banners + top About sections +
        featured Gallery images.
      </p>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setIsCreating(true);
          }}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft hover:bg-navy-dark"
        >
          + Add banner
        </button>
      </div>

      {isLoading ? (
        <Spinner label="Loading banners…" />
      ) : banners.length === 0 ? (
        <EmptyState title="No banners yet" description="Add your first banner above." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-xl border border-card-border bg-cream">
              {banner.imageUrl && (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-dark">{banner.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      banner.isPublished
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {banner.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-text-muted">{banner.placement.replace('_', ' ')}</p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        title: banner.title,
                        subtitle: banner.subtitle ?? '',
                        imageUrl: banner.imageUrl,
                        actionLabel: banner.actionLabel ?? '',
                        actionUrl: banner.actionUrl ?? '',
                        placement: banner.placement,
                        sortOrder: banner.sortOrder,
                        isPublished: banner.isPublished,
                      });
                      setEditing(banner);
                    }}
                    className="font-medium text-navy hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(banner)}
                    className="font-medium text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          title={editing ? 'Edit banner' : 'Add banner'}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Title</label>
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Image URL</label>
              <input
                required
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                placeholder="Paste a URL, or upload via the Gallery page and copy its URL"
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">
                  Action label
                </label>
                <input
                  value={form.actionLabel}
                  onChange={(event) => setForm({ ...form, actionLabel: event.target.value })}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">
                  Action URL
                </label>
                <input
                  value={form.actionUrl}
                  onChange={(event) => setForm({ ...form, actionUrl: event.target.value })}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Placement</label>
              <select
                value={form.placement}
                onChange={(event) =>
                  setForm({ ...form, placement: event.target.value as BannerPlacement })
                }
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              >
                {PLACEMENTS.map((placement) => (
                  <option key={placement} value={placement}>
                    {placement.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">
                  Sort order
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm({ ...form, sortOrder: Number(event.target.value) })
                  }
                  className="w-24 rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <label className="mt-5 flex items-center gap-2 text-sm text-text-dark">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
                />
                Published
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setIsCreating(false);
                }}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium hover:bg-card"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete banner"
          message={`Delete "${deleteTarget.title}"? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
