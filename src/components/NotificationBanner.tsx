'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { subscribeToPush } from '@/lib/push-notifications';

type Status = 'loading' | 'not-supported' | 'denied' | 'default' | 'granted';

export default function NotificationBanner() {
  const { user } = useAppStore();
  const [status, setStatus] = useState<Status>('loading');
  const [requesting, setRequesting] = useState(false);
  const [justActivated, setJustActivated] = useState(false);

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
  if (status === 'granted' && !justActivated) return null;

  async function handleActivate() {
    if (!user) return;
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as Status);
      if (permission === 'granted') {
        await subscribeToPush(user.id);
        setJustActivated(true);
        setTimeout(() => setJustActivated(false), 3000);
      }
    } catch {
      setStatus('denied');
    }
    setRequesting(false);
  }

  if (justActivated) {
    return (
      <div className="mx-3 mt-2 mb-1">
        <div className="bg-bs-green/15 border border-bs-green/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={20} className="text-bs-green shrink-0" />
          <p className="text-xs font-semibold text-bs-green">Notificaciones activadas correctamente</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="mx-3 mt-2 mb-1">
        <div className="bg-bs-red/10 border border-bs-red/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <BellOff size={20} className="text-bs-red shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-bs-red">Notificaciones bloqueadas</p>
            <p className="text-[10px] text-bs-text-muted mt-0.5">
              Abre la configuracion del navegador y permite notificaciones para este sitio, luego recarga la pagina.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-2 mb-1">
      <div className="bg-bs-accent/10 border border-bs-accent/20 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-bs-accent/20 rounded-full flex items-center justify-center shrink-0">
          <Bell size={18} className="text-bs-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-bs-text">Activa las notificaciones</p>
          <p className="text-[10px] text-bs-text-muted mt-0.5">
            Recibe alertas de ordenes y pagos aunque la app este cerrada.
          </p>
        </div>
        <button
          onClick={handleActivate}
          disabled={requesting}
          className="px-4 py-2 bg-bs-accent text-white text-xs font-bold rounded-xl active:scale-95 transition-transform shrink-0"
        >
          {requesting ? 'Activando...' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
