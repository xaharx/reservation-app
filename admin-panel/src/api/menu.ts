import { apiClient } from './client';
import type { SuccessEnvelope } from '../types/api';
import type { MenuCategory, MenuItem } from '../types/menu';

function unwrap<T>(promise: Promise<{ data: SuccessEnvelope<T> }>): Promise<T> {
  return promise.then((response) => response.data.data);
}

// ---- Categories ----
export const fetchMenuCategories = () =>
  unwrap<MenuCategory[]>(apiClient.get('/admin/menu/categories'));
export const createMenuCategory = (data: {
  name: string;
  description?: string;
  sortOrder?: number;
  isPublished?: boolean;
}) => unwrap<MenuCategory>(apiClient.post('/admin/menu/categories', data));
export const updateMenuCategory = (id: string, data: Partial<MenuCategory>) =>
  unwrap<MenuCategory>(apiClient.patch(`/admin/menu/categories/${id}`, data));
export const deleteMenuCategory = (id: string) =>
  apiClient.delete(`/admin/menu/categories/${id}`);

// ---- Items ----
export const fetchMenuItems = () => unwrap<MenuItem[]>(apiClient.get('/admin/menu/items'));

type MenuItemFormFields = {
  categoryId: string;
  name: string;
  description?: string;
  priceCents: number;
  currency?: string;
  isAvailable?: boolean;
  sortOrder?: number;
  isPublished?: boolean;
};

function toFormData(fields: MenuItemFormFields, file?: File | null) {
  const formData = new FormData();
  formData.append('categoryId', fields.categoryId);
  formData.append('name', fields.name);
  if (fields.description) formData.append('description', fields.description);
  formData.append('priceCents', String(fields.priceCents));
  if (fields.currency) formData.append('currency', fields.currency);
  if (fields.isAvailable !== undefined) formData.append('isAvailable', String(fields.isAvailable));
  if (fields.sortOrder !== undefined) formData.append('sortOrder', String(fields.sortOrder));
  if (fields.isPublished !== undefined) formData.append('isPublished', String(fields.isPublished));
  if (file) formData.append('image', file);
  return formData;
}

export function createMenuItem(fields: MenuItemFormFields, file?: File | null) {
  return unwrap<MenuItem>(
    apiClient.post('/admin/menu/items', toFormData(fields, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}

export function updateMenuItem(id: string, fields: MenuItemFormFields, file?: File | null) {
  return unwrap<MenuItem>(
    apiClient.patch(`/admin/menu/items/${id}`, toFormData(fields, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}

export const deleteMenuItem = (id: string) => apiClient.delete(`/admin/menu/items/${id}`);
