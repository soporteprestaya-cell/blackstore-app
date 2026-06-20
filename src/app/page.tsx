'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { DEMO_USERS } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Shield, Truck, Store, LogIn, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '@/lib/types';

const roleConfig: Record<UserRole, { icon: typeof Shield; label: string; color: string }> = {
  admin: { icon: Shield, label: 'Administrador', color: 'text-bs-red' },
  employee: { icon: Store, label: 'Empleado', color: 'text-bs-accent' },
  delivery: { icon: Truck, label: 'Delivery', color: 'text-bs-green' },
};

export default function LoginPage() {
  const { user, setUser, _hydrated } = useAppStore();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!_hydrated) return;
    if (user) {
      const dest = user.role === 'delivery' ? '/my-orders' : '/orders';
      window.location.href = dest;
    }
  }, [user, _hydrated]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const found = DEMO_USERS.find(
      (u) => u.phone.replace(/-/g, '').includes(phone.replace(/-/g, '')) && u.is_active
    );

    if (found) {
      setUser(found);
    } else {
      setError('Teléfono o PIN incorrecto');
    }
    setLoading(false);
  }

  function handleQuickLogin(role: UserRole) {
    const u = DEMO_USERS.find((u) => u.role === role && u.is_active);
    if (u) {
      setUser(u);
      const dest = u.role === 'delivery' ? '/my-orders' : '/orders';
      window.location.href = dest;
    }
  }

  if (user) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-bs-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo.jpeg" alt="BlackStore RD" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover" />
          <h1 className="text-2xl font-bold tracking-tight">BlackStore RD</h1>
          <p className="text-sm text-bs-text-secondary mt-1">Sistema de Gestión y Delivery</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-bs-text-secondary mb-1.5 uppercase tracking-wider">
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="809-555-0001"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-bs-text-secondary mb-1.5 uppercase tracking-wider">
              PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-bs-text-muted hover:text-bs-text-secondary"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-bs-red bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            <LogIn size={18} />
            Iniciar Sesión
          </Button>
        </form>

        {/* Demo Quick Login */}
        <div className="mt-8 pt-6 border-t border-bs-border">
          <p className="text-center text-xs text-bs-text-muted mb-4 uppercase tracking-wider">
            Acceso rápido (demo)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['admin', 'employee', 'delivery'] as UserRole[]).map((role) => {
              const cfg = roleConfig[role];
              const Icon = cfg.icon;
              return (
                <button
                  key={role}
                  onClick={() => handleQuickLogin(role)}
                  className="flex flex-col items-center gap-2 p-3 bg-bs-card border border-bs-border rounded-xl hover:border-bs-border-light transition-all active:scale-95"
                >
                  <Icon size={20} className={cfg.color} />
                  <span className="text-[10px] text-bs-text-secondary font-medium">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[9px] text-bs-text-muted/40 mt-10 tracking-wide">
          Desarrollado por Julio Leyba — Jesús es Mi Guía
        </p>
      </div>
    </div>
  );
}
