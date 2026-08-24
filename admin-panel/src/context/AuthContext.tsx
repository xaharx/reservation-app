import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { clearToken, getToken, registerUnauthorizedHandler, setToken } from '../api/client';
import type { AdminUser } from '../types/auth';

type AuthContextValue = {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  // Starts true whenever a token is already stored, so ProtectedRoute
  // doesn't bounce straight to /login before we've had a chance to verify
  // that token against GET /admin/auth/me.
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()));

  const logout = useCallback(() => {
    clearToken();
    setAdminUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    authApi
      .fetchCurrentAdminUser()
      .then(setAdminUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, adminUser: user } = await authApi.login(email, password);
    setToken(token);
    setAdminUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ adminUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
