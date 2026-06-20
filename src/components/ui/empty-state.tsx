'use client';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-bs-card rounded-2xl border border-bs-border mb-4">
        <Icon size={32} className="text-bs-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-bs-text-secondary mb-1">{title}</h3>
      {description && <p className="text-sm text-bs-text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
