'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PhotoCapture } from '@/components/ui/photo-capture';
import { ORDER_STATUS_CONFIG, formatRD, formatDate, cn } from '@/lib/utils';
import {
  ArrowLeft, MapPin, Phone, Package, Truck,
  CheckCircle, Navigation, DollarSign, Repeat, AlertTriangle,
  MessageSquare, Star, ClipboardCheck, MapPinned, Clock,
  PhoneCall, Check, X, Bus,
} from 'lucide-react';

export default function DeliveryOrderDetailPage() {
  const { id } = useParams();
  const { orders, updateOrder, addNotification, user } = useAppStore();
  const order = orders.find((o) => o.id === id);

  const [status, setStatus] = useState(order?.status || 'assigned');
  const [pickupPhoto, setPickupPhoto] = useState<string | undefined>();
  const [paymentPhoto, setPaymentPhoto] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'prepaid'>(order?.payment_method || 'cash');
  const [cashAmount, setCashAmount] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [returnPhoto, setReturnPhoto] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [busPlate, setBusPlate] = useState('');
  const [busFicha, setBusFicha] = useState('');

  const [reminderChecklist, setReminderChecklist] = useState({
    confirmed_address: false,
    checked_hours: false,
    estimated_arrival: false,
  });

  const [itemSelections, setItemSelections] = useState<Record<string, 'kept' | 'returned' | null>>(() => {
    if (!order) return {};
    const sel: Record<string, 'kept' | 'returned' | null> = {};
    order.items.forEach((item) => {
      sel[item.id] = null;
    });
    return sel;
  });

  const allRemindersDone = Object.values(reminderChecklist).every(Boolean);

  const allItemsDecided = useMemo(() => {
    if (!order || order.type !== 'try_fit') return true;
    return order.items.filter((i) => i.is_try_fit).every((item) => itemSelections[item.id] !== null);
  }, [order, itemSelections]);

  const keptItems = useMemo(() => {
    if (!order) return [];
    return order.items.filter((i) => itemSelections[i.id] === 'kept');
  }, [order, itemSelections]);

  const returnedItems = useMemo(() => {
    if (!order) return [];
    return order.items.filter((i) => itemSelections[i.id] === 'returned');
  }, [order, itemSelections]);

  if (!order) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-bs-text-secondary">Orden no encontrada</p>
        <Link href="/my-orders"><Button variant="ghost" size="sm" className="mt-4">Volver</Button></Link>
      </div>
    );
  }

  const isTryFit = order.type === 'try_fit';

  const effectiveTotal = order.total;

  const isBusRoute = order?.delivery_method === 'bus_route';
  const busDriverReady = !isBusRoute || (driverName && driverPhone && busPlate);

  const canConfirmDelivery = busDriverReady && (
    paymentMethod === 'prepaid' ||
    (paymentMethod === 'transfer' && paymentPhoto) ||
    (paymentMethod === 'cash' && cashAmount)
  ) && (isTryFit ? allItemsDecided : true);

  async function handleAction(newStatus: string) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setStatus(newStatus as typeof status);

    const baseUpdate: Record<string, any> = {
      status: newStatus,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    };
    if (paymentMethod === 'transfer' && paymentPhoto) {
      baseUpdate.payment_photo = paymentPhoto;
    }

    if (newStatus === 'delivered' && order!.type === 'try_fit') {
      const updatedItems = order!.items.map((item) => ({
        ...item,
        kept: item.is_try_fit
          ? (itemSelections[item.id] === 'kept' ? true : itemSelections[item.id] === 'returned' ? false : item.kept)
          : item.kept,
      }));
      updateOrder(order!.id, { ...baseUpdate, items: updatedItems });
    } else {
      updateOrder(order!.id, baseUpdate);
    }

    if (newStatus === 'delivered') {
      const now = new Date().toISOString();
      const isTransfer = paymentMethod === 'transfer';

      addNotification({
        id: `n_${Date.now()}`,
        user_id: '1',
        type: isTransfer ? 'payment_confirmed' : 'delivery_completed',
        message: isTransfer
          ? `🔴 URGENTE: Verificar transferencia de ${formatRD(order!.total)} — Orden #${order!.order_number} (${order!.customer?.name || ''}). Delivery: ${user?.name || ''}`
          : `${user?.name || 'Delivery'} entregó la orden #${order!.order_number} al cliente ${order!.customer?.name || ''}`,
        order_id: order!.id,
        read: false,
        created_at: now,
      });

      if (order!.type === 'try_fit') {
        const returned = order!.items.filter((i) => itemSelections[i.id] === 'returned');
        addNotification({
          id: `n_tryfit_${Date.now()}`,
          user_id: '2',
          type: 'delivery_completed',
          message: `Orden #${order!.order_number} — ${returned.length} pieza(s) por recibir del delivery ${user?.name || ''}. Confirma recepción en tienda.`,
          order_id: order!.id,
          read: false,
          created_at: now,
        });
      }
    }
    setLoading(false);
  }

  function toggleItemSelection(itemId: string, value: 'kept' | 'returned') {
    if (!order) return;
    const clickedItem = order.items.find((i) => i.id === itemId);
    if (!clickedItem) return;

    setItemSelections((prev) => {
      const next = { ...prev };
      if (value === 'kept') {
        next[itemId] = 'kept';
        order.items
          .filter((i) => i.id !== itemId && i.is_try_fit && i.product_name === clickedItem.product_name)
          .forEach((i) => { next[i.id] = 'returned'; });
      } else {
        next[itemId] = 'returned';
      }
      return next;
    });
  }

  function toggleReminder(key: keyof typeof reminderChecklist) {
    setReminderChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/my-orders">
          <button className="p-2 hover:bg-bs-card rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-bs-text-secondary" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">#{order.order_number}</h1>
          <p className="text-xs text-bs-text-muted">{formatDate(order.created_at)}</p>
        </div>
        <Badge variant={status === 'delivered' ? 'success' : 'blue'} size="md">
          {ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG]?.label || status}
        </Badge>
      </div>

      {/* Priority */}
      {order.priority === 'urgent' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-bs-red">
          <AlertTriangle size={14} />
          <strong>Pedido URGENTE — entregar lo antes posible</strong>
        </div>
      )}

      {/* Customer + Navigation */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-2 block">
          Datos de entrega
        </span>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-bs-accent shrink-0" />
            <span className="font-medium">{order.customer?.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-bs-text-secondary">
            <span className="ml-5 text-xs">{order.customer?.sector}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <a href={`tel:${order.customer?.phone}`}>
            <Button variant="outline" size="sm" className="w-full">
              <Phone size={13} />
              Llamar
            </Button>
          </a>
          <a href={`https://wa.me/1${order.customer?.phone.replace(/\D/g, '')}`}>
            <Button variant="outline" size="sm" className="w-full">
              <MessageSquare size={13} />
              WhatsApp
            </Button>
          </a>
          <a href={order.location_url || `https://maps.google.com/?q=${encodeURIComponent(order.customer?.address || '')}`} target="_blank">
            <Button variant="primary" size="sm" className="w-full">
              <Navigation size={13} />
              {order.location_url ? 'Abrir Mapa' : 'Navegar'}
            </Button>
          </a>
        </div>
      </Card>

      {/* Bus Route Info */}
      {order.delivery_method === 'bus_route' && order.bus_route && (
        <Card highlight="cyan">
          <div className="flex items-center gap-2 mb-2">
            <Bus size={16} className="text-bs-cyan" />
            <span className="text-xs font-bold text-bs-cyan uppercase tracking-wider">
              Envío por guagua
            </span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-bs-text-muted">Línea:</span>
              <span className="font-bold">{order.bus_route.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-bs-text-muted">Destino:</span>
              <span className="font-bold">{order.bus_route.terminal}</span>
            </div>
            {order.bus_route.notes && (
              <div className="mt-2 text-xs text-bs-text-secondary italic bg-bs-surface p-2 rounded-lg">
                {order.bus_route.notes}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Items */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-2 block">
          Productos a entregar
        </span>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2 border-b border-bs-border last:border-0">
            <div className="flex items-center gap-2">
              <Package size={13} className="text-bs-text-muted" />
              <div>
                <div className="text-sm">{item.quantity}x {item.product_name}</div>
                <div className="text-[11px] text-bs-text-muted">
                  {item.size && `Talla: ${item.size}`} {item.color && `· ${item.color}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-bs-text-muted">{formatRD(item.quantity * item.unit_price)}</span>
              {item.is_try_fit && (
                <span className="text-[9px] font-bold text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">PRUEBA</span>
              )}
            </div>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-bs-border flex justify-between">
          <span className="text-sm text-bs-text-secondary">Total a cobrar</span>
          <span className="text-base font-bold text-bs-green">{formatRD(order.total)}</span>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* PICKUP REMINDER CHECKLIST — shows when picking up the order  */}
      {/* ============================================================ */}
      {(status === 'assigned' || status === 'picked_up') && (
        <Card highlight="warning">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck size={16} className="text-bs-orange" />
            <span className="text-sm font-bold text-bs-orange">Recordatorio al Recoger</span>
          </div>
          <p className="text-[11px] text-bs-text-secondary mb-3">
            Antes de salir, comunícate con el cliente para confirmar estos puntos:
          </p>
          <div className="space-y-2.5">
            {([
              { key: 'confirmed_address' as const, icon: MapPin, label: 'Confirmar dirección exacta con el cliente' },
              { key: 'checked_hours' as const, icon: Clock, label: 'Preguntar hasta qué hora puede recibir' },
              { key: 'estimated_arrival' as const, icon: PhoneCall, label: 'Comunicar tiempo estimado de llegada' },
            ]).map((item) => (
              <button
                key={item.key}
                onClick={() => toggleReminder(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                  reminderChecklist[item.key]
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-bs-surface border-bs-border hover:border-bs-border-light'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all',
                  reminderChecklist[item.key] ? 'bg-bs-green' : 'bg-bs-card border border-bs-border'
                )}>
                  {reminderChecklist[item.key] ? (
                    <Check size={14} className="text-white" />
                  ) : (
                    <item.icon size={12} className="text-bs-text-muted" />
                  )}
                </div>
                <span className={cn(
                  'text-xs',
                  reminderChecklist[item.key] ? 'text-bs-green line-through' : 'text-bs-text'
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          {allRemindersDone && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl">
              <CheckCircle size={14} className="text-bs-green" />
              <span className="text-xs text-bs-green font-medium">Todo confirmado con el cliente</span>
            </div>
          )}
        </Card>
      )}

      {/* ============================================================ */}
      {/* STEP 1: Pickup                                                */}
      {/* ============================================================ */}
      {(status === 'assigned' || status === 'picked_up') && (
        <Card highlight="accent">
          <span className="text-xs font-semibold text-bs-accent uppercase tracking-wider mb-3 block">
            Paso 1: Recoger en tienda
          </span>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!allRemindersDone}
            loading={loading}
            onClick={() => handleAction('in_transit')}
          >
            <Truck size={16} />
            Confirmar Recogida — En Camino
          </Button>
          {!allRemindersDone && (
            <p className="text-center text-[11px] text-bs-orange mt-2">
              Completa el checklist de contacto con el cliente
            </p>
          )}
        </Card>
      )}

      {/* ============================================================ */}
      {/* TRY-FIT PIECE SELECTION — shows when in_transit for try_fit   */}
      {/* ============================================================ */}
      {isTryFit && status === 'in_transit' && (
        <Card highlight="purple">
          <div className="flex items-center gap-2 mb-2">
            <Repeat size={16} className="text-purple-400" />
            <span className="text-sm font-bold text-purple-400">Selección de Piezas</span>
          </div>
          <p className="text-[11px] text-bs-text-secondary mb-3">
            Marca cuáles piezas el cliente se queda y cuáles devuelve. El total se ajusta automáticamente.
          </p>
          <div className="space-y-2">
            {order.items.filter((i) => i.is_try_fit).map((item) => (
              <div key={item.id} className={cn(
                'p-3 rounded-xl border transition-all',
                itemSelections[item.id] === 'kept' ? 'bg-green-500/10 border-green-500/30' :
                itemSelections[item.id] === 'returned' ? 'bg-red-500/10 border-red-500/30' :
                'bg-bs-surface border-bs-border'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium">{item.product_name}</div>
                    <div className="text-[11px] text-bs-text-muted">
                      {item.size && `Talla: ${item.size}`} {item.color && ` · ${item.color}`}
                      {' · '}{formatRD(item.quantity * item.unit_price)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleItemSelection(item.id, 'kept')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                      itemSelections[item.id] === 'kept'
                        ? 'bg-bs-green text-white'
                        : 'bg-bs-card border border-bs-border text-bs-text-secondary hover:border-green-500/40'
                    )}
                  >
                    <Check size={14} />
                    Se queda
                  </button>
                  <button
                    onClick={() => toggleItemSelection(item.id, 'returned')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                      itemSelections[item.id] === 'returned'
                        ? 'bg-bs-red text-white'
                        : 'bg-bs-card border border-bs-border text-bs-text-secondary hover:border-red-500/40'
                    )}
                  >
                    <X size={14} />
                    Devuelve
                  </button>
                </div>
              </div>
            ))}

            {/* Non-try-fit items in the order */}
            {order.items.filter((i) => !i.is_try_fit).map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-bs-surface border border-bs-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{item.product_name}</div>
                    <div className="text-[11px] text-bs-text-muted">
                      {item.size && `Talla: ${item.size}`}
                      {' · '}{formatRD(item.quantity * item.unit_price)}
                    </div>
                  </div>
                  <span className="text-[10px] text-bs-green font-semibold">Incluido</span>
                </div>
              </div>
            ))}
          </div>

          {allItemsDecided && returnedItems.length > 0 && (
            <div className="mt-4 p-3 bg-bs-card rounded-xl border border-bs-border space-y-1">
              <div className="flex items-center gap-2 text-xs text-bs-green">
                <CheckCircle size={12} />
                <span>Cliente se queda: {keptItems.map((i) => `${i.product_name} (${i.size})`).join(', ')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-bs-text-muted">
                <Repeat size={12} />
                <span>Devolver: {returnedItems.map((i) => `${i.product_name} (${i.size})`).join(', ')}</span>
              </div>
            </div>
          )}

          {!allItemsDecided && (
            <p className="text-center text-[11px] text-purple-400 mt-3">
              Selecciona la talla que eligió el cliente
            </p>
          )}

          {returnedItems.length > 0 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <AlertTriangle size={13} className="text-bs-orange shrink-0" />
              <span className="text-[11px] text-bs-orange">
                Debes devolver {returnedItems.length} pieza(s) a la tienda. La tienda debe confirmar la recepción.
              </span>
            </div>
          )}
        </Card>
      )}

      {/* ============================================================ */}
      {/* STEP 2: Delivery                                              */}
      {/* ============================================================ */}
      {status === 'in_transit' && (
        <Card highlight="success">
          <span className="text-xs font-semibold text-bs-green uppercase tracking-wider mb-3 block">
            Paso 2: Confirmar Entrega
          </span>

          {/* Bus Route - Driver Info */}
          {isBusRoute && (
            <div className="mb-4 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Bus size={14} className="text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400">Datos del chofer</span>
              </div>
              <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Nombre del chofer" className="w-full" />
              <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="Teléfono del chofer" type="tel" className="w-full" />
              <div className="grid grid-cols-2 gap-2">
                <input value={busFicha} onChange={(e) => setBusFicha(e.target.value)} placeholder="Ficha de la guagua" className="w-full" />
                <input value={busPlate} onChange={(e) => setBusPlate(e.target.value)} placeholder="Placa de la guagua" className="w-full" />
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="mb-4">
            <span className="text-xs font-semibold text-bs-text mb-2 block">
              Pago recibido
              {isTryFit && allItemsDecided && (
                <span className="ml-2 text-bs-green font-bold">{formatRD(order.total)}</span>
              )}
            </span>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([
                { value: 'transfer' as const, label: 'Transferencia', desc: 'Foto comprobante' },
                { value: 'cash' as const, label: 'Efectivo', desc: 'Monto recibido' },
                { value: 'prepaid' as const, label: 'Ya pagó', desc: 'Pago previo' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    'p-2.5 rounded-xl border text-center transition-all',
                    paymentMethod === opt.value
                      ? 'border-bs-green bg-green-500/10'
                      : 'border-bs-border'
                  )}
                >
                  <div className="text-xs font-medium">{opt.label}</div>
                  <div className="text-[9px] text-bs-text-muted">{opt.desc}</div>
                </button>
              ))}
            </div>

            {paymentMethod === 'transfer' && (
              <PhotoCapture
                label="Foto del comprobante de transferencia"
                required
                value={paymentPhoto}
                onChange={setPaymentPhoto}
              />
            )}

            {paymentMethod === 'cash' && (
              <div>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder={`Monto recibido (${formatRD(effectiveTotal)})`}
                  className="w-full"
                  required
                />
                {cashAmount && parseFloat(cashAmount) < effectiveTotal && (
                  <p className="text-[11px] text-bs-red mt-1">
                    Monto menor al total. Diferencia: {formatRD(effectiveTotal - parseFloat(cashAmount))}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <span className="text-xs text-bs-text-secondary mb-1 block">Notas de entrega (opcional)</span>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Comentarios sobre la entrega..."
              rows={2}
              className="w-full resize-none"
            />
          </div>

          {/* Confirm Button */}
          <Button
            variant="success"
            size="lg"
            className="w-full"
            disabled={!canConfirmDelivery}
            loading={loading}
            onClick={() => handleAction('delivered')}
          >
            <CheckCircle size={18} />
            Confirmar Entrega
          </Button>

          {!canConfirmDelivery && (
            <p className="text-center text-[11px] text-bs-text-muted mt-2">
              {isTryFit && !allItemsDecided ? 'Marca todas las piezas arriba' :
               paymentMethod === 'transfer' && !paymentPhoto ? 'Sube la foto del comprobante' :
               paymentMethod === 'cash' && !cashAmount ? 'Ingresa el monto recibido' : ''}
            </p>
          )}
        </Card>
      )}

      {/* ============================================================ */}
      {/* STEP 3: Delivered                                             */}
      {/* ============================================================ */}
      {status === 'delivered' && (
        <>
          <Card highlight="success">
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto bg-bs-green/15 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-bs-green" />
              </div>
              <h3 className="text-lg font-bold text-bs-green">Entrega Confirmada</h3>
              <p className="text-xs text-bs-text-secondary mt-1">
                Pendiente confirmación de pago por la tienda
              </p>
              <div className="mt-3 px-3 py-2 bg-bs-card rounded-xl inline-block">
                <span className="text-xs text-bs-text-muted">Comisión: </span>
                <span className="text-sm font-bold text-bs-green">{formatRD(order.delivery_fee || 0)}</span>
              </div>
            </div>
          </Card>

          {/* Try-fit return reminder */}
          {isTryFit && returnedItems.length > 0 && (
            <Card highlight="warning">
              <div className="flex items-center gap-2 mb-2">
                <Repeat size={16} className="text-bs-orange" />
                <span className="text-sm font-bold text-bs-orange">Devolución Pendiente</span>
              </div>
              <p className="text-[11px] text-bs-text-secondary mb-3">
                Debes devolver estas piezas a la tienda. Un empleado debe confirmar que las recibió.
              </p>
              <div className="space-y-1.5">
                {returnedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-bs-surface rounded-lg border border-bs-border">
                    <div className="flex items-center gap-2">
                      <Package size={13} className="text-bs-red" />
                      <span className="text-xs">{item.product_name} {item.size && `(${item.size})`}</span>
                    </div>
                    <Badge variant="warning" size="sm">Pendiente</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <PhotoCapture
                  label="Foto al devolver piezas en tienda"
                  required
                  value={returnPhoto}
                  onChange={setReturnPhoto}
                />
                <Button variant="warning" size="sm" className="w-full" disabled={!returnPhoto}>
                  <Repeat size={14} />
                  Confirmar Devolución Entregada
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
