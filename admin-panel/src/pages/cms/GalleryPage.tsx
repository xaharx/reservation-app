import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { toFriendlyErrorMessage } from '../../api/client';
import {
  deleteGalleryImage,
  fetchGalleryImages,
  updateGalleryImage,
  uploadGalleryImage,
} from '../../api/cms';
import type { GalleryImage } from '../../types/cms';

type UploadFormState = {
  title: string;
  altText: string;
  category: string;
  isPublished: boolean;
};
const emptyUploadForm: UploadFormState = {
  title: '',
  altText: '',
  category: '',
  isPublished: true,
};

export function GalleryPage() {
  const { showToast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadFormState>(emptyUploadForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setIsLoading(true);
    fetchGalleryImages()
      .then(setImages)
      .catch((err) => showToast('error', toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [showToast]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!selectedFile) {
      showToast('error', 'Choose an image file first.');
      return;
    }
    setIsSaving(true);
    try {
      await uploadGalleryImage(selectedFile, {
        title: uploadForm.title || undefined,
        altText: uploadForm.altText || undefined,
        category: uploadForm.category || undefined,
        isPublished: uploadForm.isPublished,
      });
      showToast('success', 'Image uploaded.');
      setIsUploadOpen(false);
      setUploadForm(emptyUploadForm);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateMetadata(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setIsSaving(true);
    try {
      await updateGalleryImage(editing.id, {
        title: editing.title ?? undefined,
        altText: editing.altText ?? undefined,
        category: editing.category ?? undefined,
        isPublished: editing.isPublished,
      });
      showToast('success', 'Image updated.');
      setEditing(null);
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
      await deleteGalleryImage(deleteTarget.id);
      showToast('success', 'Image deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  return (
    <AppLayout title="Gallery">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft hover:bg-navy-dark"
        >
          + Upload image
        </button>
      </div>

      {isLoading ? (
        <Spinner label="Loading gallery…" />
      ) : images.length === 0 ? (
        <EmptyState title="No images yet" description="Upload your first gallery image above." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-card-border bg-cream">
              <img
                src={image.imageUrl}
                alt={image.altText ?? image.title ?? 'Gallery image'}
                className="h-32 w-full object-cover"
              />
              <div className="p-3">
                <p className="truncate text-sm font-medium text-text-dark">
                  {image.title || 'Untitled'}
                </p>
                <p className="text-xs text-text-muted">{image.category || 'Uncategorized'}</p>
                <div className="mt-2 flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setEditing(image)}
                    className="font-medium text-navy hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(image)}
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

      {isUploadOpen && (
        <Modal title="Upload gallery image" onClose={() => setIsUploadOpen(false)}>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Image file</label>
              <input
                ref={fileInputRef}
                required
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Title</label>
              <input
                value={uploadForm.title}
                onChange={(event) => setUploadForm({ ...uploadForm, title: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Alt text</label>
              <input
                value={uploadForm.altText}
                onChange={(event) => setUploadForm({ ...uploadForm, altText: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Category</label>
              <input
                value={uploadForm.category}
                onChange={(event) => setUploadForm({ ...uploadForm, category: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dark">
              <input
                type="checkbox"
                checked={uploadForm.isPublished}
                onChange={(event) =>
                  setUploadForm({ ...uploadForm, isPublished: event.target.checked })
                }
              />
              Published
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium hover:bg-card"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft disabled:opacity-50"
              >
                {isSaving ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit image details" onClose={() => setEditing(null)}>
          <form onSubmit={handleUpdateMetadata} className="space-y-3">
            <img
              src={editing.imageUrl}
              alt=""
              className="mb-2 h-32 w-full rounded-lg object-cover"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Title</label>
              <input
                value={editing.title ?? ''}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Alt text</label>
              <input
                value={editing.altText ?? ''}
                onChange={(event) => setEditing({ ...editing, altText: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Category</label>
              <input
                value={editing.category ?? ''}
                onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dark">
              <input
                type="checkbox"
                checked={editing.isPublished}
                onChange={(event) => setEditing({ ...editing, isPublished: event.target.checked })}
              />
              Published
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
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
          title="Delete image"
          message="Delete this image? This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
