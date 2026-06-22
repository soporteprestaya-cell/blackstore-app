const CACHE_VERSION = Date.now();
const CACHE_NAME = `blackstore-v${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack')) return;
  e.respondWith(fetch(e.request));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? { title: 'BlackStore RD', body: 'Nueva notificación' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.jpeg',
      badge: '/icons/icon-192.jpeg',
      vibrate: [200, 100, 200],
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
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
