'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

type Status = 'loading' | 'not-supported' | 'denied' | 'prompt' | 'subscribed' | 'needs-subscribe' | 'error';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function trySubscribe(userId: string): Promise<{ ok: boolean; step?: string; error?: string }> {
  let step = 'init';
  try {
    if (!('serviceWorker' in navigator)) return { ok: false, step, error: 'Tu navegador no soporta ServiceWorker' };
    if (!('PushManager' in window)) return { ok: false, step, error: 'Tu navegador no soporta Push' };
    if (!VAPID_KEY) return { ok: false, step, error: 'Falta configuracion del servidor (VAPID)' };

    step = 'permiso';
    const permission = Notification.permission;
    if (permission === 'denied') return { ok: false, step, error: 'Permiso denegado en el navegador' };
    if (permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') return { ok: false, step, error: `Permiso: ${result}` };
    }

    step = 'service-worker';
    const reg = await navigator.serviceWorker.ready;

    step = 'subscription-check';
    let sub = await reg.pushManager.getSubscription();

    if (sub) {
      const j = sub.toJSON();
      if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) {
        await sub.unsubscribe();
        sub = null;
      }
    }

    if (!sub) {
      step = 'push-subscribe';
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY).buffer as ArrayBuffer,
        });
      } catch (pushErr) {
        const msg = pushErr instanceof Error ? pushErr.message : String(pushErr);
        return { ok: false, step, error: `pushManager.subscribe: ${msg}` };
      }
    }

    step = 'validate';
    const subJson = sub.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { ok: false, step, error: 'La suscripcion creada no tiene datos validos' };
    }

    step = 'api-save';
    const res = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subJson, userId }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, step, error: `Servidor: ${res.status} ${body.slice(0, 80)}` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, step, error: `${step}: ${err?.message || String(err)}` };
  }
}

export default function NotificationBanner() {
  const { user } = useAppStore();
  const [status, setStatus] = useState<Status>('loading');
  const [btnText, setBtnText] = useState('Activar');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setStatus('not-supported');
      return;
    }

    const perm = Notification.permission;
    if (perm === 'denied') {
      setStatus('denied');
      return;
    }

    if (perm === 'granted') {
      setBtnText('Verificando...');
      trySubscribe(user.id).then(({ ok, step, error }) => {
        if (ok) {
          setStatus('subscribed');
        } else {
          setStatus('needs-subscribe');
          setBtnText('Reintentar');
          setErrorMsg(`[${step}] ${error}`);
        }
      });
      return;
    }

    setStatus('prompt');
  }, [user?.id]);

  async function handleActivate() {
    if (!user) return;
    setBtnText('Procesando...');
    setErrorMsg('');

    const { ok, step, error } = await trySubscribe(user.id);
    if (ok) {
      setStatus('subscribed');
    } else {
      setStatus('error');
      setBtnText('Reintentar');
      setErrorMsg(`[${step}] ${error}`);
    }
  }

  if (status === 'loading' || status === 'not-supported') return null;

  if (status === 'subscribed') {
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
              Ve a configuracion del navegador &gt; permisos del sitio &gt; notificaciones &gt; permitir
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isError = status === 'error' || status === 'needs-subscribe';

  return (
    <div className="mx-3 mt-2 mb-1">
      <div className={`${isError ? 'bg-orange-500/10 border-orange-500/20' : 'bg-bs-accent/10 border-bs-accent/20'} border rounded-2xl px-4 py-3`}>
        <div className="flex items-center gap-3">
          {isError ? (
            <AlertTriangle size={18} className="text-bs-orange shrink-0" />
          ) : (
            <Bell size={18} className="text-bs-accent shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-xs font-bold text-bs-text">
              {isError ? 'Notificaciones incompletas' : 'Activa las notificaciones'}
            </p>
            <p className="text-[10px] text-bs-text-muted mt-0.5">
              Recibe alertas de pedidos sin abrir la app.
            </p>
          </div>
          <button
            onClick={handleActivate}
            className={`px-4 py-2 ${isError ? 'bg-bs-orange' : 'bg-bs-accent'} text-white text-xs font-bold rounded-xl active:scale-95 transition-transform shrink-0`}
          >
            {btnText}
          </button>
        </div>
        {errorMsg && (
          <p className="text-[10px] text-bs-orange mt-2 break-all bg-black/20 rounded-lg p-2 font-mono">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
