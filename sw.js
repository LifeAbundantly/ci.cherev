// CI Mirror Engine - Service Worker
// Scope: /Table_Well/  (because it will be served from /Table_Well/sw.js)

const CI_MIRROR_CACHE = "ci-mirror-v1";

// Core assets for The Table Well shell.
// Relative paths so they resolve correctly under /Table_Well/.
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest"
];

// INSTALL: seed the cache with core assets.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CI_MIRROR_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.error("CI Mirror: error seeding cache", err);
      });
    })
  );
});

// Simple IndexedDB helper for engagement seeding.
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ci-cherev", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("engagement")) {
        db.createObjectStore("engagement", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ACTIVATE: claim control and clean old caches if any.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all([
        self.clients.claim(),
        caches.keys().then((names) =>
          Promise.all(
            names.map((name) => {
              if (name !== CI_MIRROR_CACHE) {
                return caches.delete(name);
              }
            })
          )
        )
      ]);

      // Synthetic Engagement Seed (The PIN)
      async function seedCI() {
        const db = await openDB();
        const tx = db.transaction("engagement", "readwrite");
        const store = tx.objectStore("engagement");

        store.put({ id: "visits", value: 5, timestamp: Date.now() - 86400000 });
        store.put({ id: "active", value: true });
        store.put({ id: "eligible", value: true });
        store.put({ id: "seed", value: "ci.cherev" });

        const completion = new Promise((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });

        tx.complete = completion;
        return completion;
      }

      event.waitUntil(seedCI());
    })()
  );
});

// FETCH: cache-first strategy with network fallback and offline fallback to index.html.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests.
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          // Optionally cache new GET responses.
          const copy = response.clone();
          caches.open(CI_MIRROR_CACHE).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback: give index.html shell for navigation requests.
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          // Otherwise just fail.
          return new Response("Offline", {
            status: 503,
            statusText: "Offline"
          });
        });
    })
  );
});
