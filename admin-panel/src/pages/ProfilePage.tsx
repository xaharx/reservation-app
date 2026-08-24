import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-card-border/60 py-3 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text-dark">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { adminUser } = useAuth();

  if (!adminUser) {
    return null;
  }

  return (
    <AppLayout title="Profile">
      <div className="max-w-md rounded-xl border border-card-border bg-cream p-6">
        <Row label="Name" value={`${adminUser.firstName} ${adminUser.lastName}`} />
        <Row label="Email" value={adminUser.email} />
        <Row label="Role" value={adminUser.role.replace('_', ' ')} />
        <Row
          label="Last login"
          value={adminUser.lastLoginAt ? new Date(adminUser.lastLoginAt).toLocaleString() : 'This is your first login'}
        />
      </div>
    </AppLayout>
  );
}
