const CACHE_NAME = 'knot-shell-v2';
const APP_SHELL = ['/', '/study/', '/study/quotes/'];
const PRIVATE_PATHS = ['/account', '/mypage', '/writer', '/admin'];

function isPrivatePath(pathname) {
  return PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

function safeNotificationUrl(value) {
  try {
    const url = new URL(typeof value === 'string' ? value : '/', self.location.origin);
    if (url.origin !== self.location.origin || !url.pathname.startsWith('/') || isPrivatePath(url.pathname)) return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin !== self.location.origin ||
    isPrivatePath(requestUrl.pathname)
  ) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      const cacheControl = response.headers.get('Cache-Control') || '';
      const canCache =
        response.ok &&
        response.type === 'basic' &&
        !/\\b(private|no-store)\\b/i.test(cacheControl);

      if (!canCache) return response;

      const copy = response.clone();
      return caches.open(CACHE_NAME)
        .then((cache) => cache.put(event.request, copy))
        .catch(() => {})
        .then(() => response);
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() || '' };
  }

  event.waitUntil(self.registration.showNotification(data.title || 'KNOTからのお知らせ', {
    body: data.body || '新しいお知らせがあります。',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: safeNotificationUrl(data.url) }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(safeNotificationUrl(event.notification.data?.url), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === target);
      return existing ? existing.focus() : self.clients.openWindow(target);
    })
  );
});
