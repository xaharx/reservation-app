import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { toFriendlyErrorMessage } from '../../api/client';
import { deleteSetting, fetchSettings, saveSetting } from '../../api/cms';
import type { AppSetting } from '../../types/cms';

type FormState = { settingKey: string; value: string; description: string; isPublic: boolean };
const emptyForm: FormState = { settingKey: '', value: '', description: '', isPublic: false };

/** Lets admins type "30", "true", or a quoted/plain string and get the
 * right JSON type stored — falls back to a raw string if it's not valid
 * JSON (e.g. typing "Open daily" without quotes). */
function parseSettingValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<AppSetting | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppSetting | null>(null);

  function load() {
    setIsLoading(true);
    fetchSettings()
      .then(setSettings)
      .catch((err) => showToast('error', toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [showToast]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await saveSetting(form.settingKey, {
        value: parseSettingValue(form.value),
        description: form.description || undefined,
        isPublic: form.isPublic,
      });
      showToast('success', 'Setting saved.');
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
      await deleteSetting(deleteTarget.settingKey);
      showToast('success', 'Setting deleted.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  const isModalOpen = isCreating || Boolean(editing);

  return (
    <AppLayout title="Settings">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setIsCreating(true);
          }}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft hover:bg-navy-dark"
        >
          + Add setting
        </button>
      </div>

      {isLoading ? (
        <Spinner label="Loading settings…" />
      ) : settings.length === 0 ? (
        <EmptyState title="No settings yet" description="Add one above." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-card-border bg-cream">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-card-border bg-card/60 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Public</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} className="border-b border-card-border/60 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{setting.settingKey}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {JSON.stringify(setting.value)}
                  </td>
                  <td className="px-4 py-3">{setting.isPublic ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            settingKey: setting.settingKey,
                            value: JSON.stringify(setting.value),
                            description: setting.description ?? '',
                            isPublic: setting.isPublic,
                          });
                          setEditing(setting);
                        }}
                        className="font-medium text-navy hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(setting)}
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
          title={editing ? 'Edit setting' : 'Add setting'}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Key</label>
              <input
                required
                disabled={Boolean(editing)}
                placeholder="reservation_lead_time_minutes"
                value={form.settingKey}
                onChange={(event) => setForm({ ...form, settingKey: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-gold disabled:bg-card"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Value (JSON, or plain text)
              </label>
              <input
                required
                placeholder='30 or "Open daily" or true'
                value={form.value}
                onChange={(event) => setForm({ ...form, value: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Description (optional)
              </label>
              <input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dark">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) => setForm({ ...form, isPublic: event.target.checked })}
              />
              Public (exposed via GET /settings to the mobile app)
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
          title="Delete setting"
          message={`Delete "${deleteTarget.settingKey}"? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppLayout>
  );
}
