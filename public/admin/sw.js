const CACHE_NAME = 'knot-cms-studio-v8';
const SCOPE = '/admin/';
const SHELL = [
  '/admin/',
  '/admin/index.html',
  '/admin/decap-cms.js',
  '/admin/admin.css',
  '/admin/editor-tools.js',
  '/admin/block-editor.js',
  '/admin/gutenberg-editor.bundle.js',
  '/admin/gutenberg-editor.bundle.css',
  '/admin/richtext-components.js',
  '/admin/admin-app-icon.svg',
  '/admin/knot-logo.svg',
  '/admin/manifest.webmanifest'
];
const STATIC_ASSETS = new Set([
  '/admin/',
  '/admin/index.html',
  '/admin/admin.css',
  '/admin/editor-tools.js',
  '/admin/block-editor.js',
  '/admin/gutenberg-editor.bundle.js',
  '/admin/gutenberg-editor.bundle.css',
  '/admin/richtext-components.js',
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
    !/\b(private|no-store)\b/i.test(cacheControl)
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

  if (STATIC_ASSETS.has(url.pathname)) {
    const cachePromise = caches.open(CACHE_NAME);
    const updatePromise = cachePromise
      .then((cache) => refreshStaticAsset(request, cache))
      .catch(() => null);
    // Register both lifetime promises synchronously during the fetch event.
    event.waitUntil(updatePromise);
    event.respondWith(
      cachePromise
        .then((cache) => cache.match(request))
        .then((cached) => cached || updatePromise.then((response) => response || Response.error()))
    );
    return;
  }

  // Keep config and other non-shell resources network-first.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      const cacheControl = response.headers.get('Cache-Control') || '';
      if (
        response.ok &&
        response.type === 'basic' &&
        !/\b(private|no-store)\b/i.test(cacheControl)
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
