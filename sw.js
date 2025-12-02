self.addEventListener('fetch', event => {
  const original = event.request;

  // Clone the request so we can adjust the visible URL
  const url = new URL(original.url);

  // Covenant face substitution:
  url.hostname = "ci.cherev";
  url.protocol = "https:";

  event.respondWith(fetch(original));
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
