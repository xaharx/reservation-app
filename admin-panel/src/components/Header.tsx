import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header({ title }: { title: string }) {
  const { adminUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex items-center justify-between border-b border-card-border bg-cream px-6 py-4">
      <h1 className="text-xl font-semibold text-text-dark">{title}</h1>
      <div className="flex items-center gap-4">
        {adminUser && (
          <div className="text-right">
            <p className="text-sm font-medium text-text-dark">
              {adminUser.firstName} {adminUser.lastName}
            </p>
            <p className="text-xs text-text-muted">{adminUser.role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-medium text-text-dark hover:bg-card"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
