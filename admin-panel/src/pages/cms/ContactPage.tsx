import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { toFriendlyErrorMessage } from '../../api/client';
import { createContact, deleteContact, fetchContacts, updateContact } from '../../api/cms';
import type { Contact } from '../../types/cms';

type FormState = {
  label: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  postalCode: string;
  isPrimary: boolean;
};

const emptyForm: FormState = {
  label: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  postalCode: '',
  isPrimary: false,
};

function toForm(contact: Contact): FormState {
  return {
    label: contact.label,
    phone: contact.phone ?? '',
    email: contact.email ?? '',
    addressLine1: contact.addressLine1 ?? '',
    addressLine2: contact.addressLine2 ?? '',
    city: contact.city ?? '',
    country: contact.country ?? '',
    postalCode: contact.postalCode ?? '',
    isPrimary: contact.isPrimary,
  };
}

function cleanPayload(form: FormState) {
  return {
    label: form.label,
    phone: form.phone || undefined,
    email: form.email || undefined,
    addressLine1: form.addressLine1 || undefined,
    addressLine2: form.addressLine2 || undefined,
    city: form.city || undefined,
    country: form.country || undefined,
    postalCode: form.postalCode || undefined,
    isPrimary: form.isPrimary,
  };
}

export function ContactPage() {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  function load() {
    setIsLoading(true);
    fetchContacts()
      .then(setContacts)
      .catch((err) => showToast('error', toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [showToast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = cleanPayload(form);
      if (editing) {
        await updateContact(editing.id, payload);
        showToast('success', 'Contact updated.');
      } else {
        await createContact(payload);
        showToast('success', 'Contact created.');
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
      await deleteContact(deleteTarget.id);
      showToast('success', 'Contact deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  const isModalOpen = isCreating || Boolean(editing);

  return (
    <AppLayout title="Contact">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setIsCreating(true);
          }}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft hover:bg-navy-dark"
        >
          + Add contact
        </button>
      </div>

      {isLoading ? (
        <Spinner label="Loading contact information…" />
      ) : contacts.length === 0 ? (
        <EmptyState title="No contact entries yet" description="Add one above." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-xl border border-card-border bg-cream p-4">
              <div className="mb-2 flex items-start justify-between">
                <p className="text-sm font-semibold text-text-dark">{contact.label}</p>
                {contact.isPrimary && (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted">{contact.phone || '—'}</p>
              <p className="text-sm text-text-muted">{contact.email || '—'}</p>
              <p className="text-sm text-text-muted">
                {[contact.addressLine1, contact.city, contact.country].filter(Boolean).join(', ') ||
                  '—'}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setForm(toForm(contact));
                    setEditing(contact);
                  }}
                  className="font-medium text-navy hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(contact)}
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
          title={editing ? 'Edit contact' : 'Add contact'}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Label</label>
              <input
                required
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Phone</label>
                <input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Address line 1
              </label>
              <input
                value={form.addressLine1}
                onChange={(event) => setForm({ ...form, addressLine1: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Address line 2
              </label>
              <input
                value={form.addressLine2}
                onChange={(event) => setForm({ ...form, addressLine2: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">City</label>
                <input
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Country</label>
                <input
                  value={form.country}
                  onChange={(event) => setForm({ ...form, country: event.target.value })}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">
                  Postal code
                </label>
                <input
                  value={form.postalCode}
                  onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
                  className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dark">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(event) => setForm({ ...form, isPrimary: event.target.checked })}
              />
              Primary contact
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
          title="Delete contact"
          message={`Delete "${deleteTarget.label}"? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
