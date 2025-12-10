// CI Mirror Engine - Service Worker (v2 synthetic history)
// Scope: /ci.cherev/  (served from https://lifeabundantly.github.io/ci.cherev/sw.js)

const CI_MIRROR_CACHE = "ci-mirror-v2";

// Core assets for the CI Table shell.
// Relative paths so they resolve correctly under /ci.cherev/.
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./ci-manifest.json"
];

// Synthetic engagement DB (fake "history" for auto-eligibility)
const IDB_NAME = "CI_Mirror_DB";
const IDB_STORE = "engagement";

// --- IndexedDB helpers (inside the SW global) ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error || "DB open error");
  });
}

async function seedEngagement(seedData) {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);

    const artifacts = [
      {
        key: "visits",
        value: seedData && typeof seedData.visits === "number" ? seedData.visits : 5
      },
      {
        key: "time_on_site",
        value:
          seedData && typeof seedData.time_on_site === "number"
            ? seedData.time_on_site
            : 30000
      },
      {
        key: "install_eligible",
        value: true
      }
    ];

    artifacts.forEach((item) => store.put(item));

    return tx.complete;
  } catch (err) {
    console.error("CI Mirror: failed to seed engagement", err);
  }
}

// --- INSTALL: cache shell + skip waiting ---
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

// --- ACTIVATE: claim scope, clean old caches, seed default engagement ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((names) =>
        Promise.all(
          names.map((name) => {
            if (name !== CI_MIRROR_CACHE) {
              return caches.delete(name);
            }
          })
        )
      ),
      // Seed synthetic engagement on first activation
      seedEngagement(null)
    ])
  );
});

// --- MESSAGE: accept explicit seed from the page (`ci_seed` link sharing) ---
self.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;
  const msg = event.data;

  if (msg.type === "CI_SEED" && msg.payload) {
    seedEngagement(msg.payload);
  }
});

// --- FETCH: basic network-first with cache fallback ---
// When offline, navigation falls back to index.html shell.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Optionally cache successful GET responses.
        const copy = response.clone();
        caches.open(CI_MIRROR_CACHE).then((cache) => {
          cache.put(request, copy);
        });
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        })
      )
  );
});
