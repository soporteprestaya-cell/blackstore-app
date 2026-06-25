'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRD } from '@/lib/utils';
import {
  DollarSign, Package, CheckCircle, Clock, Banknote, ThumbsUp,
  ChevronDown, ChevronUp, HelpCircle, ArrowDownRight, ArrowUpRight, Minus,
} from 'lucide-react';

function groupByDay(orders: { updated_at?: string; created_at: string }[]) {
  const groups: Record<string, typeof orders> = {};
  for (const o of orders) {
    const day = new Date(o.updated_at || o.created_at).toLocaleDateString('es-DO', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
    if (!groups[day]) groups[day] = [];
    groups[day].push(o);
  }
  return groups;
}

export default function EarningsPage() {
  const { user, orders, commissionPayments, confirmCommissionPayment, paidOrderIds } = useAppStore();
  const [showHelp, setShowHelp] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const myOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => o.assigned_delivery_id === user.id);
  }, [user, orders]);

  const completedOrders = myOrders.filter((o) => ['delivered', 'completed'].includes(o.status));
  const pendingOrders = completedOrders.filter((o) => !paidOrderIds.includes(o.id));
  const paidOrders = completedOrders.filter((o) => paidOrderIds.includes(o.id));

  const cashOrders = pendingOrders.filter((o) => o.payment_method === 'cash');
  const transferOrders = pendingOrders.filter((o) => o.payment_method !== 'cash');

  const cashCollected = cashOrders.reduce((s, o) => s + o.total, 0);
  const cashCommission = cashOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const transferCommission = transferOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const commissionTotal = cashCommission + transferCommission;
  const oweToStore = cashCollected - cashCommission;
  const storeOwes = transferCommission;
  const net = oweToStore - storeOwes;

  const paidAmount = paidOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0);

  const myPayments = useMemo(() => {
    if (!user) return [];
    return commissionPayments.filter((p) => p.delivery_user_id === user.id);
  }, [user, commissionPayments]);

  const unconfirmedPayments = myPayments.filter((p) => !p.confirmed_by_delivery);
  const dayGroups = groupByDay(pendingOrders as any);

  function toggleDay(key: string) {
    setExpandedDays((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Mis Ganancias</h2>
        <button onClick={() => setShowHelp(!showHelp)} className="p-2 hover:bg-bs-card rounded-xl transition-colors">
          <HelpCircle size={16} className="text-bs-text-muted" />
        </button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 space-y-3 text-xs text-bs-text-secondary">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={14} className="text-bs-accent" />
            <span className="font-bold text-bs-text">¿Cómo funciona el cuadre?</span>
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-bs-surface rounded-lg">
              <div className="font-semibold text-bs-text mb-1">💵 Efectivo</div>
              <p>Cobras el total al cliente. Te quedas con tu comisión (costo de envío) y entregas el resto a la tienda.</p>
            </div>
            <div className="p-2 bg-bs-surface rounded-lg">
              <div className="font-semibold text-bs-text mb-1">📱 Transfer / Prepago</div>
              <p>El dinero va directo a la tienda. La tienda te paga tu comisión en el cuadre.</p>
            </div>
            <div className="p-2 bg-bs-surface rounded-lg">
              <div className="font-semibold text-bs-text mb-1">⚖️ Cuadre</div>
              <p>Se restan ambos montos. Si debes más de lo que te deben, entregas la diferencia. Si te deben más, la tienda te paga.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Comisión pendiente"
          value={formatRD(commissionTotal)}
          icon={Clock}
          color="orange"
        />
        <StatCard
          label="Total cobrado"
          value={formatRD(paidAmount)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Entregas totales"
          value={completedOrders.length}
          icon={Package}
          color="accent"
        />
        <StatCard
          label="Total ganado"
          value={formatRD(commissionTotal + paidAmount)}
          icon={Banknote}
          color="cyan"
        />
      </div>

      {/* Cuadre Section */}
      {pendingOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">
            Cuadre pendiente ({pendingOrders.length} entregas)
          </h3>

          {/* Net Result Banner */}
          <div className={`p-4 rounded-xl border-2 text-center ${
            net > 0 ? 'bg-orange-500/10 border-orange-500/30' :
            net < 0 ? 'bg-cyan-500/10 border-cyan-500/30' :
            'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="text-xs text-bs-text-secondary mb-1">
              {net > 0 ? 'Debes entregar a tienda' : net < 0 ? 'La tienda te debe' : 'Cuadre neto'}
            </div>
            <div className={`text-2xl font-bold ${
              net > 0 ? 'text-bs-orange' : net < 0 ? 'text-bs-cyan' : 'text-bs-green'
            }`}>
              {formatRD(Math.abs(net))}
            </div>
            {net === 0 && (
              <div className="text-xs text-bs-green mt-1">Tu comisión cubre exactamente el efectivo</div>
            )}
          </div>

          {/* Breakdown */}
          <div className="bg-bs-card border border-bs-border rounded-xl p-3 space-y-2">
            {cashOrders.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-xs text-bs-text-secondary">
                  <ArrowDownRight size={12} className="text-bs-orange" />
                  <span className="font-semibold">Efectivo ({cashOrders.length} órdenes)</span>
                </div>
                <div className="pl-5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-bs-text-muted">Cobrado de clientes</span>
                    <span className="font-bold">{formatRD(cashCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bs-text-muted">Tu comisión (te quedas)</span>
                    <span className="font-bold text-bs-green">- {formatRD(cashCommission)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-bs-border">
                    <span className="font-semibold text-bs-orange">Entregas a tienda</span>
                    <span className="font-bold text-bs-orange">{formatRD(oweToStore)}</span>
                  </div>
                </div>
              </>
            )}

            {transferOrders.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-xs text-bs-text-secondary mt-3">
                  <ArrowUpRight size={12} className="text-bs-cyan" />
                  <span className="font-semibold">Transfer/Prepago ({transferOrders.length} órdenes)</span>
                </div>
                <div className="pl-5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-bs-text-muted">Tu comisión pendiente</span>
                    <span className="font-bold text-bs-cyan">{formatRD(storeOwes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bs-text-muted">Tienda te paga</span>
                    <span className="font-bold text-bs-cyan">{formatRD(storeOwes)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Order detail by day */}
          <div className="space-y-2">
            {Object.entries(dayGroups).map(([day, dayOrders]) => {
              const dayKey = day;
              const isExpanded = expandedDays[dayKey] ?? false;
              const dayTotal = dayOrders.reduce((s, o: any) => s + o.total, 0);
              const dayFees = dayOrders.reduce((s, o: any) => s + (o.delivery_fee || 0), 0);
              return (
                <div key={day}>
                  <button
                    onClick={() => toggleDay(dayKey)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-bs-card border border-bs-border rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{day}</span>
                      <Badge variant="blue">{(dayOrders as any[]).length}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-bs-green">{formatRD(dayFees)}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-1 pl-2">
                      {(dayOrders as any[]).map((o) => (
                        <div key={o.id} className="flex items-center justify-between px-3 py-2 border-l-2 border-bs-border">
                          <div>
                            <div className="text-[11px] font-medium">{o.customer?.phone} — {o.customer?.name}</div>
                            <div className="text-[9px] text-bs-text-muted">
                              {o.payment_method === 'cash' ? '💵 Efectivo' : '📱 Transfer'}
                              {' · '}Total: {formatRD(o.total)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-bold text-bs-green">{formatRD(o.delivery_fee || 0)}</div>
                            {o.payment_method === 'cash' && (
                              <div className="text-[9px] text-bs-orange">Devolver: {formatRD(o.total - (o.delivery_fee || 0))}</div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between px-3 py-1.5 text-[10px] border-t border-bs-border">
                        <span className="text-bs-text-muted">Subtotal día:</span>
                        <span className="font-bold">Comisión: {formatRD(dayFees)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payments awaiting confirmation */}
      {unconfirmedPayments.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-bs-orange uppercase tracking-wider mb-3">
            Cuadres por confirmar ({unconfirmedPayments.length})
          </h3>
          <div className="space-y-2">
            {unconfirmedPayments.map((p) => (
              <Card key={p.id} highlight="orange">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Cuadre realizado</div>
                      <div className="text-xs text-bs-text-muted">
                        {new Date(p.paid_at).toLocaleDateString('es-DO', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })} · {p.orders_paid.length} entregas · por {p.paid_by}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-bs-green">{formatRD(p.amount)}</span>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    className="w-full"
                    onClick={() => confirmCommissionPayment(p.id)}
                  >
                    <ThumbsUp size={14} />
                    Confirmar cuadre de {formatRD(p.amount)}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingOrders.length === 0 && unconfirmedPayments.length === 0 && (
        <div className="flex items-center gap-2 bg-bs-green/10 rounded-xl p-3">
          <CheckCircle size={16} className="text-bs-green" />
          <span className="text-sm text-bs-green font-medium">Todo cuadrado — sin pendientes</span>
        </div>
      )}

      {/* Payment History */}
      {myPayments.filter((p) => p.confirmed_by_delivery).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            Historial de cuadres
          </h3>
          <div className="space-y-2">
            {myPayments.filter((p) => p.confirmed_by_delivery).map((p) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {new Date(p.paid_at).toLocaleDateString('es-DO', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-bs-text-muted">
                      {p.orders_paid.length} entregas · por {p.paid_by}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="success">{formatRD(p.amount)}</Badge>
                    <CheckCircle size={14} className="text-bs-green" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
