// Comfort Weather service worker — offline-first app shell.
// Strategy: same-origin shell is network-first (so online always gets the
// latest deploy, offline falls back to cache). The pinned React/Babel libs
// are cache-first (immutable). Weather/geocoding APIs are never cached here —
// the app caches the last parsed forecast itself (localStorage) so it can show
// the last screen with no signal.
const CACHE = 'comfortwx-v1';
const SHELL = [
  './', './index.html', './support.js', './image-slot.js', './manifest.json',
  './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon.svg',
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.26.4/babel.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map((u) => c.add(u))); // resilient: one miss won't fail install
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Live data APIs: always go to network; the app handles offline via its own cache.
  if (/open-meteo\.com$/.test(url.hostname) || /bigdatacloud\.net$/.test(url.hostname)) return;

  // Pinned libraries from unpkg: cache-first (they never change).
  if (url.hostname === 'unpkg.com') {
    e.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) { const c = await caches.open(CACHE); c.put(req, resp.clone()); }
        return resp;
      } catch (err) { return cached || Response.error(); }
    })());
    return;
  }

  // Same-origin app shell: network-first, fall back to cache when offline.
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) { const c = await caches.open(CACHE); c.put(req, resp.clone()); }
        return resp;
      } catch (err) {
        const cached = await caches.match(req);
        return cached || (await caches.match('./index.html')) || Response.error();
      }
    })());
  }
});
