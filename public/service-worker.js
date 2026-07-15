/*
 * MORÉ Clinic service worker
 *
 * Conservative runtime: caches static build assets, icons, fonts, the manifest,
 * and serves a branded offline fallback for navigation failures. All operational
 * traffic (navigations aside) — non-GET, JSON/API polling, signed clinic assets,
 * payment paths, and authenticated mutations — is network-only so clinical,
 * queue, booking, finance, and payment state stays server-authoritative.
 *
 * Authenticated navigation HTML is intentionally NOT cached: when the network
 * fails we show the branded offline page rather than stale clinical content.
 */

const CACHE_VERSION = 'more-clinic-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSET_PATTERNS = [
    /^\/build\//,
    /^\/icons\//,
    /^\/css\//,
    /^\/js\//,
    /^\/manifest\.webmanifest$/,
    /^\/offline\.html$/,
    /^\/favicon\.ico$/,
];
const FONT_HOSTS = ['fonts.bunny.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// Operational request types that MUST bypass the cache entirely.
function isOperationalDataRequest(url, request) {
    const accept = request.headers.get('accept') || '';
    if (accept.includes('application/json') || accept.includes('text/event-stream')) {
        return true;
    }

    // Inertia / XHR / fetch API traffic is treated as dynamic data.
    if (request.mode === 'cors' || request.headers.get('x-requested-with') === 'XMLHttpRequest') {
        return true;
    }

    if (url.pathname.startsWith('/storage/') || url.pathname.startsWith('/api/')) {
        return true;
    }

    // Payment, webhook, and signed clinic assets stay server-only.
    if (
        url.pathname.startsWith('/payment') ||
        url.pathname.startsWith('/webhook') ||
        url.pathname.startsWith('/midtrans')
    ) {
        return true;
    }

    return false;
}

function isCacheableStaticAsset(url) {
    if (url.origin !== self.location.origin) {
        return false;
    }
    return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isCacheableFont(url) {
    return FONT_HOSTS.includes(url.hostname);
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_VERSION);
            await cache.addAll([OFFLINE_URL, '/manifest.webmanifest']).catch(() => {});
            await self.skipWaiting();
        })(),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key.startsWith('more-clinic-') && key !== CACHE_VERSION)
                    .map((key) => caches.delete(key)),
            );
            await self.clients.claim();
        })(),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') {
        // Non-GET requests (mutations, logouts, form posts) are always network-only.
        return;
    }

    let url;
    try {
        url = new URL(request.url);
    } catch (error) {
        return;
    }

    // All navigations: network-first with the branded offline fallback.
    // Authenticated HTML is never cached, so no stale clinical content is served.
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    // JSON/API, signed assets, payment paths, XHR polling stay network-only.
    if (isOperationalDataRequest(url, request)) {
        return;
    }

    // Cacheable static assets and fonts: stale-while-revalidate.
    if (isCacheableStaticAsset(url) || isCacheableFont(url)) {
        event.respondWith(staleWhileRevalidate(request));
    }
});

async function networkFirstNavigation(request) {
    try {
        return await fetch(request);
    } catch (error) {
        const cache = await caches.open(CACHE_VERSION);
        return (await cache.match(OFFLINE_URL)) || Response.error();
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_VERSION);
    const cachedResponse = await cache.match(request);
    const networkFetch = fetch(request)
        .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
        })
        .catch(() => cachedResponse);
    return cachedResponse || networkFetch;
}
