import { API_BASE_URL } from './config';
import { ApiRequestError, type ApiFieldError } from './reservations';

type SuccessEnvelope<T> = { success: true; message: string; data: T };
type ErrorEnvelope = {
  success: false;
  message: string;
  code?: string;
  errors?: ApiFieldError[];
};

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.', 0);
  }

  let payload: SuccessEnvelope<T> | ErrorEnvelope | undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message ?? 'Something went wrong. Please try again.';
    const code = payload && !payload.success ? payload.code : undefined;
    const fieldErrors = payload && !payload.success ? payload.errors ?? [] : [];
    throw new ApiRequestError(message, response.status, code, fieldErrors);
  }

  return payload.data;
}

export type AboutSection = {
  id: string;
  sectionKey: string;
  title: string;
  content: string;
  imageUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export function getAbout(): Promise<AboutSection[]> {
  return getJson<AboutSection[]>('/about');
}

export type GalleryImage = {
  id: string;
  title: string | null;
  altText: string | null;
  imageUrl: string;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export function getGallery(): Promise<GalleryImage[]> {
  return getJson<GalleryImage[]>('/gallery');
}

export type ContactEntry = {
  id: string;
  label: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  openingHours: Record<string, string> | null;
  isPrimary: boolean;
};

export function getContact(): Promise<ContactEntry[]> {
  return getJson<ContactEntry[]>('/contact');
}
