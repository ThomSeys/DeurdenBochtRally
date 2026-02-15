#!/usr/bin/env node
// scripts/live-tracking-server.js
// Small WebSocket server that accepts HTTP POST /publish and broadcasts to connected clients.
// Optional Redis support: set REDIS_URL to enable pub/sub across instances.

const http = require('http');
const WebSocket = require('ws');

const REDIS_URL = process.env.REDIS_URL || null;
let redisPub = null;
let redisSub = null;
if (REDIS_URL) {
  try {
    const IORedis = require('ioredis');
    redisPub = new IORedis(REDIS_URL);
    redisSub = new IORedis(REDIS_URL);
    console.log('[live-tracking] Redis enabled');
  } catch (err) {
    console.warn('[live-tracking] ioredis not installed, continuing without redis');
    redisPub = null;
    redisSub = null;
  }
}

const PORT = process.env.LIVE_TRACKING_PORT ? parseInt(process.env.LIVE_TRACKING_PORT, 10) : 4001;

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/publish') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        // Basic validation
        if (!data || typeof data.lat !== 'number' || typeof data.lng !== 'number' || !data.userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid payload, require {userId, lat, lng, ts?}' }));
          return;
        }

        const payload = JSON.stringify({ type: 'location', data });

        // Publish to Redis channel if available
        if (redisPub) {
          await redisPub.publish('live:locations', payload);
        }

        // Also broadcast locally
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) client.send(payload);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('live-tracking server\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('[live-tracking] client connected');
  ws.on('message', msg => {
    // expect publish messages from authenticated clients (optionally)
    try {
      const parsed = JSON.parse(msg);
      if (parsed && parsed.type === 'location') {
        // rebroadcast to others
        const payload = JSON.stringify(parsed);
        if (redisPub) redisPub.publish('live:locations', payload).catch(() => {});
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) client.send(payload);
        });
      }
    } catch (e) {
      // ignore
    }
  });
  ws.on('close', () => console.log('[live-tracking] client disconnected'));
});

if (redisSub) {
  redisSub.subscribe('live:locations', err => {
    if (err) console.error('[live-tracking] redis subscribe error', err);
  });
  redisSub.on('message', (channel, message) => {
    if (channel === 'live:locations') {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(message);
      });
    }
  });
}

server.listen(PORT, () => console.log(`[live-tracking] server listening on http://localhost:${PORT}`));
