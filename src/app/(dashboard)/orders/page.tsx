'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { OrderCard } from '@/components/order-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatRD } from '@/lib/utils';
import {
  Plus, Search, ClipboardList, Clock, Truck, CheckCircle,
  DollarSign, AlertCircle, Filter, Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { OrderStatus } from '@/lib/types';

const FILTER_TABS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Todas', statuses: [] },
  { label: 'Nuevas', statuses: ['new'] },
  { label: 'Preparando', statuses: ['preparing', 'ready'] },
  { label: 'En ruta', statuses: ['assigned', 'picked_up', 'in_transit'] },
  { label: 'Entregadas', statuses: ['delivered'] },
  { label: 'Completas', statuses: ['completed'] },
];

export default function OrdersPage() {
  const { orders, user, updateOrder, addNotification } = useAppStore();
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  const pendingTransfers = useMemo(() =>
    orders.filter((o) =>
      o.payment_method === 'transfer' &&
      o.payment_status !== 'verified' &&
      o.status === 'delivered'
    ),
  [orders]);

  function quickConfirmTransfer(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setConfirmingId(orderId);
    const now = new Date().toISOString();
    const isTryFit = order.type === 'try_fit';
    const returnedItems = order.items.filter((i) => i.is_try_fit && (i.kept === false || i.kept === 'received'));
    const allReturnsReceived = returnedItems.length > 0 && returnedItems.every((i) => (i as any).kept === 'received');
    const canComplete = isTryFit ? (returnedItems.length === 0 || allReturnsReceived) : true;
    const newStatus = canComplete && order.status === 'delivered' ? 'completed' : order.status;

    updateOrder(order.id, { payment_status: 'verified', status: newStatus, updated_at: now });

    if (order.assigned_delivery_id) {
      addNotification({
        id: `n_pay_del_${Date.now()}`,
        user_id: order.assigned_delivery_id,
        type: 'payment_confirmed',
        message: `Pago confirmado por ${user?.name || 'Admin'} — ${order.customer?.name || ''} (${order.customer?.phone || ''}) ${formatRD(order.total)}`,
        order_id: order.id,
        read: false,
        created_at: now,
      });
    }
    addNotification({
      id: `n_pay_emp_${Date.now()}`,
      user_id: '2',
      type: 'payment_confirmed',
      message: `Pago verificado — ${order.customer?.name || ''} (${order.customer?.phone || ''}) ${formatRD(order.total)}`,
      order_id: order.id,
      read: false,
      created_at: now,
    });
    setTimeout(() => setConfirmingId(null), 600);
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.created_at.slice(0, 10) === today);
    return {
      orders_pending: orders.filter((o) => ['new', 'preparing', 'ready'].includes(o.status)).length,
      orders_in_transit: orders.filter((o) => ['assigned', 'picked_up', 'in_transit'].includes(o.status)).length,
      orders_delivered: orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length,
      revenue_today: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      payments_pending: orders.filter((o) => o.payment_status === 'pending' && o.status !== 'cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    const tab = FILTER_TABS[activeFilter];
    if (tab.statuses.length > 0) {
      result = result.filter((o) => tab.statuses.includes(o.status));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer?.name.toLowerCase().includes(q) ||
          o.items.some((i) => i.product_name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [orders, activeFilter, searchQuery]);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Pending Transfers — CEO Quick Confirm */}
      {isAdmin && pendingTransfers.length > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
              <Zap size={14} className="text-red-400" />
            </div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              {pendingTransfers.length} transferencia{pendingTransfers.length > 1 ? 's' : ''} por verificar
            </span>
          </div>
          {pendingTransfers.map((order) => (
            <div key={order.id} className="flex items-center gap-2 bg-bs-surface/60 rounded-xl p-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{order.customer?.name}</span>
                  <span className="text-[10px] text-bs-text-muted truncate">{order.customer?.phone}</span>
                </div>
                <div className="text-sm font-bold text-bs-green">{formatRD(order.total)}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Link href={`/orders/${order.id}?confirm=1`}>
                  <button className="p-1.5 hover:bg-bs-card rounded-lg transition-colors text-bs-text-muted">
                    <Search size={13} />
                  </button>
                </Link>
                <button
                  onClick={() => quickConfirmTransfer(order.id)}
                  disabled={confirmingId === order.id}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                    confirmingId === order.id
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-green-500 text-white active:scale-95'
                  )}
                >
                  {confirmingId === order.id ? 'Listo' : 'Confirmar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pendientes" value={stats.orders_pending} icon={Clock} color="orange" />
        <StatCard label="En ruta" value={stats.orders_in_transit} icon={Truck} color="accent" />
        <StatCard label="Entregadas" value={stats.orders_delivered} icon={CheckCircle} color="green" />
        <StatCard
          label="Ventas hoy"
          value={stats.revenue_today >= 1000 ? `RD$ ${(stats.revenue_today / 1000).toFixed(1)}K` : `RD$ ${stats.revenue_today}`}
          icon={DollarSign}
          color="cyan"
        />
      </div>

      {/* Alerts */}
      {stats.payments_pending > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-bs-orange">
          <AlertCircle size={14} />
          <span>
            <strong>{stats.payments_pending}</strong> pagos pendientes de confirmación
          </span>
        </div>
      )}

      {/* Search + New Order */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bs-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar orden, cliente o producto..."
            className="w-full pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
        <Link href="/orders/new">
          <Button size="md" className="shrink-0">
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva Orden</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveFilter(i)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all',
              activeFilter === i
                ? 'bg-bs-accent text-white shadow-lg shadow-bs-accent/20'
                : 'bg-bs-card text-bs-text-secondary hover:text-bs-text border border-bs-border'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No hay órdenes"
            description="Las órdenes aparecerán aquí cuando se creen"
            action={
              <Link href="/orders/new">
                <Button size="sm">
                  <Plus size={14} />
                  Crear orden
                </Button>
              </Link>
            }
          />
        ) : (
          filteredOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <OrderCard order={order} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
