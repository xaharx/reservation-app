export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EDITOR';

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  lastLoginAt: string | null;
};
