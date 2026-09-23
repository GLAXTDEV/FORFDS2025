const CACHE_NAME = 'docs2025-cache-v4';
const URLs_TO_CACHE = ['./', './index.html', './index.css', './index.js', './doc.js', './manifest.json', './messagerie.html', './messagerie.css', './messagerie.js'];

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
  const request = event.request;
  const url = new URL(request.url);
  // On ne met jamais en cache les appels API ni les requêtes non GET.
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
