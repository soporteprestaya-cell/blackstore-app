'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { subscribeToPush } from '@/lib/push-notifications';

type Status = 'loading' | 'not-supported' | 'denied' | 'default' | 'granted';

export default function NotificationBanner() {
  const { user } = useAppStore();
  const [status, setStatus] = useState<Status>('loading');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('not-supported');
      return;
    }
    const perm = Notification.permission as string;
    setStatus(perm as Status);
    if (perm === 'granted') {
      subscribeToPush(user.id);
    }
  }, [user?.id]);

  if (status === 'loading' || status === 'not-supported') return null;

  async function handleActivate() {
    if (!user) return;
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as Status);
      if (permission === 'granted') {
        await subscribeToPush(user.id);
      }
    } catch {
      setStatus('denied');
    }
    setRequesting(false);
  }

  if (status === 'granted') {
    return (
      <div className="mx-3 mt-2 mb-1">
        <div className="bg-bs-green/10 border border-bs-green/20 rounded-2xl px-4 py-2.5 flex items-center gap-3">
          <BellRing size={16} className="text-bs-green shrink-0" />
          <p className="text-xs font-semibold text-bs-green flex-1">Notificaciones activas</p>
          <div className="w-2 h-2 bg-bs-green rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="mx-3 mt-2 mb-1">
        <div className="bg-bs-red/10 border border-bs-red/20 rounded-2xl px-4 py-2.5 flex items-center gap-3">
          <BellOff size={16} className="text-bs-red shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-bs-red">Notificaciones bloqueadas</p>
            <p className="text-[10px] text-bs-text-muted mt-0.5">
              Ve a configuracion del navegador y permite notificaciones para este sitio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-2 mb-1">
      <div className="bg-bs-accent/10 border border-bs-accent/20 rounded-2xl px-4 py-2.5 flex items-center gap-3">
        <Bell size={16} className="text-bs-accent shrink-0" />
        <p className="text-xs font-semibold text-bs-text flex-1">Notificaciones inactivas</p>
        <button
          onClick={handleActivate}
          disabled={requesting}
          className="px-3 py-1.5 bg-bs-accent text-white text-[11px] font-bold rounded-xl active:scale-95 transition-transform shrink-0"
        >
          {requesting ? 'Activando...' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
