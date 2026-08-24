import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-wide text-gold">ORA DE NUIT</p>
          <p className="mt-1 text-sm text-muted-on-dark">Admin Panel</p>
        </div>
        <div className="rounded-2xl border border-gold/20 bg-cream p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
