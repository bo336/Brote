// Brote service worker (BUILD_SPEC §12.2) — precache the app shell + static
// assets and fall back to a branded offline page for navigations when the
// network is down.
//
// IMPORTANT: navigations and RSC payloads are NEVER runtime-cached. This app is
// auth-gated, so caching page documents would (a) serve stale HTML built against
// a previous config and (b) interfere with the login redirect + Set-Cookie flow,
// bouncing freshly-signed-in users back to /auth/login. We use NetworkOnly for
// documents (always fresh) and only fall back to /offline.html when truly
// offline. Only immutable, content-hashed static assets are cached.
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const runtimeCaching: RuntimeCaching[] = [
  // Navigations: always go to the network so auth/session is never stale.
  // When the fetch fails (offline), the `fallbacks` config below serves
  // /offline.html.
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new NetworkOnly(),
  },
  // React Server Component payloads: never cache (they carry session-scoped data).
  {
    matcher: ({ request }) =>
      request.headers.get('RSC') === '1' || request.headers.get('Next-Router-Prefetch') === '1',
    handler: new NetworkOnly(),
  },
  // Immutable, content-hashed build output — safe to cache aggressively.
  {
    matcher: ({ url: { pathname }, sameOrigin }) => sameOrigin && pathname.startsWith('/_next/static/'),
    handler: new StaleWhileRevalidate({ cacheName: 'next-static' }),
  },
  // Other same-origin static assets (scripts, styles, workers, fonts).
  {
    matcher: ({ request, sameOrigin }) =>
      sameOrigin && ['style', 'script', 'worker', 'font'].includes(request.destination),
    handler: new StaleWhileRevalidate({ cacheName: 'assets' }),
  },
  // Images (icons, uploaded media) — cache with a bounded expiration.
  {
    matcher: ({ request }) => request.destination === 'image',
    handler: new CacheFirst({
      cacheName: 'images',
      plugins: [new ExpirationPlugin({ maxEntries: 96, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();

// One-time cleanup: drop runtime caches from older SW versions (e.g. the
// `pages` / `pages-rsc` document caches that caused stale-auth bounces). Without
// this, an already-installed client keeps serving stale page HTML from them.
const ALLOWED_RUNTIME_CACHES = new Set(['next-static', 'assets', 'images']);
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('pages') || name.includes('-rsc') || name === 'others')
          .filter((name) => !ALLOWED_RUNTIME_CACHES.has(name))
          .map((name) => caches.delete(name)),
      );
    })(),
  );
});

// Web Push (BUILD_SPEC §12.4): show the notification + deep-link on click.
self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data?.json() ?? {};
    } catch {
      return { body: event.data?.text() };
    }
  })();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Brote', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      data: { url: data.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
