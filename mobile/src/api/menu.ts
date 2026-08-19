import { API_BASE_URL } from './config';
import { ApiRequestError } from './reservations';

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

  let payload: { success: true; data: T } | { success: false; message: string } | undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload && !payload.success ? payload.message : 'Something went wrong. Please try again.';
    throw new ApiRequestError(message, response.status);
  }

  return payload.data;
}

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
};

export function getMenu(): Promise<MenuCategory[]> {
  return getJson<MenuCategory[]>('/menu');
}
