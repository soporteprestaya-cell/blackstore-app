'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, DollarSign, Settings, LogOut, RefreshCw, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAllData } from '@/lib/supabase-sync';

const navItems = [
  { href: '/my-orders', icon: Package, label: 'Activos' },
  { href: '/earnings', icon: DollarSign, label: 'Ganancias' },
  { href: '/my-settings', icon: Settings, label: 'Mi Cuenta' },
];

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, _hydrated, deliveryOnline, setDeliveryOnline, notifications: allNotifs, markNotificationRead } = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const pathname = usePathname();
  const isOnline = user ? (deliveryOnline[user.id] ?? false) : false;
  const notifications = allNotifs.filter((n) => n.user_id === user?.id);
  const unreadCount = notifications.filter((n) => !n.read).length;

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
              <button
                onClick={() => user && setDeliveryOnline(user.id, !isOnline)}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-bs-green animate-pulse' : 'bg-bs-text-muted'}`} />
                <p className={`text-[10px] font-medium ${isOnline ? 'text-bs-green' : 'text-bs-text-muted'}`}>
                  {user.name} — {isOnline ? 'Activo' : 'Inactivo'}
                </p>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                const data = await fetchAllData();
                if (data) {
                  useAppStore.setState({
                    teamMembers: data.teamMembers.length > 0 ? data.teamMembers : useAppStore.getState().teamMembers,
                    orders: data.orders.length > 0 ? data.orders : useAppStore.getState().orders,
                    commissionPayments: data.commissionPayments,
                    paidOrderIds: data.paidOrderIds,
                    notifications: data.notifications,
                    deliveryOnline: data.deliveryOnline,
                  });
                }
              }}
              className="p-2 hover:bg-bs-card rounded-xl transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={16} className="text-bs-text-secondary" />
            </button>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 hover:bg-bs-card rounded-xl transition-colors relative"
            >
              <Bell size={16} className="text-bs-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-bs-red rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setUser(null); window.location.href = '/'; }}
              className="p-2 hover:bg-bs-card rounded-xl transition-colors"
            >
              <LogOut size={16} className="text-bs-text-secondary" />
            </button>
          </div>
        </div>
      </header>

      {showNotifs && (
        <div className="absolute top-16 right-2 z-50 w-80 max-h-80 overflow-y-auto bg-bs-card border border-bs-border rounded-2xl shadow-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-bs-text-secondary uppercase">Notificaciones</span>
            <button onClick={() => setShowNotifs(false)} className="text-xs text-bs-text-muted">Cerrar</button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-bs-text-muted text-center py-4">Sin notificaciones</p>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  'p-2.5 rounded-xl mb-1 text-xs cursor-pointer transition-colors',
                  n.read ? 'bg-bs-surface text-bs-text-muted' : 'bg-bs-green/10 text-bs-text border-l-2 border-bs-green'
                )}
              >
                {n.message}
                <div className="text-[9px] text-bs-text-muted mt-1">
                  {new Date(n.created_at).toLocaleString('es-DO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

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
