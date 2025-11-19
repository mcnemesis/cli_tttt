/*----------------------
 * sw.js
 * ---------------------
 *  To listen for and receive events about intercepted static resources
 *  and then register them to the cache service that will
 *  help make them all available in offline mode upon [re-]request
 *  ----------------------------------------------------------*/
let dynamicAssets = [];

self.addEventListener('message', event => {
  if (event.data.assets) {
    dynamicAssets = event.data.assets;
  }
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('offline-cache-v1').then(cache => {
      return cache.addAll(dynamicAssets);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
