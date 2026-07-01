'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRD, timeAgo, ORDER_STATUS_CONFIG } from '@/lib/utils';
import { MapPin, Phone, Package, Clock, Inbox, Hand, Truck, Bus, PackageCheck } from 'lucide-react';
import { sendPushToUser } from '@/lib/push-notifications';
import Link from 'next/link';

export default function MyOrdersPage() {
  const { orders, user, updateOrder, addNotification } = useAppStore();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const myOrders = orders.filter((o) => o.assigned_delivery_id === user?.id);
  const activeOrders = myOrders.filter((o) =>
    ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(o.status)
  );

  const availableOrders = orders.filter(
    (o) => o.status === 'new' && !o.assigned_delivery_id && o.delivery_method === 'personal'
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCompleted = myOrders.filter((o) => ['delivered', 'completed'].includes(o.status) && o.created_at.slice(0, 10) === todayStr);
  const todayCommission = todayCompleted.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

  function acceptOrder(orderId: string) {
    if (!user) return;
    setAcceptingId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.assigned_delivery_id) {
      setAcceptingId(null);
      return;
    }
    const now = new Date().toISOString();
    updateOrder(orderId, {
      assigned_delivery_id: user.id,
      assigned_delivery: user,
      status: 'assigned',
      updated_at: now,
    });
    addNotification({
      id: `n_accept_${Date.now()}`,
      user_id: 'admin',
      type: 'order_assigned',
      message: `${user.name} aceptó la orden de ${order.customer?.name || 'cliente'} — ${order.customer?.sector || ''}`,
      order_id: orderId,
      read: false,
      created_at: now,
    });
    sendPushToUser('1', `${user.name} aceptó la orden de ${order.customer?.name || 'cliente'}`, { url: `/orders/${orderId}` });
    setTimeout(() => setAcceptingId(null), 500);
  }

  const hasContent = activeOrders.length > 0 || availableOrders.length > 0;

  if (!hasContent) {
    return (
      <div className="px-4 py-4">
        <EmptyState
          icon={Inbox}
          title="Sin pedidos"
          description="Cuando haya pedidos disponibles o te asignen uno aparecerá aquí"
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-accent">{activeOrders.length}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Activos</div>
        </div>
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-green">{todayCompleted.length}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Hoy</div>
        </div>
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-orange">{formatRD(todayCommission)}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Comisión</div>
        </div>
      </div>

      {/* Available Orders */}
      {availableOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-bs-green rounded-full animate-pulse" />
            <span className="text-xs font-bold text-bs-green uppercase tracking-wider">
              {availableOrders.length} orden{availableOrders.length > 1 ? 'es' : ''} disponible{availableOrders.length > 1 ? 's' : ''}
            </span>
          </div>
          {availableOrders.map((order) => (
            <Card key={order.id} highlight="accent" className="animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{order.customer?.name || 'Cliente'}</span>
                <Badge variant="blue" size="sm">Disponible</Badge>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-bs-text-secondary">
                  <Package size={13} className="text-bs-text-muted shrink-0" />
                  <span className="line-clamp-1">
                    {order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                  </span>
                </div>
                {order.customer?.sector && (
                  <div className="flex items-center gap-2 text-xs text-bs-text-secondary">
                    <MapPin size={13} className="text-bs-text-muted shrink-0" />
                    <span>{order.customer.sector}{order.customer.address ? ` — ${order.customer.address}` : ''}</span>
                  </div>
                )}
                {order.customer?.phone && (
                  <div className="flex items-center gap-2 text-xs text-bs-text-secondary">
                    <Phone size={13} className="text-bs-text-muted shrink-0" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-bs-green">{formatRD(order.total)}</span>
                  <span className="text-[10px] text-bs-text-muted ml-2">Comisión: {formatRD(order.delivery_fee)}</span>
                </div>
                <span className="text-[10px] text-bs-text-muted flex items-center gap-1">
                  <Clock size={11} />{timeAgo(order.created_at)}
                </span>
              </div>

              <Button
                size="md"
                className="w-full mt-3"
                loading={acceptingId === order.id}
                onClick={() => acceptOrder(order.id)}
              >
                <Hand size={16} />
                Aceptar Pedido
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* My Active Orders */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          {availableOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <Truck size={14} className="text-bs-text-muted" />
              <span className="text-xs font-bold text-bs-text-secondary uppercase tracking-wider">
                Mis pedidos
              </span>
            </div>
          )}
          {activeOrders.map((order) => {
            const statusCfg = ORDER_STATUS_CONFIG[order.status];
            return (
              <Link key={order.id} href={`/my-orders/${order.id}`}>
                <Card
                  highlight={order.priority === 'urgent' ? 'danger' : order.type === 'try_fit' ? 'purple' : 'accent'}
                  className="animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-bold truncate">{order.customer?.name || 'Cliente'}</span>
                      {order.delivery_method === 'bus_route' && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded shrink-0">
                          <Bus size={9} />GUAGUA
                        </span>
                      )}
                      {order.delivery_method === 'shipping_company' && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded shrink-0">
                          <PackageCheck size={9} />ENVIO
                        </span>
                      )}
                    </div>
                    <Badge variant={order.status === 'in_transit' ? 'blue' : 'warning'} size="sm">
                      {statusCfg.label}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-bs-text-secondary">
                      <Package size={13} className="text-bs-text-muted shrink-0" />
                      <span className="line-clamp-1">
                        {order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-bs-text-secondary">
                      <MapPin size={13} className="text-bs-text-muted shrink-0" />
                      <span>{order.customer?.sector || order.customer?.address || 'Sin dirección'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-bs-text-secondary">
                      <Phone size={13} className="text-bs-text-muted shrink-0" />
                      <span>{order.customer?.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-bs-green">{formatRD(order.total)}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-bs-text-muted">
                      <Clock size={11} />
                      {timeAgo(order.created_at)}
                    </div>
                  </div>

                  {order.payment_method !== 'prepaid' && (
                    <div className="mt-2 px-2 py-1.5 bg-orange-500/10 rounded-lg text-[11px] text-bs-orange font-medium">
                      {order.payment_method === 'transfer' ? 'Cobrar transferencia al entregar' : 'Cobrar efectivo al entregar'}
                    </div>
                  )}

                  {order.type === 'try_fit' && (
                    <div className="mt-2 px-2 py-1.5 bg-purple-500/10 rounded-lg text-[11px] text-purple-400 font-medium">
                      Prueba de talla — recoger devolucion despues
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
