/**
 * ProbashAcademic Service Worker
 * Provides an offline shell and shows a friendly offline page when there's no connection.
 *
 * Strategy:
 *  - App shell (HTML, offline page) → Cache-first
 *  - API calls → Network-only (never serve stale data)
 *  - Everything else → Network-first with 3s timeout, then cache fallback
 */

const CACHE_NAME = "probashacademic-v2";

const SHELL_ASSETS = ["/offline.html"];

// ── Install: pre-cache the shell ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

// ── Fetch: network-first with 3s timeout, cache fallback ──────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes → always network, never cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Webpack HMR / Next.js dev → always network, never cache
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.includes("hot-update")
  ) {
    return;
  }

  // Everything else → network-first with timeout, then cache
  event.respondWith(networkFirst(request));
});

async function networkFirst(request: Request): Promise<Response> {
  try {
    // Race: network request vs 3 second timeout
    const response = await fetchWithTimeout(request, 3000);

    // Only cache successful responses (2xx)
    if (response.ok && shouldCache(request.url)) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  } catch {
    // Network failed or timed out — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Last resort: offline page
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;

    return new Response("Offline", { status: 503 });
  }
}

function fetchWithTimeout(request: Request, ms: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(request)
      .then((res) => { clearTimeout(timer); resolve(res); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

function shouldCache(url: string): boolean {
  // Don't cache error pages or dynamic pages
  const pathname = new URL(url).pathname;
  if (pathname === "/offline.html") return false;
  if (pathname === "/404") return false;
  if (pathname === "/500") return false;
  return true;
}
