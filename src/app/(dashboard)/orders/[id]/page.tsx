'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DEMO_ORDERS, DEMO_USERS } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PhotoCapture } from '@/components/ui/photo-capture';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, formatRD, formatDate, cn } from '@/lib/utils';
import {
  ArrowLeft, User, MapPin, Phone, Clock, Truck, CheckCircle, XCircle,
  Camera, DollarSign, Package, Repeat, AlertTriangle, Star, MessageSquare,
  PackageCheck,
} from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams();
  const order = DEMO_ORDERS.find((o) => o.id === id);
  const [showAssign, setShowAssign] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [packagePhoto, setPackagePhoto] = useState<string | undefined>();
  const [returnConfirmed, setReturnConfirmed] = useState<Record<string, boolean>>({});
  const [returnConfirmLoading, setReturnConfirmLoading] = useState<string | null>(null);

  const deliveryUsers = DEMO_USERS.filter((u) => u.role === 'delivery' && u.is_active);

  if (!order) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-bs-text-secondary">Orden no encontrada</p>
        <Link href="/orders"><Button variant="ghost" size="sm" className="mt-4">Volver</Button></Link>
      </div>
    );
  }

  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[order.payment_status];
  const isTryFit = order.type === 'try_fit';

  const tryFitItems = order.items.filter((i) => i.is_try_fit);
  const allReturnsConfirmed = tryFitItems.length > 0 && tryFitItems.every((i) => returnConfirmed[i.id]);

  async function handleConfirmReturn(itemId: string) {
    setReturnConfirmLoading(itemId);
    await new Promise((r) => setTimeout(r, 600));
    setReturnConfirmed((prev) => ({ ...prev, [itemId]: true }));
    setReturnConfirmLoading(null);
  }

  const timeline = [
    { label: 'Orden creada', time: order.created_at, done: true },
    { label: 'Preparada', time: order.status !== 'new' ? order.updated_at : null, done: ['preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'delivered', 'completed'].includes(order.status) },
    { label: 'Delivery asignado', time: order.assigned_delivery_id ? order.updated_at : null, done: !!order.assigned_delivery_id },
    { label: 'Recogido en tienda', done: ['picked_up', 'in_transit', 'delivered', 'completed'].includes(order.status) },
    { label: 'En camino', done: ['in_transit', 'delivered', 'completed'].includes(order.status) },
    { label: 'Entregado', done: ['delivered', 'completed'].includes(order.status) },
    { label: 'Pago confirmado', done: order.payment_status === 'verified' },
    ...(isTryFit ? [
      { label: 'Piezas devueltas al delivery', done: ['delivered', 'completed'].includes(order.status) },
      { label: 'Devolución recibida en tienda', done: allReturnsConfirmed },
    ] : []),
    { label: 'Completada', done: order.status === 'completed' },
  ];

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders">
          <button className="p-2 hover:bg-bs-card rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-bs-text-secondary" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">#{order.order_number}</h1>
            {isTryFit && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded">
                <Repeat size={10} />PRUEBA TALLA
              </span>
            )}
          </div>
          <p className="text-xs text-bs-text-muted">{formatDate(order.created_at)}</p>
        </div>
        <Badge
          variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'danger' : 'blue'}
          size="md"
        >
          {statusCfg.label}
        </Badge>
      </div>

      {/* Priority Alert */}
      {order.priority === 'urgent' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-bs-red">
          <AlertTriangle size={14} />
          <strong>Pedido urgente — priorizar entrega</strong>
        </div>
      )}

      {/* Customer */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Cliente</span>
          {order.customer?.is_blacklisted && (
            <span className="text-[10px] font-bold text-bs-red bg-red-500/15 px-2 py-0.5 rounded">BLACKLIST</span>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-bs-text-muted" />
            <span className="font-medium">{order.customer?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-bs-text-secondary">
            <Phone size={14} className="text-bs-text-muted" />
            <span>{order.customer?.phone}</span>
            <a href={`https://wa.me/1${order.customer?.phone.replace(/\D/g, '')}`} className="ml-auto">
              <Button variant="ghost" size="sm">
                <MessageSquare size={13} />
                WhatsApp
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-bs-text-secondary">
            <MapPin size={14} className="text-bs-text-muted" />
            <span>{order.customer?.address}</span>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
          Productos ({order.items.length})
        </span>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2.5 bg-bs-surface rounded-xl border border-bs-border">
              <div>
                <div className="flex items-center gap-2">
                  <Package size={13} className="text-bs-text-muted" />
                  <span className="text-sm font-medium">{item.product_name}</span>
                  {item.is_try_fit && (
                    <span className="text-[9px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">PRUEBA</span>
                  )}
                </div>
                <div className="text-xs text-bs-text-muted mt-0.5 ml-5">
                  {item.size && `Talla: ${item.size}`}
                  {item.color && ` · Color: ${item.color}`}
                  {` · Cant: ${item.quantity}`}
                </div>
              </div>
              <span className="text-sm font-semibold text-bs-green">
                {formatRD(item.quantity * item.unit_price)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-bs-border space-y-1">
          <div className="flex justify-between text-xs text-bs-text-secondary">
            <span>Subtotal</span><span>{formatRD(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-bs-text-secondary">
            <span>Delivery</span><span>{formatRD(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-1">
            <span>Total</span><span className="text-bs-green">{formatRD(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* Foto de empaque (cadena de custodia) */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
          Foto del empaque
        </span>
        <p className="text-[11px] text-bs-text-muted mt-1 mb-3">
          Fotografía el paquete preparado antes de entregarlo al delivery.
        </p>
        <PhotoCapture
          label="Foto del paquete listo"
          required
          value={packagePhoto}
          onChange={setPackagePhoto}
        />
      </Card>

      {/* Payment Status */}
      <Card highlight={order.payment_status === 'verified' ? 'success' : 'warning'}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Estado de pago
          </span>
          <Badge variant={order.payment_status === 'verified' ? 'success' : 'warning'} size="md">
            {paymentCfg.label}
          </Badge>
        </div>
        <div className="text-xs text-bs-text-secondary mb-3">
          Método: <strong className="text-bs-text">{order.payment_method === 'cash' ? 'Efectivo' : order.payment_method === 'transfer' ? 'Transferencia' : 'Prepago'}</strong>
        </div>

        {order.payment_status !== 'verified' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              {order.payment_status === 'pending' ? (
                <XCircle size={14} className="text-bs-text-muted" />
              ) : (
                <CheckCircle size={14} className="text-bs-green" />
              )}
              <span className={order.payment_status !== 'pending' ? 'text-bs-green' : 'text-bs-text-muted'}>
                Confirmación del delivery
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <XCircle size={14} className="text-bs-text-muted" />
              <span className="text-bs-text-muted">
                Confirmación de la tienda
              </span>
            </div>
            <Button variant="success" size="sm" className="w-full mt-2" onClick={() => setShowPayment(true)}>
              <DollarSign size={14} />
              Confirmar pago desde tienda
            </Button>
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/* TRY-FIT RETURN CONFIRMATION — store confirms returned pieces  */}
      {/* ============================================================ */}
      {isTryFit && (order.status === 'delivered' || order.status === 'completed') && (
        <Card highlight={allReturnsConfirmed ? 'success' : 'purple'}>
          <div className="flex items-center gap-2 mb-2">
            <PackageCheck size={16} className={allReturnsConfirmed ? 'text-bs-green' : 'text-purple-400'} />
            <span className={cn('text-sm font-bold', allReturnsConfirmed ? 'text-bs-green' : 'text-purple-400')}>
              {allReturnsConfirmed ? 'Devoluciones Confirmadas' : 'Confirmar Devoluciones'}
            </span>
          </div>
          <p className="text-[11px] text-bs-text-secondary mb-3">
            {allReturnsConfirmed
              ? 'Todas las piezas devueltas fueron recibidas y verificadas.'
              : 'Confirma la recepción de cada pieza devuelta por el delivery. Verifica que estén en buen estado.'
            }
          </p>
          <div className="space-y-2">
            {tryFitItems.map((item) => (
              <div key={item.id} className={cn(
                'flex items-center justify-between p-3 rounded-xl border transition-all',
                returnConfirmed[item.id]
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-bs-surface border-bs-border'
              )}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Package size={13} className={returnConfirmed[item.id] ? 'text-bs-green' : 'text-purple-400'} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.product_name}</div>
                    <div className="text-[11px] text-bs-text-muted">
                      {item.size && `Talla: ${item.size}`}{item.color && ` · ${item.color}`}
                    </div>
                  </div>
                </div>
                {returnConfirmed[item.id] ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle size={10} className="mr-1" />
                    Recibida
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={returnConfirmLoading === item.id}
                    onClick={() => handleConfirmReturn(item.id)}
                  >
                    <CheckCircle size={12} />
                    Recibir
                  </Button>
                )}
              </div>
            ))}
          </div>
          {allReturnsConfirmed && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl">
              <CheckCircle size={14} className="text-bs-green" />
              <span className="text-xs text-bs-green font-medium">
                Todas las piezas de prueba recibidas en tienda
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Delivery Assignment */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Delivery asignado
          </span>
        </div>
        {order.assigned_delivery ? (
          <div className="flex items-center justify-between p-3 bg-bs-surface rounded-xl border border-bs-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-bs-green/15 rounded-full flex items-center justify-center">
                <Truck size={18} className="text-bs-green" />
              </div>
              <div>
                <div className="text-sm font-semibold">{order.assigned_delivery.name}</div>
                <div className="text-xs text-bs-text-muted">{order.assigned_delivery.phone}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAssign(true)}>
              Cambiar
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="md" className="w-full" onClick={() => setShowAssign(true)}>
            <Truck size={16} />
            Asignar Delivery
          </Button>
        )}
      </Card>

      {/* Timeline */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3 block">
          Historial de la orden
        </span>
        <div className="space-y-0">
          {timeline.map((step, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              {i < timeline.length - 1 && (
                <div className={cn('absolute left-[9px] top-5 w-0.5 h-full', step.done ? 'bg-bs-green/30' : 'bg-bs-border')} />
              )}
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                step.done ? 'bg-bs-green/20' : 'bg-bs-border/50'
              )}>
                {step.done ? (
                  <CheckCircle size={12} className="text-bs-green" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-bs-text-muted" />
                )}
              </div>
              <div className="pb-4">
                <div className={cn('text-xs font-medium', step.done ? 'text-bs-text' : 'text-bs-text-muted')}>
                  {step.label}
                </div>
                {step.time && step.done && (
                  <div className="text-[10px] text-bs-text-muted">{formatDate(step.time)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card>
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Notas</span>
          <p className="text-sm text-bs-text-secondary mt-2 italic">"{order.notes}"</p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {order.status === 'new' && (
          <Button variant="warning" size="md" className="flex-1">Marcar como Preparando</Button>
        )}
        {order.status === 'preparing' && (
          <Button variant="success" size="md" className="flex-1">Lista para Recoger</Button>
        )}
        {order.status !== 'cancelled' && order.status !== 'completed' && (
          <Button variant="danger" size="md" className="flex-1">Cancelar Orden</Button>
        )}
      </div>

      {/* Assign Modal */}
      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Asignar Delivery">
        <div className="space-y-2">
          {deliveryUsers.map((d) => (
            <button
              key={d.id}
              onClick={() => setShowAssign(false)}
              className="w-full flex items-center gap-3 p-3 bg-bs-card border border-bs-border rounded-xl hover:border-bs-accent transition-all text-left"
            >
              <div className="w-10 h-10 bg-bs-green/15 rounded-full flex items-center justify-center">
                <Truck size={18} className="text-bs-green" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{d.name}</div>
                <div className="text-xs text-bs-text-muted">{d.phone}</div>
              </div>
              <div className="text-[10px] text-bs-green font-semibold">Disponible</div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Confirmar Pago">
        <div className="space-y-4">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-bs-orange">
            <strong>Doble confirmación:</strong> Esta es la confirmación desde la tienda. El delivery también debe confirmar por su lado.
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-bs-text-secondary">Monto a confirmar</span>
            <span className="font-bold text-bs-green">{formatRD(order.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-bs-text-secondary">Método</span>
            <span className="font-medium">{order.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}</span>
          </div>
          {order.payment_method === 'transfer' && (
            <div>
              <label className="text-xs text-bs-text-secondary font-semibold uppercase tracking-wider block mb-2">
                Verificar comprobante en banco
              </label>
              <p className="text-[11px] text-bs-text-muted mb-2">
                Confirma que el monto aparece en la cuenta bancaria de la tienda.
              </p>
            </div>
          )}
          {order.payment_method === 'cash' && (
            <div>
              <label className="text-xs text-bs-text-secondary font-semibold uppercase tracking-wider block mb-2">
                Confirmar efectivo recibido
              </label>
              <p className="text-[11px] text-bs-text-muted mb-2">
                Confirma que el delivery entregó el efectivo completo.
              </p>
              <input type="number" placeholder="Monto recibido" className="w-full" />
            </div>
          )}
          <Button variant="success" size="lg" className="w-full" onClick={() => setShowPayment(false)}>
            <CheckCircle size={16} />
            Confirmar Pago Verificado
          </Button>
        </div>
      </Modal>
    </div>
  );
}
