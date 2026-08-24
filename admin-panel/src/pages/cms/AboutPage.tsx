import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { toFriendlyErrorMessage } from '../../api/client';
import {
  createAboutSection,
  deleteAboutSection,
  fetchAboutSections,
  updateAboutSection,
} from '../../api/cms';
import type { AboutSection } from '../../types/cms';

type FormState = {
  sectionKey: string;
  title: string;
  content: string;
  imageUrl: string;
  sortOrder: number;
  isPublished: boolean;
};

const emptyForm: FormState = {
  sectionKey: '',
  title: '',
  content: '',
  imageUrl: '',
  sortOrder: 0,
  isPublished: true,
};

export function AboutPage() {
  const { showToast } = useToast();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<AboutSection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AboutSection | null>(null);

  function load() {
    setIsLoading(true);
    fetchAboutSections()
      .then(setSections)
      .catch((err) => showToast('error', toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [showToast]);

  function openCreate() {
    setForm(emptyForm);
    setIsCreating(true);
  }

  function openEdit(section: AboutSection) {
    setForm({
      sectionKey: section.sectionKey,
      title: section.title,
      content: section.content,
      imageUrl: section.imageUrl ?? '',
      sortOrder: section.sortOrder,
      isPublished: section.isPublished,
    });
    setEditing(section);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        imageUrl: form.imageUrl || undefined,
      };
      if (editing) {
        await updateAboutSection(editing.id, payload);
        showToast('success', 'About section updated.');
      } else {
        await createAboutSection(payload);
        showToast('success', 'About section created.');
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
      await deleteAboutSection(deleteTarget.id);
      showToast('success', 'About section deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  const isModalOpen = isCreating || Boolean(editing);

  return (
    <AppLayout title="About">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft hover:bg-navy-dark"
        >
          + Add section
        </button>
      </div>

      {isLoading ? (
        <Spinner label="Loading about sections…" />
      ) : sections.length === 0 ? (
        <EmptyState title="No about sections yet" description="Add your first section above." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <div key={section.id} className="rounded-xl border border-card-border bg-cream p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-dark">{section.title}</p>
                  <p className="text-xs text-text-muted">{section.sectionKey}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    section.isPublished
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {section.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="mb-3 line-clamp-3 text-sm text-text-muted">{section.content}</p>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => openEdit(section)}
                  className="font-medium text-navy hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(section)}
                  className="font-medium text-danger hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          title={editing ? 'Edit about section' : 'Add about section'}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Section key
              </label>
              <input
                required
                disabled={Boolean(editing)}
                value={form.sectionKey}
                onChange={(event) => setForm({ ...form, sectionKey: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold disabled:bg-card"
              />
            </div>
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
              <label className="mb-1 block text-xs font-medium text-text-muted">Content</label>
              <textarea
                required
                rows={5}
                value={form.content}
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Image URL (optional)
              </label>
              <input
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
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
          title="Delete about section"
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
