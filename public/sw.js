const CACHE_VERSION = 'blackstore-v3-' + Date.now();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'SW_UPDATED' });
        }
      });
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/webpack')) return;
  if (url.pathname.startsWith('/_next/static')) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request))
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'FORCE_UPDATE') {
    self.skipWaiting();
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
  if (e.data?.type === 'KEEP_ALIVE') {
    // Respond to keep-alive pings
  }
});

self.addEventListener('push', (e) => {
  let data = { title: 'BlackStore RD', body: 'Nueva notificación', url: '/' };

  try {
    if (e.data) {
      const parsed = e.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      if (e.data) data.body = e.data.text();
    } catch { /* use defaults */ }
  }

  const isUrgent = (data.body || '').includes('URGENTE') || (data.title || '').includes('URGENTE');

  const options = {
    body: data.body,
    icon: '/icons/icon-192.jpeg',
    badge: '/icons/icon-192.jpeg',
    vibrate: isUrgent ? [300, 100, 300, 100, 300, 100, 300] : [200, 100, 200],
    tag: isUrgent ? 'urgent-' + Date.now() : 'bs-notification',
    renotify: true,
    requireInteraction: isUrgent,
    data: { url: data.url || '/' },
    actions: isUrgent
      ? [{ action: 'open', title: 'Ver ahora' }, { action: 'dismiss', title: 'Cerrar' }]
      : [{ action: 'open', title: 'Ver' }],
    silent: false,
  };

  e.waitUntil(self.registration.showNotification(data.title || 'BlackStore RD', options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  if (e.action === 'dismiss') return;

  const url = e.notification.data?.url || '/';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.visibilityState === 'visible') {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].navigate(url);
        return;
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil(
    self.registration.pushManager.subscribe(e.oldSubscription.options).then((newSub) => {
      return fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: newSub.toJSON(),
          userId: 'resubscribe',
        }),
      });
    })
  );
});
