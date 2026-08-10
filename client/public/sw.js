/* Jioplix HIMS offline service worker
 * - App shell: network-first for navigations, fall back to cached index.html
 * - Built assets (/assets/*): stale-while-revalidate
 * - GET API calls: network-first, fall back to cache (works fully offline)
 * - Non-GET requests pass through untouched (offline writes handled in-app
 *   via the IndexedDB outbox in client/src/lib/offline)
 */
const SHELL_CACHE = "jioplix-shell-v2";

// API responses are tenant-scoped via the `x-tenant-id` request header, but the
// Cache API keys by URL only. Scope the cache key with the tenant id so offline
// data from one tenant is never served to another sharing the same origin.
function tenantKey(request) {
  const url = new URL(request.url);
  const tenant = String(request.headers.get("x-tenant-id") || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  url.searchParams.set("_t", tenant);
  return new Request(url.toString(), { method: "GET" });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(["/index.html"]))
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheKey) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin requests (e.g. PostHog, external APIs) — passthrough, never block
  if (url.origin !== self.location.origin) return;

  // API reads
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, tenantKey(request)));
    return;
  }

  // App navigations
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, "/index.html").catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Built static assets
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Public files (APK downloads, logos) — network first, fall back to cache
  event.respondWith(networkFirst(request, request.clone()).catch(() => caches.match(request)));
});
