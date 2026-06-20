'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRD } from '@/lib/utils';
import { DEMO_ORDERS } from '@/lib/demo-data';
import { DollarSign, Package, CheckCircle, Clock, Banknote } from 'lucide-react';

const COMMISSION_PER_DELIVERY = 150;

export default function EarningsPage() {
  const { user, commissionPayments, paidOrderIds } = useAppStore();

  const myOrders = useMemo(() => {
    if (!user) return [];
    return DEMO_ORDERS.filter((o) => o.assigned_delivery_id === user.id);
  }, [user]);

  const completedOrders = myOrders.filter((o) => ['delivered', 'completed'].includes(o.status));
  const pendingOrders = completedOrders.filter((o) => !paidOrderIds.includes(o.id));
  const paidOrders = completedOrders.filter((o) => paidOrderIds.includes(o.id));

  const pendingAmount = pendingOrders.length * COMMISSION_PER_DELIVERY;
  const paidAmount = paidOrders.length * COMMISSION_PER_DELIVERY;

  const myPayments = useMemo(() => {
    if (!user) return [];
    return commissionPayments.filter((p) => p.delivery_user_id === user.id);
  }, [user, commissionPayments]);

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold">Mis Ganancias</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Pendiente"
          value={formatRD(pendingAmount)}
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
          label="Comisión/entrega"
          value={formatRD(COMMISSION_PER_DELIVERY)}
          icon={Banknote}
          color="cyan"
        />
      </div>

      {/* Pending Section */}
      {pendingOrders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
            Comisiones pendientes ({pendingOrders.length})
          </h3>
          <div className="space-y-2">
            {pendingOrders.map((order) => (
              <Card key={order.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{order.order_number}</div>
                    <div className="text-xs text-bs-text-muted">{order.customer?.name}</div>
                  </div>
                  <Badge variant="warning">{formatRD(COMMISSION_PER_DELIVERY)}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendingOrders.length === 0 && (
        <div className="flex items-center gap-2 bg-bs-green/10 rounded-xl p-3">
          <CheckCircle size={16} className="text-bs-green" />
          <span className="text-sm text-bs-green font-medium">Todas las comisiones al día</span>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h3 className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3">
          Historial de pagos
        </h3>
        {myPayments.length === 0 ? (
          <p className="text-sm text-bs-text-muted text-center py-4">Sin pagos registrados aún</p>
        ) : (
          <div className="space-y-2">
            {myPayments.map((p) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {new Date(p.paid_at).toLocaleDateString('es-DO', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-bs-text-muted">
                      {p.orders_paid.length} entregas · pagado por {p.paid_by}
                    </div>
                  </div>
                  <Badge variant="success">{formatRD(p.amount)}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
