/* McNutt's Island Alliance — Service Worker
   Caches static assets (CSS, JS, images, SVG) for offline resilience.
   Version bump CACHE_NAME when deploying updated assets.
*/
const CACHE_NAME = 'mcnutts-v3';

const PRECACHE_URLS = [
  '/css/main.css',
  '/js/main.js',
  '/favicon.svg',
];

// ── Install: pre-cache core static assets ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove stale caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static assets, network-first for pages ─────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);
  const isStaticAsset =
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/favicon.svg';

  if (isStaticAsset) {
    // Cache-first: serve from cache, fall back to network and update cache
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
  // For HTML pages: network-first (no caching — always serve fresh content)
});
