'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { subscribeToPush } from '@/lib/push-notifications';

export default function NotificationBanner() {
  const { user } = useAppStore();
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      setShow(true);
    } else if (Notification.permission === 'granted') {
      subscribeToPush(user.id);
    }
  }, [user?.id]);

  if (!show) return null;

  async function handleAccept() {
    setRequesting(true);
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && user) {
      await subscribeToPush(user.id);
    }
    setShow(false);
    setRequesting(false);
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] animate-in slide-in-from-top">
      <div className="mx-2 mt-2 bg-bs-accent rounded-2xl p-4 shadow-2xl shadow-bs-accent/30 border border-bs-accent/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Bell size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Activa las notificaciones</p>
            <p className="text-xs text-white/80 mt-0.5">
              Recibe alertas instantáneas de nuevas órdenes, pagos y entregas — incluso con la app cerrada.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccept}
                disabled={requesting}
                className="px-4 py-2 bg-white text-bs-accent text-xs font-bold rounded-xl active:scale-95 transition-transform"
              >
                {requesting ? 'Activando...' : 'Activar ahora'}
              </button>
              <button
                onClick={() => setShow(false)}
                className="px-3 py-2 text-white/70 text-xs font-medium rounded-xl hover:text-white transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button onClick={() => setShow(false)} className="p-1 text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
