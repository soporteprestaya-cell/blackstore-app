'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { DEMO_ORDERS, DEMO_STATS } from '@/lib/demo-data';
import { OrderCard } from '@/components/order-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  Plus, Search, ClipboardList, Clock, Truck, CheckCircle,
  DollarSign, AlertCircle, Filter,
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
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const stats = DEMO_STATS;
  const orders = DEMO_ORDERS;

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
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pendientes" value={stats.orders_pending} icon={Clock} color="orange" />
        <StatCard label="En ruta" value={stats.orders_in_transit} icon={Truck} color="accent" />
        <StatCard label="Entregadas" value={stats.orders_delivered} icon={CheckCircle} color="green" />
        <StatCard
          label="Ventas hoy"
          value={`RD$ ${(stats.revenue_today / 1000).toFixed(1)}K`}
          icon={DollarSign}
          color="cyan"
          trend={{ value: 12, positive: true }}
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
