'use client';

import { useState, useMemo } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { formatRD, cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
  DollarSign, Package, Truck, TrendingUp,
  Clock, CheckCircle, XCircle, BarChart3,
} from 'lucide-react';

const periods = ['Hoy', 'Semana', 'Mes', 'Todo'];
const dayLabels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

function startOf(period: number): Date {
  const now = new Date();
  if (period === 0) return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 2) return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(0);
}

export default function ReportsPage() {
  const { orders, commissionPayments } = useAppStore();
  const [period, setPeriod] = useState(0);

  const filtered = useMemo(() => {
    const from = startOf(period);
    return orders.filter((o) => new Date(o.created_at) >= from && o.status !== 'cancelled');
  }, [orders, period]);

  const totalSales = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = filtered.length;
  const delivered = filtered.filter((o) => ['delivered', 'completed'].includes(o.status));
  const totalDeliveries = delivered.length;
  const avgTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const cancelled = orders.filter((o) => {
    const from = startOf(period);
    return new Date(o.created_at) >= from && o.status === 'cancelled';
  });
  const cancelRate = totalOrders + cancelled.length > 0
    ? ((cancelled.length / (totalOrders + cancelled.length)) * 100).toFixed(1)
    : '0';
  const tryFitReturns = filtered.filter((o) => o.type === 'try_fit' && o.items.some((i) => i.kept === false)).length;

  const cashOrders = filtered.filter((o) => o.payment_method === 'cash');
  const transferOrders = filtered.filter((o) => o.payment_method === 'transfer');
  const prepaidOrders = filtered.filter((o) => o.payment_method === 'prepaid');
  const cashTotal = cashOrders.reduce((s, o) => s + (o.total || 0), 0);
  const transferTotal = transferOrders.reduce((s, o) => s + (o.total || 0), 0);
  const prepaidTotal = prepaidOrders.reduce((s, o) => s + (o.total || 0), 0);

  const dailyData = useMemo(() => {
    if (period > 1) return [];
    const days: { label: string; value: number }[] = [];
    const now = new Date();
    const numDays = period === 0 ? 1 : 7;
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOrders = orders.filter((o) => o.created_at.slice(0, 10) === dateStr && o.status !== 'cancelled');
      const dayTotal = dayOrders.reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label: dayLabels[d.getDay()], value: dayTotal });
    }
    return days;
  }, [orders, period]);

  const maxVal = dailyData.length > 0 ? Math.max(...dailyData.map((d) => d.value), 1) : 1;

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; sold: number; revenue: number }> = {};
    for (const o of filtered) {
      for (const item of o.items) {
        const key = item.product_name || 'Sin nombre';
        if (!map[key]) map[key] = { name: key, sold: 0, revenue: 0 };
        map[key].sold += item.quantity;
        map[key].revenue += item.quantity * item.unit_price;
      }
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered]);

  const totalCommissions = useMemo(() => {
    const from = startOf(period);
    return commissionPayments
      .filter((p) => new Date(p.paid_at) >= from)
      .reduce((s, p) => s + p.amount, 0);
  }, [commissionPayments, period]);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Reportes</h2>
        <div className="flex gap-1 bg-bs-card rounded-xl p-0.5 border border-bs-border">
          {periods.map((p, i) => (
            <button
              key={p}
              onClick={() => setPeriod(i)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                period === i ? 'bg-bs-accent text-white' : 'text-bs-text-muted'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ventas totales" value={formatRD(totalSales)} icon={DollarSign} color="green" />
        <StatCard label="Ordenes" value={totalOrders} icon={Package} color="accent" />
        <StatCard label="Entregas" value={totalDeliveries} icon={Truck} color="cyan" />
        <StatCard label="Ticket promedio" value={formatRD(avgTicket)} icon={TrendingUp} color="orange" />
      </div>

      {dailyData.length > 1 && (
        <Card>
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-4 block">
            Ventas por dia
          </span>
          <div className="flex items-end gap-2 h-32">
            {dailyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-bs-text-muted">
                  {day.value > 0 ? formatRD(day.value / 1000) + 'K' : '0'}
                </span>
                <div
                  className="w-full bg-bs-accent/20 rounded-t-lg relative overflow-hidden"
                  style={{ height: `${Math.max((day.value / maxVal) * 100, 2)}%` }}
                >
                  <div className="absolute bottom-0 left-0 right-0 bg-bs-accent rounded-t-lg h-full" />
                </div>
                <span className="text-[10px] text-bs-text-muted">{day.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3 block">
          Eficiencia
        </span>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle size={14} className="text-bs-green" />
              <span>Completadas</span>
            </div>
            <span className="text-xs font-semibold text-bs-green">{totalDeliveries}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <XCircle size={14} className="text-bs-red" />
              <span>Cancelaciones</span>
            </div>
            <span className="text-xs font-semibold text-bs-red">{cancelRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <BarChart3 size={14} className="text-purple-400" />
              <span>Devoluciones (prueba talla)</span>
            </div>
            <span className="text-xs font-semibold">{tryFitReturns}</span>
          </div>
          {totalCommissions > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <DollarSign size={14} className="text-bs-orange" />
                <span>Comisiones pagadas</span>
              </div>
              <span className="text-xs font-semibold text-bs-orange">{formatRD(totalCommissions)}</span>
            </div>
          )}
        </div>
      </Card>

      {topProducts.length > 0 && (
        <Card>
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3 block">
            Productos mas vendidos
          </span>
          <div className="space-y-2">
            {topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center gap-3 py-1.5">
                <span className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold',
                  i === 0 ? 'bg-yellow-500/15 text-yellow-400' :
                  i === 1 ? 'bg-gray-400/15 text-gray-400' :
                  i === 2 ? 'bg-orange-700/15 text-orange-600' :
                  'bg-bs-border text-bs-text-muted'
                )}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{product.name}</div>
                  <div className="text-[10px] text-bs-text-muted">{product.sold} unidades</div>
                </div>
                <span className="text-sm font-semibold text-bs-green">{formatRD(product.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3 block">
          Resumen de pagos
        </span>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-bs-surface rounded-xl">
            <span className="text-xs">Efectivo</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatRD(cashTotal)}</div>
              <div className="text-[9px] text-bs-text-muted">{cashOrders.length} ordenes</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-bs-surface rounded-xl">
            <span className="text-xs">Transferencia</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatRD(transferTotal)}</div>
              <div className="text-[9px] text-bs-text-muted">{transferOrders.length} ordenes</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-bs-surface rounded-xl">
            <span className="text-xs">Prepago</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatRD(prepaidTotal)}</div>
              <div className="text-[9px] text-bs-text-muted">{prepaidOrders.length} ordenes</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
