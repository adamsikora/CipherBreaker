// Service worker: the app and all the dictionaries are downloaded and cached on install, so that
// the app works offline from the first load on

const CACHE = 'cipher-breaker-v3';
const SHELL = ['./', 'index.html', 'app.js', 'search-worker.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const ASSETS = ['assets/en.cbfcdict', 'assets/cs_nouns.cbfcdict', 'assets/cs.cbfcdict', 'assets/Czechia.cbfcmap'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.concat(ASSETS))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
