'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'accent' | 'green' | 'orange' | 'red' | 'purple' | 'cyan';
  trend?: { value: number; positive: boolean };
}

const colorMap = {
  accent: { text: 'text-bs-accent', bg: 'bg-bs-accent/10', glow: 'shadow-bs-accent/10' },
  green: { text: 'text-bs-green', bg: 'bg-green-500/10', glow: 'shadow-green-500/10' },
  orange: { text: 'text-bs-orange', bg: 'bg-orange-500/10', glow: 'shadow-orange-500/10' },
  red: { text: 'text-bs-red', bg: 'bg-red-500/10', glow: 'shadow-red-500/10' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/10' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', glow: 'shadow-cyan-500/10' },
};

export function StatCard({ label, value, icon: Icon, color = 'accent', trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('bg-bs-card border border-bs-border rounded-2xl p-4 shadow-lg', c.glow)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-xl', c.bg)}>
          <Icon size={18} className={c.text} />
        </div>
        {trend && (
          <span className={cn('text-[11px] font-semibold', trend.positive ? 'text-bs-green' : 'text-bs-red')}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <div className={cn('text-2xl font-bold tracking-tight', c.text)}>{value}</div>
      <div className="text-xs text-bs-text-muted mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}
