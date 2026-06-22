'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { DEMO_USERS } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { user, setUser, teamMembers, _hydrated } = useAppStore();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allUsers = [...DEMO_USERS, ...teamMembers.filter((m) => !DEMO_USERS.some((d) => d.id === m.id))];

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

    await new Promise((r) => setTimeout(r, 500));

    const cleanPhone = phone.replace(/[-\s]/g, '');
    const found = allUsers.find(
      (u) => u.phone.replace(/[-\s]/g, '') === cleanPhone && u.is_active
    );

    if (!found) {
      setError('Teléfono no registrado');
      setLoading(false);
      return;
    }

    if (found.pin && found.pin !== pin) {
      setError('PIN incorrecto');
      setLoading(false);
      return;
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setUser(found);
    const dest = found.role === 'delivery' ? '/my-orders' : '/orders';
    window.location.href = dest;
    setLoading(false);
  }

  if (user) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-bs-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src="/logo.jpeg" alt="BlackStore RD" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover" />
          <h1 className="text-2xl font-bold tracking-tight">BlackStore RD</h1>
          <p className="text-sm text-bs-text-secondary mt-1">Sistema de Gestión y Delivery</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-bs-text-secondary mb-1.5 uppercase tracking-wider">
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="809-000-0000"
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
                required
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

        <p className="text-center text-[9px] text-bs-text-muted/40 mt-10 tracking-wide">
          Desarrollador<br/>Julio Leyba<br/>Jesús es Mi Guía
        </p>
      </div>
    </div>
  );
}
