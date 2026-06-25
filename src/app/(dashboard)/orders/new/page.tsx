'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { DEMO_USERS } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SECTORS, generateOrderNumber, formatRD } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Truck, Bus, MapPin, CheckCircle, Phone, PackageCheck } from 'lucide-react';
import { sendPushToUser } from '@/lib/push-notifications';
import Link from 'next/link';
import type { Order, DeliveryMethod } from '@/lib/types';

interface ItemForm {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  photo?: string;
  extra_size?: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { addOrder, addNotification, orders, user, teamMembers, deliveryOnline } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [orderNumber] = useState(generateOrderNumber());

  // Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSector, setCustomerSector] = useState('');
  const [locationUrl, setLocationUrl] = useState('');

  // Envío
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('personal');
  const [busCompany, setBusCompany] = useState('');
  const [busCustomCompany, setBusCustomCompany] = useState('');
  const [busTerminal, setBusTerminal] = useState('');
  const [busNotes, setBusNotes] = useState('');

  // Compañía de envío
  const [shippingCompany, setShippingCompany] = useState('');
  const [shippingCustomCompany, setShippingCustomCompany] = useState('');
  const [shippingDestination, setShippingDestination] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');

  // Productos
  const [items, setItems] = useState<ItemForm[]>([
    { product_name: '', size: '', color: '', quantity: 1, unit_price: 0 },
  ]);

  // Pago
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'prepaid'>('cash');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Delivery
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  // Notas
  const [notes, setNotes] = useState('');

  const allUsers = [...DEMO_USERS, ...teamMembers.filter((m) => !DEMO_USERS.some((d) => d.id === m.id))];
  const deliveryUsers = allUsers.filter((u) => u.role === 'delivery' && u.is_active);

  const deliveryStatus = useMemo(() => {
    const status: Record<string, { busy: boolean; activeCount: number }> = {};
    for (const d of deliveryUsers) {
      const activeOrders = orders.filter(
        (o) => o.assigned_delivery_id === d.id && ['assigned', 'picked_up', 'in_transit'].includes(o.status)
      );
      status[d.id] = { busy: activeOrders.length > 0, activeCount: activeOrders.length };
    }
    return status;
  }, [deliveryUsers, orders]);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = subtotal + deliveryFee;
  const hasTryFit = items.some((i) => !!i.extra_size);

  function addItem() {
    setItems([...items, { product_name: '', size: '', color: '', quantity: 1, unit_price: 0 }]);
  }

  function updateItem(index: number, updates: Partial<ItemForm>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  function removeItem(index: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  }

  const selectedDelivery = selectedDeliveryId ? allUsers.find((u) => u.id === selectedDeliveryId) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const now = new Date().toISOString();
    const ordId = `ord_${Date.now()}`;

    const validItems = items.filter((item) => item.product_name.trim() || item.unit_price > 0);

    const newOrder: Order = {
      id: ordId,
      order_number: orderNumber,
      customer_id: `c_${Date.now()}`,
      customer: {
        id: `c_${Date.now()}`,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        sector: customerSector,
        location_url: locationUrl || undefined,
        is_blacklisted: false,
        order_count: 1,
        created_at: now,
      },
      type: hasTryFit ? 'try_fit' : 'standard',
      status: selectedDeliveryId ? 'assigned' : 'new',
      items: validItems.flatMap((item, i) => {
        const main = {
          id: `item_${Date.now()}_${i}`,
          order_id: ordId,
          product_name: item.product_name || 'Producto',
          size: item.size || undefined,
          color: item.color || undefined,
          quantity: item.quantity || 1,
          unit_price: item.unit_price,
          is_try_fit: !!item.extra_size,
          kept: null,
        };
        if (item.extra_size) {
          return [main, {
            ...main,
            id: `item_${Date.now()}_${i}_extra`,
            size: item.extra_size,
            is_try_fit: true,
            kept: null,
          }];
        }
        return [main];
      }),
      subtotal,
      delivery_fee: deliveryFee,
      total,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'prepaid' ? 'verified' : 'pending',
      notes: notes || undefined,
      source: 'whatsapp',
      priority,
      delivery_method: deliveryMethod,
      location_url: locationUrl || undefined,
      bus_route: deliveryMethod === 'bus_route' ? {
        company: busCompany === 'Otra' ? busCustomCompany : busCompany,
        route: busCompany === 'Otra' ? busCustomCompany : '',
        terminal: busTerminal,
        notes: busNotes || undefined,
      } : undefined,
      shipping_company: deliveryMethod === 'shipping_company' ? {
        company: shippingCompany === 'Otra' ? shippingCustomCompany : shippingCompany,
        destination: shippingDestination,
        notes: shippingNotes || undefined,
      } : undefined,
      product_photos: [],
      package_photo: undefined,
      created_by: user?.id || '',
      assigned_delivery_id: selectedDeliveryId || undefined,
      assigned_delivery: selectedDelivery || undefined,
      created_at: now,
      updated_at: now,
    };

    addOrder(newOrder);

    if (selectedDeliveryId && selectedDelivery) {
      const assignMsg = `Nueva orden #${orderNumber} asignada — Cliente: ${customerName}, ${customerSector}`;
      addNotification({
        id: `n_${Date.now()}`,
        user_id: selectedDeliveryId,
        type: 'order_assigned',
        message: assignMsg,
        order_id: ordId,
        read: false,
        created_at: now,
      });
      sendPushToUser(selectedDeliveryId, assignMsg, { url: `/my-orders/${ordId}` });
    }

    await new Promise((r) => setTimeout(r, 400));
    router.push('/orders');
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/orders">
          <button className="p-2 hover:bg-bs-card rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-bs-text-secondary" />
          </button>
        </Link>
        <div>
          <h1 className="text-lg font-bold">Nueva Orden</h1>
          <p className="text-xs text-bs-text-muted">{orderNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. CLIENTE */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            1. Cliente
          </label>
          <div className="space-y-3">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" required />
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Teléfono" type="tel" required />
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bs-text-muted" />
              <input value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} placeholder="Link de Google Maps (opcional)" className="w-full pl-9" />
            </div>
          </div>
        </Card>

        {/* 2. PRODUCTOS */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
              2. Productos
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={addItem}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-3 bg-bs-surface rounded-xl border border-bs-border space-y-2">
                <div className="flex items-start gap-2">
                  <input value={item.product_name} onChange={(e) => updateItem(i, { product_name: e.target.value })} placeholder="Nombre del producto" className="flex-1" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-bs-red hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input value={item.size} onChange={(e) => updateItem(i, { size: e.target.value })} placeholder="Talla" />
                  <input value={item.color} onChange={(e) => updateItem(i, { color: e.target.value })} placeholder="Color" />
                  <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(i, { quantity: parseInt(e.target.value) || 0 })} placeholder="Cant." min="1" />
                  <input type="number" value={item.unit_price || ''} onChange={(e) => updateItem(i, { unit_price: parseFloat(e.target.value) || 0 })} placeholder="RD$" min="0" />
                </div>
                {!item.extra_size && item.size && (
                  <button
                    type="button"
                    onClick={() => updateItem(i, { extra_size: '' })}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-purple-500/30 text-xs text-purple-400 hover:bg-purple-500/5 transition-all"
                  >
                    <Plus size={12} /> Enviar talla extra para probar
                  </button>
                )}
                {item.extra_size !== undefined && (
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-purple-500/30 bg-purple-500/5">
                    <span className="text-[10px] text-purple-400 font-semibold shrink-0">TALLA EXTRA:</span>
                    <input
                      value={item.extra_size}
                      onChange={(e) => updateItem(i, { extra_size: e.target.value })}
                      placeholder="Ej: L"
                      className="flex-1 !py-1.5 !text-xs"
                    />
                    <button type="button" onClick={() => updateItem(i, { extra_size: undefined })} className="p-1 text-bs-red hover:bg-red-500/10 rounded">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
                {item.extra_size !== undefined && (
                  <p className="text-[10px] text-purple-400/70">
                    Se envían talla {item.size} y {item.extra_size || '___'}. El cliente elige, se cobra solo una. El delivery devuelve la otra.
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 3. ENVÍO */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            3. Envío
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button type="button" onClick={() => setDeliveryMethod('personal')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                deliveryMethod === 'personal' ? 'border-bs-green bg-green-500/10 text-bs-green' : 'border-bs-border text-bs-text-secondary'
              }`}>
              <Truck size={16} />
              <span>Delivery personal</span>
            </button>
            <button type="button" onClick={() => setDeliveryMethod('bus_route')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                deliveryMethod === 'bus_route' ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400' : 'border-bs-border text-bs-text-secondary'
              }`}>
              <Bus size={16} />
              <span>Ruta de guagua</span>
            </button>
            <button type="button" onClick={() => setDeliveryMethod('shipping_company')}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                deliveryMethod === 'shipping_company' ? 'border-orange-400 bg-orange-500/10 text-orange-400' : 'border-bs-border text-bs-text-secondary'
              }`}>
              <PackageCheck size={16} />
              <span>Compañía envío</span>
            </button>
          </div>

          {deliveryMethod === 'bus_route' && (
            <div className="space-y-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl mb-3">
              <select value={busCompany} onChange={(e) => setBusCompany(e.target.value)} required>
                <option value="">Línea de transporte</option>
                <option value="Expreso Vegano">Expreso Vegano</option>
                <option value="Expreso Nagua">Expreso Nagua</option>
                <option value="Transporte Espinal">Transporte Espinal</option>
                <option value="Tarea Bus">Tarea Bus</option>
                <option value="ASTRAPU">ASTRAPU</option>
                <option value="SICHOEM">SICHOEM</option>
                <option value="Hato Mayor">Hato Mayor</option>
                <option value="ASOMIRO">ASOMIRO</option>
                <option value="Expreso Azua">Expreso Azua</option>
                <option value="Expreso Baní">Expreso Baní</option>
                <option value="Otra">Otra línea...</option>
              </select>
              {busCompany === 'Otra' && (
                <input value={busCustomCompany} onChange={(e) => setBusCustomCompany(e.target.value)} placeholder="Nombre de la línea" required />
              )}
              <input value={busTerminal} onChange={(e) => setBusTerminal(e.target.value)} placeholder="Destino (ej: Santiago, La Vega)" required />
              <textarea value={busNotes} onChange={(e) => setBusNotes(e.target.value)} placeholder="Notas (horario, parada...)" rows={2} className="w-full resize-none" />
            </div>
          )}

          {deliveryMethod === 'shipping_company' && (
            <div className="space-y-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl mb-3">
              <select value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} required>
                <option value="">Seleccionar compañía</option>
                <option value="Caribe Pack">Caribe Pack</option>
                <option value="Metro Paq">Metro Paq</option>
                <option value="Vimenpaq">Vimenpaq</option>
                <option value="Otra">Otra compañía...</option>
              </select>
              {shippingCompany === 'Otra' && (
                <input value={shippingCustomCompany} onChange={(e) => setShippingCustomCompany(e.target.value)} placeholder="Nombre de la compañía" required />
              )}
              <input value={shippingDestination} onChange={(e) => setShippingDestination(e.target.value)} placeholder="Destino de envío" required />
              <textarea value={shippingNotes} onChange={(e) => setShippingNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} className="w-full resize-none" />
            </div>
          )}

          {/* Costo de envío */}
          <div className="flex items-center justify-between p-3 bg-bs-surface rounded-xl border border-bs-border">
            <span className="text-xs text-bs-text-secondary">Costo de envío</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-bs-text-muted">RD$</span>
              <input
                type="number"
                value={deliveryFee || ''}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className="w-24 text-right text-sm font-bold"
              />
            </div>
          </div>
        </Card>

        {/* 4. ASIGNAR DELIVERY */}
        <Card>
            <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
              4. Asignar Delivery
            </label>
            <div className="space-y-2">
              {deliveryUsers.map((d) => {
                const st = deliveryStatus[d.id] || { busy: false, activeCount: 0 };
                const isSelected = selectedDeliveryId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDeliveryId(isSelected ? null : d.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-bs-green bg-green-500/10'
                        : 'border-bs-border hover:border-bs-border-light'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-bs-green/20' : 'bg-bs-surface'
                    }`}>
                      {isSelected ? <CheckCircle size={18} className="text-bs-green" /> : <Truck size={18} className="text-bs-text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-[10px] text-bs-text-muted flex items-center gap-1">
                        <Phone size={9} /> {d.phone}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {!deliveryOnline[d.id] ? (
                        <span className="text-[10px] font-bold text-bs-text-muted bg-bs-surface px-2 py-0.5 rounded block">
                          Desconectado
                        </span>
                      ) : st.busy ? (
                        <span className="text-[10px] font-bold text-bs-orange bg-orange-500/15 px-2 py-0.5 rounded block">
                          {st.activeCount} en ruta
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-bs-green bg-green-500/15 px-2 py-0.5 rounded block">
                          Disponible
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {!selectedDeliveryId && (
              <p className="text-[11px] text-bs-text-muted text-center mt-2">
                Selecciona un delivery o crea la orden sin asignar
              </p>
            )}
          </Card>

        {/* 5. PAGO Y PRIORIDAD */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            5. Pago y prioridad
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { value: 'cash' as const, label: 'Efectivo' },
              { value: 'transfer' as const, label: 'Transferencia' },
              { value: 'prepaid' as const, label: 'Ya pagó' },
            ].map((opt) => (
              <button key={opt.value} type="button" onClick={() => setPaymentMethod(opt.value)}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  paymentMethod === opt.value ? 'border-bs-green bg-green-500/10 text-bs-green' : 'border-bs-border text-bs-text-secondary'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPriority('normal')}
              className={`p-2.5 rounded-xl border text-xs transition-all ${
                priority === 'normal' ? 'border-bs-accent bg-bs-accent/10 text-bs-accent' : 'border-bs-border text-bs-text-secondary'
              }`}>
              Normal
            </button>
            <button type="button" onClick={() => setPriority('urgent')}
              className={`p-2.5 rounded-xl border text-xs transition-all ${
                priority === 'urgent' ? 'border-bs-red bg-red-500/10 text-bs-red' : 'border-bs-border text-bs-text-secondary'
              }`}>
              Urgente
            </button>
          </div>
        </Card>

        {/* 6. NOTAS */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-2">
            Notas (opcional)
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales..." rows={2} className="w-full resize-none" />
        </Card>

        {/* RESUMEN TOTAL */}
        <Card highlight="accent">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-bs-text-secondary">
              <span>Subtotal ({items.filter((i) => i.product_name.trim() || i.unit_price > 0).length} artículo{items.filter((i) => i.product_name.trim() || i.unit_price > 0).length !== 1 ? 's' : ''})</span>
              <span>{formatRD(subtotal)}</span>
            </div>
            {hasTryFit && (
              <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/5 px-2 py-1.5 rounded-lg">
                <span>{items.filter((i) => !!i.extra_size).length} con talla extra para probar</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-bs-text-secondary">
              <span>Envío</span>
              <span>{formatRD(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-bs-border">
              <span>Total</span>
              <span className="text-bs-green">{formatRD(total)}</span>
            </div>
            {selectedDelivery && (
              <div className="flex items-center gap-2 pt-1 text-xs text-bs-green">
                <Truck size={13} />
                <span>Asignado a <strong>{selectedDelivery.name}</strong></span>
              </div>
            )}
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {selectedDeliveryId ? 'Crear y Asignar Orden' : 'Crear Orden'}
        </Button>
      </form>
    </div>
  );
}
