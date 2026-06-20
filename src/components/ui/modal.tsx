'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-full mx-4',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full bg-bs-surface border border-bs-border rounded-t-3xl sm:rounded-2xl',
          'max-h-[90vh] overflow-y-auto animate-slide-up',
          sizeMap[size]
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 pb-3 border-b border-bs-border bg-bs-surface/95 backdrop-blur-sm rounded-t-3xl sm:rounded-t-2xl">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-bs-card rounded-xl transition-colors">
              <X size={18} className="text-bs-text-secondary" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
