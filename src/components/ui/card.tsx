'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  highlight?: 'none' | 'accent' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' | 'orange';
}

const highlightBorder = {
  none: 'border-bs-border',
  accent: 'border-bs-accent/40',
  success: 'border-bs-green/40',
  warning: 'border-bs-orange/40',
  danger: 'border-bs-red/40',
  purple: 'border-purple-500/40',
  cyan: 'border-cyan-500/40',
  orange: 'border-orange-500/40',
};

export function Card({ children, className, onClick, highlight = 'none' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-bs-card border rounded-2xl p-4 transition-all duration-200',
        highlightBorder[highlight],
        onClick && 'cursor-pointer hover:bg-bs-border/30 hover:border-bs-border-light active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  );
}
