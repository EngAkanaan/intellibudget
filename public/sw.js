const CACHE = 'intellibudget-v1';

// On install: cache the app shell entry point
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/index.html']))
  );
});

// On activate: remove stale caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - Supabase API / cross-origin → pass through (never cache)
//   - Navigation (HTML pages) → network-first, fall back to cached '/'
//   - Static assets (JS/CSS/images) → cache-first, populate on miss
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Do not intercept cross-origin requests (Supabase, CDN fonts, etc.)
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/').then((r) => r || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          // Clone must happen synchronously here, before `response` is returned
          // to the browser and its body stream is consumed.
          const clone = response.clone();
          caches.open(CACHE).then((c) => c.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/'));
    })
  );
});

// Push notification handler (receives push from server via Push API)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  const { title = 'IntelliBudget', body = '', url = '/', tag = 'intellibudget' } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.svg',
      badge: '/favicon.svg',
      tag,
      data: { url },
      vibrate: [100, 50, 100],
    })
  );
});

// Notification click: focus existing window or open a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.startsWith(self.location.origin));
        if (existing && 'focus' in existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
