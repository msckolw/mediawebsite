// Service Worker for caching
const CACHE_NAME = 'nobias-media-cache-v3';
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip caching for chrome-extension and other non-http(s) schemes
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache http(s) requests
                if (event.request.url.startsWith('http')) {
                  cache.put(event.request, responseToCache).catch((err) => {
                    console.warn('SW: failed to cache', event.request.url, err);
                  });
                }
              });

            return response;
          }
        ).catch((error) => {
          console.error('SW: fetch failed', event.request.url, error);
          throw error;
        });
      })
  );
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