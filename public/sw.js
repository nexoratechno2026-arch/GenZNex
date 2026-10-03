/**
 * GenZNex Progressive Web App (PWA) Service Worker
 * Security Mandate: Strictly avoids caching any authenticated, checkout, or payment payloads.
 */

const CACHE_NAME = "genznex-v1-static";
const OFFLINE_URL = "/offline";

// Static assets safe for pre-caching
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. SECURITY BYPASS: Never intercept or cache sensitive endpoints
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/checkout/") ||
    url.pathname.startsWith("/student/") ||
    url.pathname.startsWith("/admin/") ||
    url.pathname.startsWith("/trainer/") ||
    url.hostname.includes("razorpay") ||
    url.hostname.includes("identitytoolkit") ||
    url.hostname.includes("securetoken") ||
    event.request.method !== "GET"
  ) {
    return; // Pass through straight to network
  }

  // 2. Navigation requests: Network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match("/");
      })
    );
    return;
  }

  // 3. Static assets: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
