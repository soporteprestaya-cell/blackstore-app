'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { DEMO_USERS } from '@/lib/demo-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatRD, formatDate } from '@/lib/utils';
import type { CommissionPayment, Order } from '@/lib/types';
import {
  Truck, Star, Phone, UserPlus, DollarSign, CheckCircle,
  History, ChevronDown, ChevronUp, Banknote, AlertTriangle,
  HelpCircle, Package, ArrowDownRight, ArrowUpRight, Minus,
} from 'lucide-react';

function groupByDay(orders: Order[]) {
  const groups: Record<string, Order[]> = {};
  for (const o of orders) {
    const day = new Date(o.updated_at || o.created_at).toLocaleDateString('es-DO', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
    if (!groups[day]) groups[day] = [];
    groups[day].push(o);
  }
  return groups;
}

export default function DeliveriesPage() {
  const { orders, commissionPayments, addCommissionPayment, addNotification, paidOrderIds, markOrdersCommissionPaid, user, teamMembers, deliveryOnline } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [cuadreUserId, setCuadreUserId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const allUsers = [...DEMO_USERS, ...teamMembers.filter((m) => !DEMO_USERS.some((d) => d.id === m.id))];
  const deliveryUsers = allUsers.filter((u) => u.role === 'delivery');

  const cuadreData = useMemo(() => {
    const map: Record<string, {
      cashOrders: Order[];
      transferOrders: Order[];
      cashCollected: number;
      commissionTotal: number;
      oweToStore: number;
      storeOwes: number;
      net: number;
      netLabel: string;
      allOrderIds: string[];
    }> = {};

    for (const u of deliveryUsers) {
      const unpaid = orders.filter(
        (o) =>
          o.assigned_delivery_id === u.id &&
          ['delivered', 'completed'].includes(o.status) &&
          !paidOrderIds.includes(o.id)
      );

      const cashOrders = unpaid.filter((o) => o.payment_method === 'cash');
      const transferOrders = unpaid.filter((o) => o.payment_method !== 'cash');

      const cashCollected = cashOrders.reduce((s, o) => s + o.total, 0);
      const cashCommission = cashOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0);
      const transferCommission = transferOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0);
      const commissionTotal = cashCommission + transferCommission;

      const oweToStore = cashCollected - cashCommission;
      const storeOwes = transferCommission;
      const net = oweToStore - storeOwes;

      map[u.id] = {
        cashOrders,
        transferOrders,
        cashCollected,
        commissionTotal,
        oweToStore,
        storeOwes,
        net,
        netLabel: net > 0 ? 'Delivery debe a tienda' : net < 0 ? 'Tienda debe a delivery' : 'Cuadrado',
        allOrderIds: unpaid.map((o) => o.id),
      };
    }
    return map;
  }, [deliveryUsers, orders, paidOrderIds]);

  function handleCuadre(deliveryUserId: string) {
    const data = cuadreData[deliveryUserId];
    if (!data || data.allOrderIds.length === 0) return;

    const deliveryUser = deliveryUsers.find((u) => u.id === deliveryUserId);
    const payment: CommissionPayment = {
      id: `cp-${Date.now()}`,
      delivery_user_id: deliveryUserId,
      delivery_user_name: deliveryUser?.name || '',
      amount: data.commissionTotal,
      orders_paid: data.allOrderIds,
      paid_at: new Date().toISOString(),
      paid_by: user?.name || 'Admin',
      confirmed_by_delivery: false,
    };

    addCommissionPayment(payment);
    markOrdersCommissionPaid(data.allOrderIds);

    addNotification({
      id: `n_cuadre_${Date.now()}`,
      user_id: deliveryUserId,
      type: 'payment_confirmed',
      message: `Cuadre realizado: comisión ${formatRD(data.commissionTotal)} por ${data.allOrderIds.length} entregas. ${data.net > 0 ? `Entregaste ${formatRD(data.net)} a tienda.` : data.net < 0 ? `Tienda te pagó ${formatRD(Math.abs(data.net))}.` : 'Todo cuadrado.'}`,
      read: false,
      created_at: new Date().toISOString(),
    });

    setCuadreUserId(null);
  }

  function toggleDay(key: string) {
    setExpandedDays((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const totalNet = Object.values(cuadreData).reduce((s, d) => s + d.net, 0);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Equipo Delivery</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-bs-card rounded-xl transition-colors">
            <HelpCircle size={16} className="text-bs-text-muted" />
          </button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} />
            Agregar
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-green">{deliveryUsers.filter((u) => deliveryOnline[u.id]).length}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Conectados</div>
        </div>
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${totalNet > 0 ? 'text-bs-orange' : totalNet < 0 ? 'text-bs-accent' : 'text-bs-green'}`}>
            {formatRD(Math.abs(totalNet))}
          </div>
          <div className="text-[9px] text-bs-text-muted uppercase">
            {totalNet > 0 ? 'Te deben' : totalNet < 0 ? 'Debes pagar' : 'Cuadrado'}
          </div>
        </div>
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-accent">{formatRD(commissionPayments.reduce((s, p) => s + p.amount, 0))}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Pagado total</div>
        </div>
      </div>

      {/* Delivery List */}
      <div className="space-y-3">
        {deliveryUsers.map((dUser) => {
          const data = cuadreData[dUser.id];
          const activeOrders = orders.filter(
            (o) => o.assigned_delivery_id === dUser.id && !['completed', 'cancelled', 'delivered'].includes(o.status)
          );
          const isExpanded = expandedUser === dUser.id;
          const dayGroups = groupByDay([...data.cashOrders, ...data.transferOrders]);

          return (
            <Card key={dUser.id}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${dUser.is_active ? 'bg-bs-green/15' : 'bg-bs-border/50'}`}>
                  <Truck size={20} className={dUser.is_active ? 'text-bs-green' : 'text-bs-text-muted'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold">{dUser.name}</span>
                    {deliveryOnline[dUser.id] ? (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-bs-green animate-pulse" />
                        <span className="text-[9px] text-bs-green font-semibold">ACTIVO</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-bs-text-muted font-semibold">INACTIVO</span>
                    )}
                  </div>
                  <div className="text-xs text-bs-text-muted mb-2">{dUser.phone}</div>

                  {/* Cuadre Summary */}
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="bg-bs-surface px-2 py-1.5 rounded-lg text-center">
                      <div className="text-xs font-bold text-bs-accent">{activeOrders.length}</div>
                      <div className="text-[8px] text-bs-text-muted">En ruta</div>
                    </div>
                    <div className="bg-bs-surface px-2 py-1.5 rounded-lg text-center">
                      <div className="text-xs font-bold text-bs-cyan">{formatRD(data.commissionTotal)}</div>
                      <div className="text-[8px] text-bs-text-muted">Comisión</div>
                    </div>
                    <div className="bg-bs-surface px-2 py-1.5 rounded-lg text-center">
                      <div className={`text-xs font-bold ${data.net > 0 ? 'text-bs-orange' : data.net < 0 ? 'text-bs-red' : 'text-bs-green'}`}>
                        {data.net === 0 ? '✓' : formatRD(Math.abs(data.net))}
                      </div>
                      <div className="text-[8px] text-bs-text-muted">
                        {data.net > 0 ? 'Debe' : data.net < 0 ? 'Se le debe' : 'Cuadrado'}
                      </div>
                    </div>
                  </div>

                  {/* Cash breakdown */}
                  {data.cashOrders.length > 0 && (
                    <div className="text-[10px] text-bs-text-muted mb-1">
                      Efectivo cobrado: <strong className="text-bs-text">{formatRD(data.cashCollected)}</strong>
                      {' — '}Comisión: <strong className="text-bs-green">{formatRD(data.cashOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0))}</strong>
                      {' — '}Entrega: <strong className="text-bs-orange">{formatRD(data.oweToStore)}</strong>
                    </div>
                  )}
                  {data.transferOrders.length > 0 && (
                    <div className="text-[10px] text-bs-text-muted mb-2">
                      Transfer/Prepago: <strong className="text-bs-accent">{data.transferOrders.length} orden(es)</strong>
                      {' — '}Comisión pendiente: <strong className="text-bs-cyan">{formatRD(data.storeOwes)}</strong>
                    </div>
                  )}

                  {/* Cuadre Button */}
                  {data.allOrderIds.length > 0 && (
                    <Button
                      size="sm"
                      variant={data.net > 0 ? 'warning' : 'success'}
                      className="w-full"
                      onClick={() => setCuadreUserId(dUser.id)}
                    >
                      <Banknote size={14} />
                      Realizar Cuadre ({data.allOrderIds.length} entregas)
                    </Button>
                  )}

                  {data.allOrderIds.length === 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-bs-green">
                      <CheckCircle size={12} />
                      <span>Todo cuadrado</span>
                    </div>
                  )}

                  {/* Expandable order detail */}
                  {data.allOrderIds.length > 0 && (
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : dUser.id)}
                      className="flex items-center gap-1 text-[10px] text-bs-text-muted hover:text-bs-text-secondary mt-2 transition-colors"
                    >
                      <Package size={10} />
                      <span>Ver {data.allOrderIds.length} órdenes pendientes</span>
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}

                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      {Object.entries(dayGroups).map(([day, dayOrders]) => {
                        const dayKey = `${dUser.id}_${day}`;
                        const dayExpanded = expandedDays[dayKey] ?? true;
                        const dayTotal = dayOrders.reduce((s, o) => s + o.total, 0);
                        const dayFees = dayOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0);
                        return (
                          <div key={day}>
                            <button
                              onClick={() => toggleDay(dayKey)}
                              className="w-full flex items-center justify-between px-2 py-1.5 bg-bs-surface rounded-lg"
                            >
                              <span className="text-[10px] font-semibold text-bs-text-secondary">{day} — {dayOrders.length} orden(es)</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-bs-text">{formatRD(dayTotal)}</span>
                                {dayExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                              </div>
                            </button>
                            {dayExpanded && (
                              <div className="mt-1 space-y-1 pl-2">
                                {dayOrders.map((o) => (
                                  <div key={o.id} className="flex items-center justify-between px-2 py-1.5 border-l-2 border-bs-border">
                                    <div>
                                      <div className="text-[11px] font-medium">
                                        <a href={`https://wa.me/1${o.customer?.phone?.replace(/\D/g, '') || ''}`} target="_blank" className="text-bs-accent hover:underline font-bold">{o.customer?.phone}</a>
                                        {' — '}<span className="text-bs-text-muted">{o.customer?.name}</span>
                                      </div>
                                      <div className="text-[9px] text-bs-text-muted">
                                        {o.payment_method === 'cash' ? '💵 Efectivo' : o.payment_method === 'transfer' ? '📱 Transfer' : '✅ Prepago'}
                                        {' · '}Total: {formatRD(o.total)} · Comisión: {formatRD(o.delivery_fee || 0)}
                                      </div>
                                    </div>
                                    {o.payment_method === 'cash' && (
                                      <span className="text-[9px] font-bold text-bs-orange">{formatRD(o.total - (o.delivery_fee || 0))}</span>
                                    )}
                                  </div>
                                ))}
                                <div className="flex justify-between px-2 py-1 text-[10px] border-t border-bs-border">
                                  <span className="text-bs-text-muted">Subtotal día:</span>
                                  <span className="font-bold">Total: {formatRD(dayTotal)} · Comisión: {formatRD(dayFees)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Payment history toggle */}
                  {commissionPayments.filter((p) => p.delivery_user_id === dUser.id).length > 0 && (
                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-1 text-[10px] text-bs-text-muted hover:text-bs-text-secondary mt-1 transition-colors"
                    >
                      <History size={10} />
                      <span>Historial de cuadres</span>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Global History */}
      {commissionPayments.length > 0 && (
        <Button variant="ghost" className="w-full" onClick={() => setShowHistory(true)}>
          <History size={14} />
          Historial completo ({commissionPayments.length} cuadres)
        </Button>
      )}

      {/* Cuadre Confirmation Modal */}
      <Modal
        open={!!cuadreUserId}
        onClose={() => setCuadreUserId(null)}
        title="Realizar Cuadre"
      >
        {cuadreUserId && (() => {
          const dUser = deliveryUsers.find((u) => u.id === cuadreUserId);
          const data = cuadreData[cuadreUserId];
          return (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 mx-auto bg-bs-green/15 rounded-full flex items-center justify-center mb-2">
                  <Truck size={24} className="text-bs-green" />
                </div>
                <h3 className="text-sm font-bold">{dUser?.name}</h3>
                <p className="text-[11px] text-bs-text-muted">{data.allOrderIds.length} entregas pendientes de cuadre</p>
              </div>

              <div className="bg-bs-surface rounded-xl p-3 space-y-2">
                {data.cashOrders.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-bs-text-secondary mb-1">
                      <ArrowDownRight size={12} className="text-bs-orange" />
                      <span className="font-semibold">Efectivo ({data.cashOrders.length} órdenes)</span>
                    </div>
                    <div className="flex justify-between text-xs pl-5">
                      <span className="text-bs-text-muted">Cobrado de clientes</span>
                      <span className="font-bold">{formatRD(data.cashCollected)}</span>
                    </div>
                    <div className="flex justify-between text-xs pl-5">
                      <span className="text-bs-text-muted">Su comisión (se queda)</span>
                      <span className="font-bold text-bs-green">- {formatRD(data.cashOrders.reduce((s, o) => s + (o.delivery_fee || 0), 0))}</span>
                    </div>
                    <div className="flex justify-between text-xs pl-5 pt-1 border-t border-bs-border">
                      <span className="font-semibold text-bs-orange">Debe entregar a tienda</span>
                      <span className="font-bold text-bs-orange">{formatRD(data.oweToStore)}</span>
                    </div>
                  </>
                )}

                {data.transferOrders.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-bs-text-secondary mt-3 mb-1">
                      <ArrowUpRight size={12} className="text-bs-cyan" />
                      <span className="font-semibold">Transfer/Prepago ({data.transferOrders.length} órdenes)</span>
                    </div>
                    <div className="flex justify-between text-xs pl-5">
                      <span className="text-bs-text-muted">Comisión pendiente</span>
                      <span className="font-bold text-bs-cyan">{formatRD(data.storeOwes)}</span>
                    </div>
                    <div className="flex justify-between text-xs pl-5">
                      <span className="text-bs-text-muted">Tienda debe pagar</span>
                      <span className="font-bold text-bs-cyan">{formatRD(data.storeOwes)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* NET RESULT */}
              <div className={`p-4 rounded-xl border-2 text-center ${
                data.net > 0 ? 'bg-orange-500/10 border-orange-500/30' :
                data.net < 0 ? 'bg-cyan-500/10 border-cyan-500/30' :
                'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="text-xs text-bs-text-secondary mb-1">
                  {data.net > 0 ? 'Delivery entrega a tienda' : data.net < 0 ? 'Tienda paga a delivery' : 'Cuadre neto'}
                </div>
                <div className={`text-2xl font-bold ${
                  data.net > 0 ? 'text-bs-orange' : data.net < 0 ? 'text-bs-cyan' : 'text-bs-green'
                }`}>
                  {formatRD(Math.abs(data.net))}
                </div>
                {data.net === 0 && (
                  <div className="text-xs text-bs-green mt-1">La comisión cubre exactamente el efectivo</div>
                )}
              </div>

              {/* Order list in modal */}
              <details className="text-xs">
                <summary className="cursor-pointer text-bs-text-muted hover:text-bs-text-secondary py-1">
                  Ver detalle de {data.allOrderIds.length} órdenes
                </summary>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {[...data.cashOrders, ...data.transferOrders].map((o) => (
                    <div key={o.id} className="flex justify-between px-2 py-1.5 bg-bs-surface rounded-lg">
                      <div>
                        <a href={`https://wa.me/1${o.customer?.phone?.replace(/\D/g, '') || ''}`} target="_blank" className="font-bold text-bs-accent hover:underline">{o.customer?.phone}</a>
                        <span className="text-bs-text-muted ml-1">— {o.customer?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{o.payment_method === 'cash' ? '💵' : '📱'}</span>
                        <span className="font-bold">{formatRD(o.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setCuadreUserId(null)}>
                  Cancelar
                </Button>
                <Button variant="success" onClick={() => handleCuadre(cuadreUserId)}>
                  <CheckCircle size={14} />
                  Confirmar Cuadre
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* History Modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Historial de Cuadres">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {commissionPayments.length === 0 ? (
            <p className="text-sm text-bs-text-muted text-center py-4">Sin cuadres registrados</p>
          ) : (
            commissionPayments.map((p) => (
              <div key={p.id} className="bg-bs-surface rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{p.delivery_user_name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="success">{formatRD(p.amount)}</Badge>
                    {p.confirmed_by_delivery ? (
                      <Badge variant="success">Confirmado</Badge>
                    ) : (
                      <Badge variant="warning">Pendiente</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-bs-text-muted">
                  <span>
                    {new Date(p.paid_at).toLocaleDateString('es-DO', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span>{p.orders_paid.length} entregas · por {p.paid_by}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal open={showHelp} onClose={() => setShowHelp(false)} title="¿Cómo funciona el cuadre?">
        <div className="space-y-4 text-xs text-bs-text-secondary">
          <div className="p-3 bg-bs-surface rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-orange-500/15 flex items-center justify-center">
                <span className="text-sm">💵</span>
              </div>
              <span className="font-bold text-bs-text">Órdenes en efectivo</span>
            </div>
            <p>El delivery cobra el <strong>total</strong> al cliente. Se queda con su <strong>comisión</strong> (costo de envío) y entrega la <strong>diferencia</strong> a la tienda.</p>
            <div className="mt-2 bg-bs-bg p-2 rounded-lg text-[11px]">
              <div>Ejemplo: Total RD$2,500 · Envío RD$200</div>
              <div className="text-bs-green">Delivery se queda: RD$200</div>
              <div className="text-bs-orange">Entrega a tienda: RD$2,300</div>
            </div>
          </div>

          <div className="p-3 bg-bs-surface rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-cyan-500/15 flex items-center justify-center">
                <span className="text-sm">📱</span>
              </div>
              <span className="font-bold text-bs-text">Transferencias / Prepago</span>
            </div>
            <p>El dinero ya llegó a la cuenta de la tienda. La tienda le <strong>debe la comisión</strong> al delivery.</p>
            <div className="mt-2 bg-bs-bg p-2 rounded-lg text-[11px]">
              <div>Ejemplo: Total RD$2,500 · Envío RD$200</div>
              <div className="text-bs-cyan">Tienda paga al delivery: RD$200</div>
            </div>
          </div>

          <div className="p-3 bg-bs-surface rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center">
                <Minus size={14} className="text-bs-green" />
              </div>
              <span className="font-bold text-bs-text">Cuadre neto</span>
            </div>
            <p>Se restan ambos montos. Si el delivery tiene efectivo Y transferencias:</p>
            <div className="mt-2 bg-bs-bg p-2 rounded-lg text-[11px]">
              <div>Efectivo: debe entregar RD$2,300</div>
              <div>Transfer: tienda le debe RD$400</div>
              <div className="font-bold text-bs-orange mt-1">Neto: delivery entrega RD$1,900</div>
            </div>
          </div>

          <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
            <span className="font-bold text-bs-green">Al confirmar el cuadre:</span>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Se marcan todas las órdenes como liquidadas</li>
              <li>El delivery recibe notificación con el resumen</li>
              <li>El delivery debe confirmar que recibió/entregó el monto</li>
              <li>Queda registrado en el historial</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Agregar Delivery">
        <div className="space-y-3">
          <input placeholder="Nombre completo" className="w-full" />
          <input placeholder="Teléfono" type="tel" className="w-full" />
          <input placeholder="PIN de acceso" type="password" className="w-full" />
          <Button variant="success" size="lg" className="w-full" onClick={() => setShowAdd(false)}>
            <UserPlus size={16} />
            Registrar Delivery
          </Button>
        </div>
      </Modal>
    </div>
  );
}
