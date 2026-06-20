'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { DEMO_USERS, DEMO_ORDERS } from '@/lib/demo-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatRD } from '@/lib/utils';
import type { CommissionPayment } from '@/lib/types';
import {
  Truck, Star, Phone, UserPlus, DollarSign, CheckCircle,
  History, ChevronDown, ChevronUp, Banknote,
} from 'lucide-react';

const COMMISSION_PER_DELIVERY = 150;

export default function DeliveriesPage() {
  const { commissionPayments, addCommissionPayment, paidOrderIds, markOrdersCommissionPaid, user } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [payingUserId, setPayingUserId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const deliveryUsers = DEMO_USERS.filter((u) => u.role === 'delivery');

  const allOrders = DEMO_ORDERS;

  const pendingCommissions = useMemo(() => {
    const map: Record<string, { orderIds: string[]; amount: number; count: number }> = {};
    for (const u of deliveryUsers) {
      const unpaidOrders = allOrders.filter(
        (o) =>
          o.assigned_delivery_id === u.id &&
          ['delivered', 'completed'].includes(o.status) &&
          !paidOrderIds.includes(o.id)
      );
      map[u.id] = {
        orderIds: unpaidOrders.map((o) => o.id),
        amount: unpaidOrders.length * COMMISSION_PER_DELIVERY,
        count: unpaidOrders.length,
      };
    }
    return map;
  }, [deliveryUsers, allOrders, paidOrderIds]);

  function handlePayCommission(deliveryUserId: string) {
    const pending = pendingCommissions[deliveryUserId];
    if (!pending || pending.count === 0) return;

    const deliveryUser = deliveryUsers.find((u) => u.id === deliveryUserId);
    const payment: CommissionPayment = {
      id: `cp-${Date.now()}`,
      delivery_user_id: deliveryUserId,
      delivery_user_name: deliveryUser?.name || '',
      amount: pending.amount,
      orders_paid: pending.orderIds,
      paid_at: new Date().toISOString(),
      paid_by: user?.name || 'Admin',
    };

    addCommissionPayment(payment);
    markOrdersCommissionPaid(pending.orderIds);
    setPayingUserId(null);
  }

  const totalPending = Object.values(pendingCommissions).reduce((s, p) => s + p.amount, 0);
  const totalPaid = commissionPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Equipo Delivery</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <UserPlus size={14} />
          Agregar
        </Button>
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-green">{deliveryUsers.filter((u) => u.is_active).length}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Activos</div>
        </div>
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-orange">{formatRD(totalPending)}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Pendiente</div>
        </div>
        <div className="bg-bs-card border border-bs-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-bs-accent">{formatRD(totalPaid)}</div>
          <div className="text-[9px] text-bs-text-muted uppercase">Pagado</div>
        </div>
      </div>

      {/* Delivery List with Commissions */}
      <div className="space-y-3">
        {deliveryUsers.map((dUser) => {
          const pending = pendingCommissions[dUser.id];
          const activeOrders = allOrders.filter(
            (o) => o.assigned_delivery_id === dUser.id && !['completed', 'cancelled'].includes(o.status)
          );
          const isExpanded = expandedUser === dUser.id;
          const userPayments = commissionPayments.filter((p) => p.delivery_user_id === dUser.id);

          return (
            <Card key={dUser.id}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${dUser.is_active ? 'bg-bs-green/15' : 'bg-bs-border/50'}`}>
                  <Truck size={20} className={dUser.is_active ? 'text-bs-green' : 'text-bs-text-muted'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold">{dUser.name}</span>
                    {dUser.is_active ? (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-bs-green animate-pulse" />
                        <span className="text-[9px] text-bs-green font-semibold">ACTIVO</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-bs-text-muted font-semibold">INACTIVO</span>
                    )}
                  </div>
                  <div className="text-xs text-bs-text-muted mb-2">{dUser.phone}</div>

                  {/* Commission Info */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-bs-surface px-2 py-1.5 rounded-lg text-center">
                      <div className="text-xs font-bold text-bs-accent">{activeOrders.length}</div>
                      <div className="text-[8px] text-bs-text-muted">En ruta</div>
                    </div>
                    <div className="bg-bs-surface px-2 py-1.5 rounded-lg text-center">
                      <div className={`text-xs font-bold ${pending.amount > 0 ? 'text-bs-orange' : 'text-bs-green'}`}>
                        {formatRD(pending.amount)}
                      </div>
                      <div className="text-[8px] text-bs-text-muted">
                        {pending.count} {pending.count === 1 ? 'entrega' : 'entregas'} pend.
                      </div>
                    </div>
                  </div>

                  {/* Pay Button */}
                  {pending.count > 0 && (
                    <Button
                      size="sm"
                      variant="success"
                      className="w-full"
                      onClick={() => setPayingUserId(dUser.id)}
                    >
                      <Banknote size={14} />
                      Pagar {formatRD(pending.amount)}
                    </Button>
                  )}

                  {pending.count === 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-bs-green">
                      <CheckCircle size={12} />
                      <span>Comisiones al día</span>
                    </div>
                  )}

                  {/* Toggle History */}
                  {userPayments.length > 0 && (
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : dUser.id)}
                      className="flex items-center gap-1 text-[10px] text-bs-text-muted hover:text-bs-text-secondary mt-2 transition-colors"
                    >
                      <History size={10} />
                      <span>{userPayments.length} pagos realizados</span>
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}

                  {/* Payment History for this user */}
                  {isExpanded && userPayments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {userPayments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-bs-surface px-2 py-1.5 rounded-lg">
                          <div>
                            <div className="text-[10px] text-bs-text-secondary">
                              {new Date(p.paid_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-[9px] text-bs-text-muted">
                              {p.orders_paid.length} entregas · por {p.paid_by}
                            </div>
                          </div>
                          <Badge variant="success">{formatRD(p.amount)}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold">4.8</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Global History Button */}
      {commissionPayments.length > 0 && (
        <Button variant="ghost" className="w-full" onClick={() => setShowHistory(true)}>
          <History size={14} />
          Historial completo de pagos ({commissionPayments.length})
        </Button>
      )}

      {/* Pay Confirmation Modal */}
      <Modal
        open={!!payingUserId}
        onClose={() => setPayingUserId(null)}
        title="Confirmar Pago de Comisión"
      >
        {payingUserId && (() => {
          const dUser = deliveryUsers.find((u) => u.id === payingUserId);
          const pending = pendingCommissions[payingUserId];
          return (
            <div className="space-y-4">
              <div className="bg-bs-surface rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-bs-text-secondary">Delivery:</span>
                  <span className="font-bold">{dUser?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-bs-text-secondary">Entregas:</span>
                  <span className="font-bold">{pending.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-bs-text-secondary">Comisión por entrega:</span>
                  <span>{formatRD(COMMISSION_PER_DELIVERY)}</span>
                </div>
                <div className="border-t border-bs-border pt-2 flex justify-between">
                  <span className="text-sm font-bold">Total a pagar:</span>
                  <span className="text-lg font-bold text-bs-green">{formatRD(pending.amount)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setPayingUserId(null)}>
                  Cancelar
                </Button>
                <Button variant="success" onClick={() => handlePayCommission(payingUserId)}>
                  <CheckCircle size={14} />
                  Confirmar Pago
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Full History Modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Historial de Pagos">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {commissionPayments.length === 0 ? (
            <p className="text-sm text-bs-text-muted text-center py-4">Sin pagos registrados</p>
          ) : (
            commissionPayments.map((p) => (
              <div key={p.id} className="bg-bs-surface rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{p.delivery_user_name}</span>
                  <Badge variant="success">{formatRD(p.amount)}</Badge>
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

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Agregar Delivery">
        <div className="space-y-3">
          <input placeholder="Nombre completo" className="w-full" />
          <input placeholder="Teléfono" type="tel" className="w-full" />
          <input placeholder="PIN de acceso" type="password" className="w-full" />
          <div>
            <label className="text-xs text-bs-text-secondary mb-1 block">Comisión por entrega</label>
            <input placeholder="RD$ 150" type="number" className="w-full" />
          </div>
          <Button variant="success" size="lg" className="w-full" onClick={() => setShowAdd(false)}>
            <UserPlus size={16} />
            Registrar Delivery
          </Button>
        </div>
      </Modal>
    </div>
  );
}
