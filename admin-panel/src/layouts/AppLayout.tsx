import type { ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f5f1ea]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
