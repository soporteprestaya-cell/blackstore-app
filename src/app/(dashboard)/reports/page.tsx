'use client';

import { useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRD, cn } from '@/lib/utils';
import {
  DollarSign, Package, Truck, TrendingUp, Users, AlertCircle,
  Clock, CheckCircle, XCircle, BarChart3,
} from 'lucide-react';

const periods = ['Hoy', 'Semana', 'Mes'];

const dailyData = [
  { label: 'Lun', value: 45000 },
  { label: 'Mar', value: 52000 },
  { label: 'Mié', value: 38000 },
  { label: 'Jue', value: 61000 },
  { label: 'Vie', value: 58000 },
  { label: 'Sáb', value: 72000 },
  { label: 'Dom', value: 31000 },
];

const topProducts = [
  { name: 'Conjunto lino', sold: 45, revenue: 81000 },
  { name: 'T-Shirt oversize', sold: 38, revenue: 36100 },
  { name: 'Pantalón cargo', sold: 32, revenue: 70400 },
  { name: 'Poloche', sold: 28, revenue: 35000 },
  { name: 'Camisa slim', sold: 22, revenue: 39600 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState(0);
  const maxVal = Math.max(...dailyData.map((d) => d.value));

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

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ventas totales" value={formatRD(358750)} icon={DollarSign} color="green" trend={{ value: 15, positive: true }} />
        <StatCard label="Órdenes" value={124} icon={Package} color="accent" trend={{ value: 8, positive: true }} />
        <StatCard label="Entregas" value={118} icon={Truck} color="cyan" />
        <StatCard label="Ticket promedio" value={formatRD(3040)} icon={TrendingUp} color="orange" />
      </div>

      {/* Revenue Chart (bar chart simulation) */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-4 block">
          Ventas por día
        </span>
        <div className="flex items-end gap-2 h-32">
          {dailyData.map((day) => (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-bs-text-muted">{formatRD(day.value / 1000)}K</span>
              <div
                className="w-full bg-bs-accent/20 rounded-t-lg relative overflow-hidden"
                style={{ height: `${(day.value / maxVal) * 100}%` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-bs-accent rounded-t-lg"
                  style={{ height: '100%' }}
                />
              </div>
              <span className="text-[10px] text-bs-text-muted">{day.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Fulfillment Stats */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3 block">
          Eficiencia de entregas
        </span>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle size={14} className="text-bs-green" />
              <span>Entregadas a tiempo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-bs-border rounded-full overflow-hidden">
                <div className="h-full bg-bs-green rounded-full" style={{ width: '87%' }} />
              </div>
              <span className="text-xs font-semibold text-bs-green">87%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Clock size={14} className="text-bs-orange" />
              <span>Tiempo promedio entrega</span>
            </div>
            <span className="text-xs font-semibold">38 min</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <XCircle size={14} className="text-bs-red" />
              <span>Cancelaciones</span>
            </div>
            <span className="text-xs font-semibold text-bs-red">3.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle size={14} className="text-purple-400" />
              <span>Devoluciones (prueba talla)</span>
            </div>
            <span className="text-xs font-semibold">12</span>
          </div>
        </div>
      </Card>

      {/* Top Products */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3 block">
          Productos más vendidos
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

      {/* Payment Summary */}
      <Card>
        <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider mb-3 block">
          Resumen de pagos
        </span>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-bs-surface rounded-xl">
            <span className="text-xs">💵 Efectivo</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatRD(145000)}</div>
              <div className="text-[9px] text-bs-text-muted">42 órdenes</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-bs-surface rounded-xl">
            <span className="text-xs">📱 Transferencia</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatRD(178000)}</div>
              <div className="text-[9px] text-bs-text-muted">58 órdenes</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-bs-surface rounded-xl">
            <span className="text-xs">✅ Prepago</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatRD(35750)}</div>
              <div className="text-[9px] text-bs-text-muted">24 órdenes</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
