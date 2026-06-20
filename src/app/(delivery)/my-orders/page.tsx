'use client';

import { useState } from 'react';
import { DEMO_ORDERS } from '@/lib/demo-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRD, timeAgo, ORDER_STATUS_CONFIG } from '@/lib/utils';
import { MapPin, Phone, Package, Clock, Navigation, CheckCircle, Inbox } from 'lucide-react';
import Link from 'next/link';

export default function MyOrdersPage() {
  const activeOrders = DEMO_ORDERS.filter((o) =>
    ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(o.status) && o.assigned_delivery_id
  );

  if (activeOrders.length === 0) {
    return (
      <div className="px-4 py-4">
        <EmptyState
          icon={Inbox}
          title="Sin pedidos activos"
          description="Cuando te asignen un pedido aparecerá aquí"
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
          <div className="text-xl font-bold text-bs-green">7</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Hoy</div>
        </div>
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-orange">{formatRD(1050)}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Comisión</div>
        </div>
      </div>

      {/* Active Orders */}
      <div className="space-y-3">
        {activeOrders.map((order) => {
          const statusCfg = ORDER_STATUS_CONFIG[order.status];
          return (
            <Link key={order.id} href={`/my-orders/${order.id}`}>
              <Card
                highlight={order.priority === 'urgent' ? 'danger' : order.type === 'try_fit' ? 'purple' : 'accent'}
                className="animate-fade-in"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">#{order.order_number}</span>
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
                    <span>{order.customer?.address}</span>
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
                    💳 {order.payment_method === 'transfer' ? 'Cobrar transferencia al entregar' : 'Cobrar efectivo al entregar'}
                  </div>
                )}

                {order.type === 'try_fit' && (
                  <div className="mt-2 px-2 py-1.5 bg-purple-500/10 rounded-lg text-[11px] text-purple-400 font-medium">
                    👔 Prueba de talla — recoger devolución después
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
