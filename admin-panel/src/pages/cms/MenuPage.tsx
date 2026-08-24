import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Spinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { toFriendlyErrorMessage } from '../../api/client';
import { formatMoney } from '../../utils/format';
import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  fetchMenuCategories,
  fetchMenuItems,
  updateMenuCategory,
  updateMenuItem,
} from '../../api/menu';
import type { MenuCategory, MenuItem } from '../../types/menu';

type CategoryFormState = { name: string; description: string; isPublished: boolean };
const emptyCategoryForm: CategoryFormState = { name: '', description: '', isPublished: true };

type ItemFormState = {
  categoryId: string;
  name: string;
  description: string;
  priceDollars: string;
  isAvailable: boolean;
  isPublished: boolean;
};
const emptyItemForm: ItemFormState = {
  categoryId: '',
  name: '',
  description: '',
  priceDollars: '',
  isAvailable: true,
  isPublished: true,
};

function toItemForm(item: MenuItem): ItemFormState {
  return {
    categoryId: item.categoryId,
    name: item.name,
    description: item.description ?? '',
    priceDollars: (item.priceCents / 100).toFixed(2),
    isAvailable: item.isAvailable,
    isPublished: item.isPublished,
  };
}

export function MenuPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<MenuCategory | null>(null);

  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [deleteItemTarget, setDeleteItemTarget] = useState<MenuItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  function load() {
    setIsLoading(true);
    Promise.all([fetchMenuCategories(), fetchMenuItems()])
      .then(([fetchedCategories, fetchedItems]) => {
        setCategories(fetchedCategories);
        setItems(fetchedItems);
      })
      .catch((err) => showToast('error', toFriendlyErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [showToast]);

  function categoryName(categoryId: string) {
    return categories.find((category) => category.id === categoryId)?.name ?? 'Uncategorized';
  }

  // ---- Categories ----
  async function handleCategorySubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        isPublished: categoryForm.isPublished,
      };
      if (editingCategory) {
        await updateMenuCategory(editingCategory.id, payload);
        showToast('success', 'Category updated.');
      } else {
        await createMenuCategory(payload);
        showToast('success', 'Category created.');
      }
      setEditingCategory(null);
      setIsCreatingCategory(false);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    try {
      await deleteMenuCategory(deleteCategoryTarget.id);
      showToast('success', 'Category deleted.');
      setDeleteCategoryTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  // ---- Items ----
  async function handleItemSubmit(event: FormEvent) {
    event.preventDefault();
    const priceCents = Math.round(Number(itemForm.priceDollars) * 100);
    if (!itemForm.categoryId) {
      showToast('error', 'Choose a category first.');
      return;
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      showToast('error', 'Enter a valid price.');
      return;
    }
    setIsSaving(true);
    try {
      const fields = {
        categoryId: itemForm.categoryId,
        name: itemForm.name,
        description: itemForm.description || undefined,
        priceCents,
        isAvailable: itemForm.isAvailable,
        isPublished: itemForm.isPublished,
      };
      if (editingItem) {
        await updateMenuItem(editingItem.id, fields, selectedFile);
        showToast('success', 'Menu item updated.');
      } else {
        await createMenuItem(fields, selectedFile);
        showToast('success', 'Menu item created.');
      }
      setEditingItem(null);
      setIsCreatingItem(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!deleteItemTarget) return;
    try {
      await deleteMenuItem(deleteItemTarget.id);
      showToast('success', 'Menu item deleted.');
      setDeleteItemTarget(null);
      load();
    } catch (err) {
      showToast('error', toFriendlyErrorMessage(err));
    }
  }

  const isCategoryModalOpen = isCreatingCategory || Boolean(editingCategory);
  const isItemModalOpen = isCreatingItem || Boolean(editingItem);

  if (isLoading) {
    return (
      <AppLayout title="Menu">
        <Spinner label="Loading menu…" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Menu">
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Categories
          </h2>
          <button
            type="button"
            onClick={() => {
              setCategoryForm(emptyCategoryForm);
              setIsCreatingCategory(true);
            }}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft hover:bg-navy-dark"
          >
            + Add category
          </button>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Create a category before adding menu items."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-xl border border-card-border bg-cream p-4"
              >
                <div className="mb-1 flex items-start justify-between">
                  <p className="text-sm font-semibold text-text-dark">{category.name}</p>
                  {!category.isPublished && (
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-text-muted">
                      Unpublished
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted">{category.description || '—'}</p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryForm({
                        name: category.name,
                        description: category.description ?? '',
                        isPublished: category.isPublished,
                      });
                      setEditingCategory(category);
                    }}
                    className="font-medium text-navy hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCategoryTarget(category)}
                    className="font-medium text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Items</h2>
          <button
            type="button"
            disabled={categories.length === 0}
            onClick={() => {
              setItemForm({ ...emptyItemForm, categoryId: categories[0]?.id ?? '' });
              setSelectedFile(null);
              setIsCreatingItem(true);
            }}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-gold-soft disabled:opacity-50 hover:bg-navy-dark"
          >
            + Add item
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No menu items yet"
            description="Add your first dish above."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-card-border bg-cream">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-card text-xs text-text-muted">
                    No photo
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-text-dark">{item.name}</p>
                  <p className="text-xs text-text-muted">{categoryName(item.categoryId)}</p>
                  <p className="mt-1 text-sm font-semibold text-text-dark">
                    {formatMoney(item.priceCents, item.currency)}
                  </p>
                  <div className="mt-1 flex gap-1">
                    {!item.isAvailable && (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                        Unavailable
                      </span>
                    )}
                    {!item.isPublished && (
                      <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-text-muted">
                        Unpublished
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setItemForm(toItemForm(item));
                        setSelectedFile(null);
                        setEditingItem(item);
                      }}
                      className="font-medium text-navy hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteItemTarget(item)}
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
      </section>

      {isCategoryModalOpen && (
        <Modal
          title={editingCategory ? 'Edit category' : 'Add category'}
          onClose={() => {
            setEditingCategory(null);
            setIsCreatingCategory(false);
          }}
        >
          <form onSubmit={handleCategorySubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Name</label>
              <input
                required
                value={categoryForm.name}
                onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Description</label>
              <textarea
                rows={2}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, description: event.target.value })
                }
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dark">
              <input
                type="checkbox"
                checked={categoryForm.isPublished}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, isPublished: event.target.checked })
                }
              />
              Published
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCreatingCategory(false);
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

      {isItemModalOpen && (
        <Modal
          title={editingItem ? 'Edit menu item' : 'Add menu item'}
          onClose={() => {
            setEditingItem(null);
            setIsCreatingItem(false);
          }}
        >
          <form onSubmit={handleItemSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Category</label>
              <select
                required
                value={itemForm.categoryId}
                onChange={(event) => setItemForm({ ...itemForm, categoryId: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Name</label>
              <input
                required
                value={itemForm.name}
                onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Description</label>
              <textarea
                rows={2}
                value={itemForm.description}
                onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Price (USD)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={itemForm.priceDollars}
                onChange={(event) =>
                  setItemForm({ ...itemForm, priceDollars: event.target.value })
                }
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Photo{editingItem ? ' (leave empty to keep the current one)' : ' (optional)'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-text-dark">
                <input
                  type="checkbox"
                  checked={itemForm.isAvailable}
                  onChange={(event) =>
                    setItemForm({ ...itemForm, isAvailable: event.target.checked })
                  }
                />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-text-dark">
                <input
                  type="checkbox"
                  checked={itemForm.isPublished}
                  onChange={(event) =>
                    setItemForm({ ...itemForm, isPublished: event.target.checked })
                  }
                />
                Published
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsCreatingItem(false);
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

      {deleteCategoryTarget && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleteCategoryTarget.name}"? This fails if it still has active menu items.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeleteCategoryTarget(null)}
        />
      )}

      {deleteItemTarget && (
        <ConfirmDialog
          title="Delete menu item"
          message={`Delete "${deleteItemTarget.name}"? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteItem}
          onCancel={() => setDeleteItemTarget(null)}
        />
      )}
    </AppLayout>
  );
}
