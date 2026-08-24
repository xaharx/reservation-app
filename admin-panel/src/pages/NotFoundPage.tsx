import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-center text-cream">
      <p className="text-3xl font-semibold text-gold">404</p>
      <p className="text-muted-on-dark">That page doesn't exist.</p>
      <Link to="/dashboard" className="mt-2 text-sm font-medium text-gold underline">
        Back to dashboard
      </Link>
    </div>
  );
}
