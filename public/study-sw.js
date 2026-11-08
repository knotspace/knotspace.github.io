const CACHE = 'knot-study-v4';
const SCOPE = new URL('./study/', self.location.href).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('knot-study-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      const cacheControl = response.headers.get('Cache-Control') || '';
      if (response.ok && response.type === 'basic' && !/\b(private|no-store)\b/i.test(cacheControl)) {
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const home = await cache.match(new URL('./', self.location.href).pathname);
        if (home) return home;
      }
      return Response.error();
    }
  })());
});
