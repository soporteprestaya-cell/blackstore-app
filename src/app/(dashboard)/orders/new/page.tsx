'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PhotoGrid } from '@/components/ui/photo-capture';
import { SECTORS, generateOrderNumber, formatRD } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Camera, MessageSquare, Image, Store, Globe } from 'lucide-react';
import Link from 'next/link';

interface ItemForm {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  is_try_fit: boolean;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSector, setCustomerSector] = useState('');
  const [orderType, setOrderType] = useState<'standard' | 'try_fit'>('standard');
  const [source, setSource] = useState<'whatsapp' | 'instagram' | 'store' | 'other'>('whatsapp');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'prepaid'>('cash');
  const [notes, setNotes] = useState('');
  const [productPhotos, setProductPhotos] = useState<string[]>([]);
  const [items, setItems] = useState<ItemForm[]>([
    { product_name: '', size: '', color: '', quantity: 1, unit_price: 0, is_try_fit: false },
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const deliveryFee = 200;
  const total = subtotal + deliveryFee;

  function addItem() {
    setItems([...items, { product_name: '', size: '', color: '', quantity: 1, unit_price: 0, is_try_fit: orderType === 'try_fit' }]);
  }

  function updateItem(index: number, updates: Partial<ItemForm>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  function removeItem(index: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push('/orders');
  }

  const sourceIcons = {
    whatsapp: MessageSquare,
    instagram: Image,
    store: Store,
    other: Globe,
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders">
          <button className="p-2 hover:bg-bs-card rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-bs-text-secondary" />
          </button>
        </Link>
        <div>
          <h1 className="text-lg font-bold">Nueva Orden</h1>
          <p className="text-xs text-bs-text-muted">{generateOrderNumber()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origen y tipo */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-2">
            Origen del pedido
          </label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {(['whatsapp', 'instagram', 'store', 'other'] as const).map((s) => {
              const Icon = sourceIcons[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all ${
                    source === s
                      ? 'border-bs-accent bg-bs-accent/10 text-bs-accent'
                      : 'border-bs-border text-bs-text-muted hover:border-bs-border-light'
                  }`}
                >
                  <Icon size={16} />
                  {s === 'whatsapp' ? 'WhatsApp' : s === 'instagram' ? 'Instagram' : s === 'store' ? 'Tienda' : 'Otro'}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType('standard')}
              className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                orderType === 'standard'
                  ? 'border-bs-accent bg-bs-accent/10 text-bs-accent'
                  : 'border-bs-border text-bs-text-secondary'
              }`}
            >
              📦 Entrega normal
            </button>
            <button
              type="button"
              onClick={() => setOrderType('try_fit')}
              className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                orderType === 'try_fit'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-bs-border text-bs-text-secondary'
              }`}
            >
              👔 Prueba de talla
            </button>
          </div>
        </Card>

        {/* Datos del cliente */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            Datos del cliente
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre completo"
                required
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Teléfono"
                type="tel"
                required
              />
            </div>
            <input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Dirección de entrega"
              required
            />
            <select
              value={customerSector}
              onChange={(e) => setCustomerSector(e.target.value)}
              required
            >
              <option value="">Seleccionar sector</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Productos */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
              Productos
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={addItem}>
              <Plus size={14} />
              Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-3 bg-bs-surface rounded-xl border border-bs-border space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    value={item.product_name}
                    onChange={(e) => updateItem(i, { product_name: e.target.value })}
                    placeholder="Nombre del producto"
                    className="flex-1"
                    required
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-bs-red hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    value={item.size}
                    onChange={(e) => updateItem(i, { size: e.target.value })}
                    placeholder="Talla"
                  />
                  <input
                    value={item.color}
                    onChange={(e) => updateItem(i, { color: e.target.value })}
                    placeholder="Color"
                  />
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(i, { quantity: parseInt(e.target.value) || 0 })}
                    placeholder="Cant."
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    value={item.unit_price || ''}
                    onChange={(e) => updateItem(i, { unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="Precio"
                    min="0"
                    required
                  />
                </div>
                {orderType === 'try_fit' && (
                  <label className="flex items-center gap-2 text-xs text-purple-400">
                    <input
                      type="checkbox"
                      checked={item.is_try_fit}
                      onChange={(e) => updateItem(i, { is_try_fit: e.target.checked })}
                      className="rounded"
                    />
                    Pieza para prueba (cliente elige y devuelve las demás)
                  </label>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Fotos del producto */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            📸 Fotos del producto (cadena de custodia)
          </label>
          <p className="text-[11px] text-bs-text-muted mb-3">
            Fotografía los productos antes de empacar. Sirve como prueba de lo que se envió.
          </p>
          <PhotoGrid
            photos={productPhotos}
            onAdd={(photo) => setProductPhotos([...productPhotos, photo])}
            onRemove={(i) => setProductPhotos(productPhotos.filter((_, idx) => idx !== i))}
            label="Foto producto"
          />
        </Card>

        {/* Pago y prioridad */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            Pago y prioridad
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { value: 'cash' as const, label: '💵 Efectivo' },
              { value: 'transfer' as const, label: '📱 Transferencia' },
              { value: 'prepaid' as const, label: '✅ Ya pagó' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaymentMethod(opt.value)}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  paymentMethod === opt.value
                    ? 'border-bs-green bg-green-500/10 text-bs-green'
                    : 'border-bs-border text-bs-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPriority('normal')}
              className={`p-2.5 rounded-xl border text-xs transition-all ${
                priority === 'normal'
                  ? 'border-bs-accent bg-bs-accent/10 text-bs-accent'
                  : 'border-bs-border text-bs-text-secondary'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setPriority('urgent')}
              className={`p-2.5 rounded-xl border text-xs transition-all ${
                priority === 'urgent'
                  ? 'border-bs-red bg-red-500/10 text-bs-red'
                  : 'border-bs-border text-bs-text-secondary'
              }`}
            >
              🔥 Urgente
            </button>
          </div>
        </Card>

        {/* Notas */}
        <Card>
          <label className="block text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-2">
            Notas internas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instrucciones especiales, comentarios del cliente..."
            rows={3}
            className="w-full resize-none"
          />
        </Card>

        {/* Total */}
        <Card highlight="accent">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-bs-text-secondary">
              <span>Subtotal ({items.length} items)</span>
              <span>{formatRD(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-bs-text-secondary">
              <span>Delivery</span>
              <span>{formatRD(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-bs-border">
              <span>Total</span>
              <span className="text-bs-green">{formatRD(total)}</span>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Crear Orden
        </Button>
      </form>
    </div>
  );
}
