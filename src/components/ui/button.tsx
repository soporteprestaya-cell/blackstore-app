'use client';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-bs-accent hover:bg-bs-accent-hover text-white shadow-lg shadow-bs-accent/20',
  secondary: 'bg-bs-card hover:bg-bs-border text-bs-text border border-bs-border',
  success: 'bg-bs-green hover:bg-bs-green-dark text-black font-semibold shadow-lg shadow-green-500/20',
  danger: 'bg-bs-red hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
  warning: 'bg-bs-orange hover:bg-amber-600 text-black font-semibold',
  ghost: 'hover:bg-bs-card text-bs-text-secondary hover:text-bs-text',
  outline: 'border border-bs-border hover:border-bs-border-light text-bs-text-secondary hover:text-bs-text bg-transparent',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
  icon: 'p-2.5 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
