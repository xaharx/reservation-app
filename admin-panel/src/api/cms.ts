import { apiClient } from './client';
import type { SuccessEnvelope } from '../types/api';
import type {
  AboutSection,
  AppSetting,
  Banner,
  Contact,
  GalleryImage,
  SocialMediaLink,
} from '../types/cms';

function unwrap<T>(promise: Promise<{ data: SuccessEnvelope<T> }>): Promise<T> {
  return promise.then((response) => response.data.data);
}

// ---- Banners ----
export const fetchBanners = () => unwrap<Banner[]>(apiClient.get('/admin/banners'));
export const createBanner = (data: Partial<Banner>) =>
  unwrap<Banner>(apiClient.post('/admin/banners', data));
export const updateBanner = (id: string, data: Partial<Banner>) =>
  unwrap<Banner>(apiClient.patch(`/admin/banners/${id}`, data));
export const deleteBanner = (id: string) => apiClient.delete(`/admin/banners/${id}`);

// ---- About ----
export const fetchAboutSections = () => unwrap<AboutSection[]>(apiClient.get('/admin/about'));
export const createAboutSection = (data: Partial<AboutSection>) =>
  unwrap<AboutSection>(apiClient.post('/admin/about', data));
export const updateAboutSection = (id: string, data: Partial<AboutSection>) =>
  unwrap<AboutSection>(apiClient.patch(`/admin/about/${id}`, data));
export const deleteAboutSection = (id: string) => apiClient.delete(`/admin/about/${id}`);

// ---- Gallery ----
export const fetchGalleryImages = () => unwrap<GalleryImage[]>(apiClient.get('/admin/gallery'));

export function uploadGalleryImage(
  file: File,
  metadata: { title?: string; altText?: string; category?: string; isPublished?: boolean },
) {
  const formData = new FormData();
  formData.append('image', file);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.altText) formData.append('altText', metadata.altText);
  if (metadata.category) formData.append('category', metadata.category);
  if (metadata.isPublished !== undefined) {
    formData.append('isPublished', String(metadata.isPublished));
  }
  return unwrap<GalleryImage>(
    apiClient.post('/admin/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}

export const updateGalleryImage = (id: string, data: Partial<GalleryImage>) =>
  unwrap<GalleryImage>(apiClient.patch(`/admin/gallery/${id}`, data));
export const deleteGalleryImage = (id: string) => apiClient.delete(`/admin/gallery/${id}`);

// ---- Contact ----
export const fetchContacts = () => unwrap<Contact[]>(apiClient.get('/admin/contact'));
export const createContact = (data: Partial<Contact>) =>
  unwrap<Contact>(apiClient.post('/admin/contact', data));
export const updateContact = (id: string, data: Partial<Contact>) =>
  unwrap<Contact>(apiClient.patch(`/admin/contact/${id}`, data));
export const deleteContact = (id: string) => apiClient.delete(`/admin/contact/${id}`);

// ---- Social media ----
export const fetchSocialMediaLinks = () =>
  unwrap<SocialMediaLink[]>(apiClient.get('/admin/social-media'));
export const createSocialMediaLink = (data: Partial<SocialMediaLink>) =>
  unwrap<SocialMediaLink>(apiClient.post('/admin/social-media', data));
export const updateSocialMediaLink = (id: string, data: Partial<SocialMediaLink>) =>
  unwrap<SocialMediaLink>(apiClient.patch(`/admin/social-media/${id}`, data));
export const deleteSocialMediaLink = (id: string) => apiClient.delete(`/admin/social-media/${id}`);

// ---- Settings ----
export const fetchSettings = () => unwrap<AppSetting[]>(apiClient.get('/admin/settings'));
export const saveSetting = (
  key: string,
  data: { value: unknown; description?: string; isPublic?: boolean },
) => unwrap<AppSetting>(apiClient.put(`/admin/settings/${encodeURIComponent(key)}`, data));
export const deleteSetting = (key: string) =>
  apiClient.delete(`/admin/settings/${encodeURIComponent(key)}`);
