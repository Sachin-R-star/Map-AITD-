const CACHE_NAME = 'mapaitd-v3';
const ASSETS_TO_CACHE = [
  './index.html',
  './css/style.css',
  './js/locations.js',
  './js/map.js',
  './js/navigation.js',
  './js/chat.js',
  './manifest.json',
  // External Leaflet CDN assets to enable completely offline map core loading
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js'
];

// Install Event - Caching all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Cleaning up older caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache first, fallback to network and dynamic cache
self.addEventListener('fetch', event => {
  // Avoid caching non-HTTP requests (like chrome-extension://) and API chat requests
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('https://unpkg.com/')) {
    return;
  }
  if (event.request.url.includes('/api/chat')) {
    return; // Don't cache chat requests, always fetch from server
  }
  if (event.request.url.includes('/js/chat.js')) {
    // Network first for chat.js to avoid stale cache issues during live presentation
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Fetch updated version in the background (stale-while-revalidate style)
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          }).catch(() => {/* Ignore background sync failures */});
          
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {
          // If response is valid, clone and cache it dynamically
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        });
      })
  );
});
