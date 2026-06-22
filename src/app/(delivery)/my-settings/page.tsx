'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, User, Phone } from 'lucide-react';

export default function MySettingsPage() {
  const { user, setUser } = useAppStore();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [msg, setMsg] = useState('');

  function handleChangePin() {
    if (!user) return;
    if (currentPin !== user.pin) { setMsg('PIN actual incorrecto'); return; }
    if (newPin.length < 4) { setMsg('Mínimo 4 dígitos'); return; }
    setUser({ ...user, pin: newPin });
    setCurrentPin('');
    setNewPin('');
    setMsg('PIN actualizado');
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold">Mi Cuenta</h2>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-bs-green" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Datos</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-bs-text-secondary">
            <User size={14} className="text-bs-text-muted" />
            <span>{user?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-bs-text-secondary">
            <Phone size={14} className="text-bs-text-muted" />
            <span>{user?.phone}</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Key size={16} className="text-bs-accent" />
          <span className="text-xs font-semibold text-bs-text-secondary uppercase tracking-wider">Cambiar PIN</span>
        </div>
        <div className="space-y-2">
          <input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="PIN actual" maxLength={6} className="w-full" />
          <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Nuevo PIN" maxLength={6} className="w-full" />
          <Button variant="primary" size="sm" className="w-full" onClick={handleChangePin}>
            Cambiar PIN
          </Button>
          {msg && (
            <p className={`text-xs text-center ${msg.includes('actualizado') ? 'text-bs-green' : 'text-bs-red'}`}>{msg}</p>
          )}
        </div>
      </Card>

      <p className="text-center text-[9px] text-bs-text-muted/40 mt-6 tracking-wide leading-5">
        Desarrollador<br/>Julio Leyba<br/>Jesús es Mi Guía
      </p>
    </div>
  );
}
