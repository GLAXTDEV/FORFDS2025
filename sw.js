const CACHE_NAME = 'docs2025-cache-v1';
const URLs_TO_CACHE = ['./', './index.html', './index.css', './index.js', './doc.js', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.map(name => {
      if (name !== CACHE_NAME) return caches.delete(name);
      return Promise.resolve();
    })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
