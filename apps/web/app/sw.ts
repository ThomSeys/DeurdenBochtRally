import { clientsClaim, skipWaiting } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import {
  NavigationRoute,
  registerRoute,
  setCatchHandler,
} from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope & {
  // Replaced at build time by vite-plugin-pwa with the pre-cache manifest
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;
};

// Take control of all clients immediately on activation
skipWaiting();
clientsClaim();

// ── Pre-cache all build artefacts ───────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── HTML pages: network-first (5 s timeout) → cached version ────────────────
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 5,
      plugins: [
        new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 86_400 }),
      ],
    }),
  ),
);

// ── Hashed assets (JS, CSS, fonts): cache-first ─────────────────────────────
// Safe because Vite content-hashes asset URLs — stale URLs won't be served.
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  new CacheFirst({
    cacheName: "assets",
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 2_592_000 }),
    ],
  }),
);

// ── Images: stale-while-revalidate ──────────────────────────────────────────
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 604_800 }),
    ],
  }),
);

// ── Offline fallback ─────────────────────────────────────────────────────────
// Fires when all other handlers fail (no network + nothing cached).
setCatchHandler(({ request }) => {
  if (request.destination === "document") {
    return caches
      .match("/offline.html")
      .then((cached) => cached ?? new Response("You are offline.", { status: 503 }));
  }
  return Promise.resolve(Response.error());
});
