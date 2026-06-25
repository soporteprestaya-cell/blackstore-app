'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Order } from '@/lib/types';
import { formatRD, timeAgo, ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/utils';
import { Clock, MapPin, User, Truck, AlertTriangle, Repeat, Bus, PackageCheck } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'blue' | 'cyan'> = {
  new: 'blue',
  preparing: 'warning',
  ready: 'warning',
  assigned: 'cyan',
  picked_up: 'cyan',
  in_transit: 'blue',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[order.payment_status];
  const isOverdue = Date.now() - new Date(order.updated_at).getTime() > 45 * 60000 &&
    !['completed', 'cancelled', 'delivered'].includes(order.status);

  return (
    <Card
      onClick={onClick}
      highlight={
        order.priority === 'urgent' ? 'danger' :
        order.type === 'try_fit' ? 'purple' :
        isOverdue ? 'warning' : 'none'
      }
      className="animate-fade-in"
    >
      {/* Top row: customer name + status */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-bs-text truncate">{order.customer?.name || 'Cliente'}</span>
          {order.priority === 'urgent' && (
            <span className="text-[9px] font-bold text-bs-red bg-red-500/15 px-1.5 py-0.5 rounded shrink-0">URGENTE</span>
          )}
          {order.type === 'try_fit' && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded shrink-0">
              <Repeat size={9} />PRUEBA
            </span>
          )}
          {order.delivery_method === 'bus_route' && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded shrink-0">
              <Bus size={9} />GUAGUA
            </span>
          )}
          {order.delivery_method === 'shipping_company' && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded shrink-0">
              <PackageCheck size={9} />{order.shipping_company?.company || 'ENVÍO'}
            </span>
          )}
        </div>
        <Badge variant={statusBadgeVariant[order.status] || 'default'} size="sm">
          {statusCfg.label}
        </Badge>
      </div>

      {/* Phone + sector */}
      <div className="flex items-center gap-1.5 text-xs text-bs-text-muted mb-1">
        <span>{order.customer?.phone}</span>
        {order.customer?.sector && (
          <>
            <span>·</span>
            <MapPin size={11} />
            <span>{order.customer.sector}</span>
          </>
        )}
      </div>

      {/* Items */}
      <div className="text-xs text-bs-text-secondary mb-3 line-clamp-2">
        {order.items.map((item, i) => (
          <span key={item.id}>
            {i > 0 && ' · '}
            {item.quantity}x {item.product_name}
            {item.size && ` (${item.size})`}
            {item.color && ` ${item.color}`}
          </span>
        ))}
      </div>

      {/* Bottom row: price + delivery + time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-bs-green">{formatRD(order.total)}</span>
          <Badge
            variant={order.payment_status === 'verified' ? 'success' : order.payment_status === 'pending' ? 'warning' : 'cyan'}
            size="sm"
          >
            {paymentCfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {order.assigned_delivery && (
            <span className="flex items-center gap-1 text-[10px] text-bs-text-muted">
              <Truck size={11} />
              {order.assigned_delivery.name.split(' ')[0]}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-bs-text-muted">
            <Clock size={11} />
            {timeAgo(order.created_at)}
          </span>
          {isOverdue && <AlertTriangle size={13} className="text-bs-orange" />}
        </div>
      </div>
    </Card>
  );
}
