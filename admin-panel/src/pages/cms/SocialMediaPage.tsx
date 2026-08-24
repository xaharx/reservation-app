import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { toFriendlyErrorMessage } from '../../api/client';
import {
  createSocialMediaLink,
  deleteSocialMediaLink,
  fetchSocialMediaLinks,
  updateSocialMediaLink,
} from '../../api/cms';
import type { SocialMediaLink } from '../../types/cms';

type FormState = { platform: string; profileUrl: string; iconUrl: string; isPublished: boolean };
const emptyForm: FormState = { platform: '', profileUrl: '', iconUrl: '', isPublished: true };

export function SocialMediaPage() {
  const { showToast } = useToast();
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<SocialMediaLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SocialMediaLink | null>(null);

  function load() {
    setIsLoading(true);
    fetchSocialMediaLinks()
      .then(setLinks)
      .catch((err) => showToast('error', toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [showToast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...form, iconUrl: form.iconUrl || undefined };
      if (editing) {
        await updateSocialMediaLink(editing.id, payload);
        showToast('success', 'Social media link updated.');
      } else {
        await createSocialMediaLink(payload);
        showToast('success', 'Social media link created.');
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
      await deleteSocialMediaLink(deleteTarget.id);
      showToast('success', 'Social media link deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  const isModalOpen = isCreating || Boolean(editing);

  return (
    <AppLayout title="Social Media">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setIsCreating(true);
          }}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft hover:bg-navy-dark"
        >
          + Add link
        </button>
      </div>

      {isLoading ? (
        <Spinner label="Loading social media links…" />
      ) : links.length === 0 ? (
        <EmptyState title="No social media links yet" description="Add one above." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-card-border bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-card-border bg-card/60 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Profile URL</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-card-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{link.platform}</td>
                  <td className="px-4 py-3 text-text-muted">
                    <a href={link.profileUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {link.profileUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">{link.isPublished ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            platform: link.platform,
                            profileUrl: link.profileUrl,
                            iconUrl: link.iconUrl ?? '',
                            isPublished: link.isPublished,
                          });
                          setEditing(link);
                        }}
                        className="font-medium text-navy hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(link)}
                        className="font-medium text-danger hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal
          title={editing ? 'Edit link' : 'Add link'}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Platform</label>
              <input
                required
                placeholder="instagram"
                value={form.platform}
                onChange={(event) => setForm({ ...form, platform: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Profile URL</label>
              <input
                required
                type="url"
                value={form.profileUrl}
                onChange={(event) => setForm({ ...form, profileUrl: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Icon URL (optional)
              </label>
              <input
                value={form.iconUrl}
                onChange={(event) => setForm({ ...form, iconUrl: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dark">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
              />
              Published
            </label>
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
          title="Delete link"
          message={`Delete the ${deleteTarget.platform} link? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
