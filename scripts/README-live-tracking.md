Live Tracking server

Quickstart

1) Install dependencies (in `site`):

```bash
cd site
npm install ws ioredis
```

2) Run the server (no redis):

```bash
LIVE_TRACKING_PORT=4001 node scripts/live-tracking-server.js
```

3) With Redis (scale across instances):

```bash
REDIS_URL=redis://localhost:6379 LIVE_TRACKING_PORT=4001 node scripts/live-tracking-server.js
```

Publish locations

- HTTP: POST to `http://localhost:4001/publish` with JSON `{ userId, lat, lng, ts? }`.
- WebSocket: connect to `ws://localhost:4001` and send `{ type: 'location', data: { userId, lat, lng, ts } }`.

Frontend

- Use `apps/web/app/components/LiveTrackingToggle.tsx` and `apps/web/app/utils/live-tracking-client.ts` as a starting point.
- The toggle component expects endpoints `/api/user/live-tracking-consent` to store per-user consent; wire to your auth/session system.

Security & privacy

- Authenticate publishers (userId should match authenticated session).
- Use TLS and restrict access.
- Store locations only with explicit consent; apply TTL or aggregation.
