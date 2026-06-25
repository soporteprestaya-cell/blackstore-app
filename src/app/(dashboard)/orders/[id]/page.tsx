'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEMO_USERS } from '@/lib/demo-data';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, formatRD, formatDate, cn } from '@/lib/utils';
import {
  ArrowLeft, User, MapPin, Phone, Clock, Truck, CheckCircle, XCircle,
  DollarSign, Package, Repeat, AlertTriangle, Star, MessageSquare,
  PackageCheck, Bus, Printer,
} from 'lucide-react';
import { printLabel } from '@/components/print-label';

export default function OrderDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { orders, teamMembers, user, addNotification } = useAppStore();
  const order = orders.find((o) => o.id === id);
  const { updateOrder } = useAppStore();
  const [showAssign, setShowAssign] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [returnConfirmLoading, setReturnConfirmLoading] = useState<string | null>(null);

  // Auto-open payment modal when arriving from push notification with ?confirm=1
  useEffect(() => {
    if (searchParams.get('confirm') === '1' && order && user?.role === 'admin' &&
        order.payment_status !== 'verified' && order.status === 'delivered') {
      setShowPayment(true);
    }
  }, [searchParams, order?.id]);

  const allUsers = [...DEMO_USERS, ...teamMembers.filter((m) => !DEMO_USERS.some((d) => d.id === m.id))];
  const deliveryUsers = allUsers.filter((u) => u.role === 'delivery' && u.is_active);
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

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
  const returnedItems = tryFitItems.filter((i) => i.kept === false || i.kept === 'received' as any);
  const allReturnsReceived = returnedItems.length > 0 && returnedItems.every((i) => (i as any).kept === 'received');
  const deliverySelectedPieces = tryFitItems.some((i) => i.kept !== null);

  async function handleConfirmReturn(itemId: string) {
    if (!order) return;
    setReturnConfirmLoading(itemId);
    const updatedItems = order.items.map((i) =>
      i.id === itemId ? { ...i, kept: 'received' as const } : i
    );
    updateOrder(order.id, { items: updatedItems, updated_at: new Date().toISOString() });

    const item = order.items.find((i) => i.id === itemId);
    if (item) {
      addNotification({
        id: `n_ret_${Date.now()}`,
        user_id: '1',
        type: 'delivery_completed',
        message: `${user?.name || 'Empleado'} recibió pieza: ${item.product_name} (${item.size || 'N/A'}) — ${order.customer?.name || 'Cliente'}`,
        order_id: order.id,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    const allReceived = updatedItems
      .filter((i) => i.is_try_fit && (i.kept === false || i.kept === 'received'))
      .every((i) => i.kept === 'received');
    if (allReceived && order.payment_status === 'verified') {
      updateOrder(order.id, { status: 'completed', items: updatedItems, updated_at: new Date().toISOString() });
    }
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
      { label: 'Devolución recibida en tienda', done: allReturnsReceived },
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
            <h1 className="text-lg font-bold">{order.customer?.name || 'Cliente'}</h1>
            {isTryFit && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded">
                <Repeat size={10} />PRUEBA TALLA
              </span>
            )}
          </div>
          <p className="text-xs text-bs-text-muted">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {order.status !== 'cancelled' && (
            <button
              onClick={() => printLabel(order)}
              className="p-2 hover:bg-bs-card rounded-xl transition-colors"
              title="Imprimir etiqueta"
            >
              <Printer size={18} className="text-bs-text-secondary" />
            </button>
          )}
          <Badge
            variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'danger' : 'blue'}
            size="md"
          >
            {statusCfg.label}
          </Badge>
        </div>
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

      {/* Bus Route Info */}
      {order.delivery_method === 'bus_route' && order.bus_route && (
        <Card highlight="cyan">
          <div className="flex items-center gap-2 mb-2">
            <Bus size={16} className="text-bs-cyan" />
            <span className="text-xs font-semibold text-bs-cyan uppercase tracking-wider">
              Envío por ruta de guagua
            </span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-bs-text-muted">Línea:</span>
              <span className="font-semibold">{order.bus_route.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bs-text-muted">Destino:</span>
              <span className="font-semibold">{order.bus_route.terminal}</span>
            </div>
            {order.bus_route.route && (
              <div className="flex justify-between">
                <span className="text-bs-text-muted">Ruta:</span>
                <span className="font-semibold">{order.bus_route.route}</span>
              </div>
            )}
            {order.bus_route.notes && (
              <div className="mt-2 text-xs text-bs-text-secondary italic bg-bs-surface p-2 rounded-lg">
                {order.bus_route.notes}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Shipping Company Info */}
      {order.delivery_method === 'shipping_company' && order.shipping_company && (
        <Card highlight="warning">
          <div className="flex items-center gap-2 mb-2">
            <PackageCheck size={16} className="text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              Compañía de envío
            </span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-bs-text-muted">Compañía:</span>
              <span className="font-semibold">{order.shipping_company.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bs-text-muted">Destino:</span>
              <span className="font-semibold">{order.shipping_company.destination}</span>
            </div>
            {order.shipping_company.tracking_number && (
              <div className="flex justify-between">
                <span className="text-bs-text-muted">Tracking:</span>
                <span className="font-semibold">{order.shipping_company.tracking_number}</span>
              </div>
            )}
            {order.shipping_company.notes && (
              <div className="mt-2 text-xs text-bs-text-secondary italic bg-bs-surface p-2 rounded-lg">
                {order.shipping_company.notes}
              </div>
            )}
          </div>
        </Card>
      )}

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


      {/* URGENT: Transfer pending */}
      {order.payment_method === 'transfer' && order.payment_status !== 'verified' && order.status === 'delivered' && isAdmin && (
        <div className="flex items-center gap-2 px-3 py-3 bg-red-500/15 border-2 border-red-500/30 rounded-xl text-xs animate-pulse">
          <AlertTriangle size={16} className="text-bs-red shrink-0" />
          <div>
            <strong className="text-bs-red">URGENTE — Transferencia por verificar</strong>
            <p className="text-bs-text-secondary mt-0.5">El delivery ya entregó. Verifica el pago de {formatRD(order.total)} para completar la orden.</p>
          </div>
        </div>
      )}

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

        {order.payment_method === 'transfer' && order.payment_photo && (
          <div className="mb-3 rounded-xl overflow-hidden border border-bs-border">
            <img src={order.payment_photo} alt="Comprobante" className="w-full max-h-48 object-contain bg-black/50" />
            <div className="px-2 py-1 bg-bs-surface text-[10px] text-bs-text-muted text-center">Comprobante de transferencia</div>
          </div>
        )}

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
            {isAdmin ? (
              <Button variant="success" size="sm" className="w-full mt-2" onClick={() => setShowPayment(true)}>
                <DollarSign size={14} />
                Confirmar pago desde tienda
              </Button>
            ) : (
              <p className="text-[11px] text-bs-text-muted mt-2 text-center italic">Solo el administrador puede confirmar pagos</p>
            )}
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/* TRY-FIT RETURN CONFIRMATION — store confirms returned pieces  */}
      {/* ============================================================ */}
      {isTryFit && (order.status === 'delivered' || order.status === 'completed') && deliverySelectedPieces && (
        <Card highlight={allReturnsReceived ? 'success' : 'purple'}>
          <div className="flex items-center gap-2 mb-2">
            <PackageCheck size={16} className={allReturnsReceived ? 'text-bs-green' : 'text-purple-400'} />
            <span className={cn('text-sm font-bold', allReturnsReceived ? 'text-bs-green' : 'text-purple-400')}>
              {allReturnsReceived ? 'Devoluciones Confirmadas' : 'Confirmar Devoluciones'}
            </span>
          </div>

          {/* Show what client kept */}
          {tryFitItems.filter((i) => i.kept === true).length > 0 && (
            <div className="mb-3 p-2 bg-green-500/10 rounded-xl">
              <span className="text-[11px] text-bs-green font-semibold">Cliente se queda:</span>
              {tryFitItems.filter((i) => i.kept === true).map((i) => (
                <span key={i.id} className="text-[11px] text-bs-green ml-1">{i.product_name} ({i.size})</span>
              ))}
            </div>
          )}

          {returnedItems.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl">
              <CheckCircle size={14} className="text-bs-green" />
              <span className="text-xs text-bs-green font-medium">No hay piezas pendientes de devolución</span>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-bs-text-secondary mb-3">
                {allReturnsReceived
                  ? 'Todas las piezas devueltas fueron recibidas.'
                  : 'Toca "Prenda Recibida" cuando el delivery entregue cada pieza.'
                }
              </p>
              <div className="space-y-2">
                {returnedItems.map((item) => {
                  const isReceived = item.kept === 'received';
                  return (
                    <div key={item.id} className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all',
                      isReceived ? 'bg-green-500/10 border-green-500/30' : 'bg-bs-surface border-bs-border'
                    )}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package size={13} className={isReceived ? 'text-bs-green' : 'text-purple-400'} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{item.product_name}</div>
                          <div className="text-[11px] text-bs-text-muted">
                            {item.size && `Talla: ${item.size}`}{item.color && ` · ${item.color}`}
                          </div>
                        </div>
                      </div>
                      {isReceived ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle size={10} className="mr-1" />
                          Recibida
                        </Badge>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          loading={returnConfirmLoading === item.id}
                          onClick={() => handleConfirmReturn(item.id)}
                        >
                          <PackageCheck size={12} />
                          Prenda Recibida
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              {allReturnsReceived && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl">
                  <CheckCircle size={14} className="text-bs-green" />
                  <span className="text-xs text-bs-green font-medium">
                    Todas las piezas recibidas en tienda
                  </span>
                </div>
              )}
            </>
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
          <Button variant="warning" size="md" className="flex-1" onClick={() => updateOrder(order.id, { status: 'preparing', updated_at: new Date().toISOString() })}>
            Marcar como Preparando
          </Button>
        )}
        {order.status === 'preparing' && (
          <Button variant="success" size="md" className="flex-1" onClick={() => updateOrder(order.id, { status: 'ready', updated_at: new Date().toISOString() })}>
            Lista para Recoger
          </Button>
        )}
        {isAdmin && order.status !== 'cancelled' && order.status !== 'completed' && (
          <Button variant="danger" size="md" className="flex-1" onClick={() => setShowCancel(true)}>
            Cancelar Orden
          </Button>
        )}
      </div>


      {/* Assign Modal */}
      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Asignar Delivery">
        <div className="space-y-2">
          {deliveryUsers.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                const now = new Date().toISOString();
                updateOrder(order.id, {
                  assigned_delivery_id: d.id,
                  assigned_delivery: d,
                  status: order.status === 'new' ? 'assigned' : order.status,
                  updated_at: now,
                });
                addNotification({
                  id: `n_assign_${Date.now()}`,
                  user_id: d.id,
                  type: 'order_assigned',
                  message: `Nueva orden asignada — Cliente: ${order.customer?.name}, ${order.customer?.phone || ''}, ${order.customer?.sector || ''}`,
                  order_id: order.id,
                  read: false,
                  created_at: now,
                });
                setShowAssign(false);
              }}
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

      {/* Cancel Confirmation Modal */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancelar Orden">
        <div className="space-y-4">
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto bg-red-500/15 rounded-full flex items-center justify-center mb-3">
              <XCircle size={28} className="text-bs-red" />
            </div>
            <p className="text-sm text-bs-text-secondary">
              ¿Estás seguro de cancelar la orden de <strong>{order.customer?.name}</strong>?
            </p>
            <p className="text-xs text-bs-text-muted mt-1">Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setShowCancel(false)}>
              No, volver
            </Button>
            <Button variant="danger" size="md" className="flex-1" onClick={() => {
              updateOrder(order.id, { status: 'cancelled', updated_at: new Date().toISOString() });
              setShowCancel(false);
            }}>
              Sí, cancelar
            </Button>
          </div>
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
                Comprobante de transferencia
              </label>
              {order.payment_photo ? (
                <div className="rounded-xl overflow-hidden border border-bs-border mb-2">
                  <img src={order.payment_photo} alt="Comprobante de transferencia" className="w-full max-h-64 object-contain bg-black/50" />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-2">
                  <AlertTriangle size={13} className="text-bs-orange shrink-0" />
                  <span className="text-[11px] text-bs-orange">El delivery no subió foto del comprobante</span>
                </div>
              )}
              <p className="text-[11px] text-bs-text-muted">
                Verifica el número de transacción y que el monto aparece en la cuenta bancaria.
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
          <Button variant="success" size="lg" className="w-full" onClick={() => {
            const now = new Date().toISOString();
            const canComplete = isTryFit
              ? (returnedItems.length === 0 || allReturnsReceived)
              : true;
            const newStatus = canComplete && order.status === 'delivered' ? 'completed' : order.status;
            updateOrder(order.id, { payment_status: 'verified', status: newStatus, updated_at: now });

            if (order.assigned_delivery_id) {
              addNotification({
                id: `n_pay_del_${Date.now()}`,
                user_id: order.assigned_delivery_id,
                type: 'payment_confirmed',
                message: `Pago confirmado por José — ${order.customer?.name || ''} (${order.customer?.phone || ''}) ${formatRD(order.total)}`,
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
            addNotification({
              id: `n_pay_adm_${Date.now()}`,
              user_id: '1',
              type: 'payment_confirmed',
              message: `Pago verificado: ${formatRD(order.total)} — ${order.customer?.name || ''} (${order.customer?.phone || ''})`,
              order_id: order.id,
              read: false,
              created_at: now,
            });
            setShowPayment(false);
          }}>
            <CheckCircle size={16} />
            Confirmar Pago Verificado
          </Button>
        </div>
      </Modal>
    </div>
  );
}
