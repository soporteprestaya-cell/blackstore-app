'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'blue' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  default: 'bg-bs-border text-bs-text-secondary',
  success: 'bg-green-500/15 text-emerald-400',
  warning: 'bg-orange-500/15 text-orange-400',
  danger: 'bg-red-500/15 text-red-400',
  purple: 'bg-purple-500/15 text-purple-400',
  blue: 'bg-blue-600/15 text-blue-400',
  cyan: 'bg-cyan-500/15 text-cyan-400',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
