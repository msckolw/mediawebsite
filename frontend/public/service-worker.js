// Service Worker for caching
const CACHE_NAME = 'nobias-media-cache-v7';
// IMPORTANT:
// Do NOT hardcode CRA build asset paths like `/static/js/main.js` or `/static/css/main.css`
// because production filenames are hashed (e.g. main.abc123.js) and these URLs 404,
// causing `cache.addAll()` to fail the install.
//
// Keep this list small and stable.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/NBM Transparent logo.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // `addAll` fails the whole install if *any* request fails.
        // Cache items individually so one missing file doesn't break SW installation.
        return Promise.all(
          urlsToCache.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('SW: failed to cache', url, err);
            })
          )
        );
      })
  );
});

// Cache only public, versioned static assets. Never cache API/session/payment data.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }
  const isStatic = url.pathname.startsWith('/static/') || urlsToCache.includes(decodeURI(url.pathname));
  if (!isStatic) return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
      }
      return response;
    });
  }));
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
