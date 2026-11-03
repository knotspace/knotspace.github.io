const CACHE_NAME = 'knot-cms-studio-v3';
const SCOPE = '/admin/';
const SHELL = [
  '/admin/',
  '/admin/index.html',
  '/admin/admin.css',
  '/admin/editor-tools.js',
  '/admin/admin-app-icon.svg',
  '/admin/knot-logo.svg',
  '/admin/manifest.webmanifest'
];
const STATIC_ASSETS = new Set([
  '/admin/',
  '/admin/index.html',
  '/admin/admin.css',
  '/admin/editor-tools.js',
  '/admin/decap-cms.js',
  '/admin/admin-app-icon.svg',
  '/admin/knot-logo.svg',
  '/admin/manifest.webmanifest'
]);

async function refreshStaticAsset(request, cache) {
  const response = await fetch(request, { cache: 'no-cache' });
  const cacheControl = response.headers.get('Cache-Control') || '';
  if (
    response.ok &&
    response.type === 'basic' &&
    !/\\b(private|no-store)\\b/i.test(cacheControl)
  ) {
    await cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(SHELL.map(async (path) => {
      try {
        const response = await fetch(path, { cache: 'reload' });
        if (response.ok && response.type === 'basic') await cache.put(path, response);
      } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('knot-cms-studio-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(SCOPE)
  ) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Static CMS assets are served from cache immediately on repeat visits.
    // A background refresh keeps the next launch current without delaying this one.
    if (STATIC_ASSETS.has(url.pathname)) {
      const cached = await cache.match(request);
      if (cached) {
        event.waitUntil(refreshStaticAsset(request, cache).catch(() => {}));
        return cached;
      }
      try {
        return await refreshStaticAsset(request, cache);
      } catch {
        const shell = await cache.match('/admin/') || await cache.match('/admin/index.html');
        if (shell && request.mode === 'navigate') return shell;
        return Response.error();
      }
    }

    // Keep config and other non-shell resources network-first.
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      const cacheControl = response.headers.get('Cache-Control') || '';
      if (
        response.ok &&
        response.type === 'basic' &&
        !/\\b(private|no-store)\\b/i.test(cacheControl)
      ) {
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await cache.match('/admin/') || await cache.match('/admin/index.html');
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
