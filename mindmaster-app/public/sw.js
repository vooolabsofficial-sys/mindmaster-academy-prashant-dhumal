const CACHE_NAME = "mindmaster-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Precache essential offline fallback assets on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Purge any older caches on activate to prevent stale UI after deployments
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Support instant update activation from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Background sync for offline watch progress and heartbeat telemetry
self.addEventListener("sync", (event) => {
  if (event.tag === "watch-progress-sync" || event.tag === "sync-watch-stats") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SYNC_WATCH_STATS" });
        });
      })
    );
  }
});

self.addEventListener("fetch", (event) => {
  // 1. Only handle GET requests (Cache API throws TypeError on POST/PUT/DELETE)
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 2. NEVER cache authenticated API routes or backend endpoints
  if (url.pathname.startsWith("/api/")) return;

  // 3. Ignore non-HTTP/HTTPS protocols (e.g. chrome-extension://)
  if (!url.protocol.startsWith("http")) return;

  // 4. For HTML page navigation: Network-first with offline.html fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 5. Cache static immutable assets (_next/static/ chunks, icons) safely
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
      );
      return;
    }
  }

  // 6. All other requests bypass cache and go straight to network
  // This prevents stale student UI or outdated course data after new deployments.
});
