'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Truck, BarChart3, Settings, LogOut, Bell, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAllData } from '@/lib/supabase-sync';
import NotificationBanner from '@/components/NotificationBanner';

const navItems = [
  { href: '/orders', icon: ClipboardList, label: 'Órdenes' },
  { href: '/deliveries', icon: Truck, label: 'Delivery' },
  { href: '/reports', icon: BarChart3, label: 'Reportes' },
  { href: '/settings', icon: Settings, label: 'Config' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, notifications: allNotifs, markNotificationRead, _hydrated } = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const notifications = allNotifs.filter((n) => {
    if (!n.user_id) return true;
    if (user?.role === 'admin') return n.user_id === 'admin' || !n.user_id;
    return n.user_id === user?.id;
  });
  const unreadCount = notifications.filter((n) => !n.read).length;
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!_hydrated) return;
    if (!user) window.location.href = '/';
    else if (user.role === 'delivery') window.location.href = '/my-orders';
  }, [user, _hydrated]);

  if (!_hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-bs-bg">
        <div className="w-8 h-8 border-2 border-bs-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role === 'delivery') return null;

  return (
    <div className="h-full flex flex-col bg-bs-bg">
      <NotificationBanner />
      <header className="sticky top-0 z-40 bg-bs-surface/80 backdrop-blur-xl border-b border-bs-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="BlackStore RD" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <h1 className="text-sm font-bold leading-tight">BlackStore RD</h1>
              <p className="text-[10px] text-bs-text-muted">{user.name} · {user.role === 'admin' ? 'Admin' : 'Empleado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                if (syncing) return;
                setSyncing(true);
                setSyncDone(false);
                try {
                  if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg) {
                      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
                      await reg.update();
                    }
                    await caches.keys().then((k) => Promise.all(k.map((n) => caches.delete(n))));
                  }
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
                  setSyncDone(true);
                  setTimeout(() => setSyncDone(false), 2000);
                } catch (e) {
                  console.error('Sync error:', e);
                } finally {
                  setSyncing(false);
                }
              }}
              className={cn(
                'p-2 rounded-xl transition-colors',
                syncDone ? 'bg-green-500/20' : 'hover:bg-bs-card'
              )}
              title="Actualizar datos y app"
            >
              <RefreshCw size={16} className={cn(
                syncing && 'animate-spin',
                syncDone ? 'text-bs-green' : 'text-bs-text-secondary'
              )} />
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
            notifications.slice(0, 20).map((n) => {
              const isTransferUrgent = n.message.includes('URGENTE') && n.message.includes('transferencia');
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotificationRead(n.id);
                    if (n.order_id) {
                      const url = isTransferUrgent
                        ? `/orders/${n.order_id}?confirm=1`
                        : `/orders/${n.order_id}`;
                      router.push(url);
                      setShowNotifs(false);
                    }
                  }}
                  className={cn(
                    'p-2.5 rounded-xl mb-1 text-xs cursor-pointer transition-colors',
                    n.read ? 'bg-bs-surface text-bs-text-muted' : 'bg-bs-accent/10 text-bs-text border-l-2 border-bs-accent',
                    isTransferUrgent && !n.read && 'border-l-2 border-red-500 bg-red-500/10'
                  )}
                >
                  {n.message}
                  <div className="text-[9px] text-bs-text-muted mt-1">
                    {new Date(n.created_at).toLocaleString('es-DO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bs-surface/90 backdrop-blur-xl border-t border-bs-border safe-bottom">
        <div className="flex max-w-4xl mx-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center py-2 pt-3 gap-0.5 transition-colors relative',
                  isActive ? 'text-bs-accent' : 'text-bs-text-muted hover:text-bs-text-secondary'
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={cn('text-[10px]', isActive && 'font-semibold')}>{item.label}</span>
                {isActive && <div className="absolute top-0 w-8 h-0.5 bg-bs-accent rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
