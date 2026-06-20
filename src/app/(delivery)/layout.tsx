'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, History, DollarSign, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/my-orders', icon: Package, label: 'Activos' },
  { href: '/history', icon: History, label: 'Historial' },
  { href: '/earnings', icon: DollarSign, label: 'Ganancias' },
];

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, _hydrated } = useAppStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!_hydrated) return;
    if (!user) window.location.href = '/';
    else if (user.role !== 'delivery') window.location.href = '/orders';
  }, [user, _hydrated]);

  if (!_hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-bs-bg">
        <div className="w-8 h-8 border-2 border-bs-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'delivery') return null;

  return (
    <div className="h-full flex flex-col bg-bs-bg">
      <header className="sticky top-0 z-40 bg-bs-surface/80 backdrop-blur-xl border-b border-bs-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="BlackStore RD" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <h1 className="text-sm font-bold leading-tight">BlackStore Delivery</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-bs-green animate-pulse" />
                <p className="text-[10px] text-bs-green font-medium">{user.name} — Activo</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setUser(null); window.location.href = '/'; }}
            className="p-2 hover:bg-bs-card rounded-xl transition-colors"
          >
            <LogOut size={16} className="text-bs-text-secondary" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bs-surface/90 backdrop-blur-xl border-t border-bs-border">
        <div className="flex max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center py-2 pt-3 gap-0.5 transition-colors',
                  isActive ? 'text-bs-green' : 'text-bs-text-muted hover:text-bs-text-secondary'
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={cn('text-[10px]', isActive && 'font-semibold')}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
