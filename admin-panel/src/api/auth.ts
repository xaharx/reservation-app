import { apiClient } from './client';
import type { SuccessEnvelope } from '../types/api';
import type { AdminUser } from '../types/auth';

export async function login(email: string, password: string) {
  const response = await apiClient.post<SuccessEnvelope<{ token: string; adminUser: AdminUser }>>(
    '/admin/auth/login',
    { email, password },
  );
  return response.data.data;
}

export async function fetchCurrentAdminUser() {
  const response = await apiClient.get<SuccessEnvelope<AdminUser>>('/admin/auth/me');
  return response.data.data;
}

export async function logout() {
  await apiClient.post('/admin/auth/logout');
}
