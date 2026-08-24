import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../api/client';
import { Spinner } from '../components/Spinner';

export function ProtectedRoute() {
  const { adminUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  if (!adminUser && !getToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
