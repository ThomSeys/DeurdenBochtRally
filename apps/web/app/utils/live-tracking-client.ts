// Lightweight live-tracking client helper
// Usage: const stop = startLiveTracking({ wsUrl, userId, onError })

type Options = {
  wsUrl?: string;
  postUrl?: string; // fallback HTTP publish endpoint
  userId: string;
  watchOptions?: PositionOptions;
  // minimum interval between sent location updates in milliseconds
  // defaults to 90_000 (90 seconds) to reduce battery/network usage
  minIntervalMs?: number;
  onError?: (err: Error) => void;
};

export function startLiveTracking(opts: Options) {
  const { wsUrl, postUrl = '/api/live-location', userId, watchOptions, onError, minIntervalMs = 90_000 } = opts;
  let ws: WebSocket | null = null;
  let watchId: number | null = null;
  let lastSentAt = 0;
  let pendingPos: { lat: number; lng: number; ts: number; userId: string } | null = null;
  let sendTimer: number | null = null;

  function doSend(payload: { userId: string; lat: number; lng: number; ts: number }) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'location', data: payload }));
        return;
      } catch (e) {
        // fallthrough to HTTP
      }
    }

    // fallback HTTP POST
    fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    }).catch(err => onError?.(err));
  }

  function sendLocThrottled(lat: number, lng: number, ts?: number) {
    const now = Date.now();
    const payload = { userId, lat, lng, ts: ts || now };

    // If never sent or past interval, send immediately
    if (!lastSentAt || now - lastSentAt >= minIntervalMs) {
      doSend(payload);
      lastSentAt = now;
      // clear any pending
      if (sendTimer) {
        clearTimeout(sendTimer);
        sendTimer = null;
      }
      pendingPos = null;
      return;
    }

    // Otherwise keep latest position as pending and schedule send when interval elapses
    pendingPos = payload;
    if (!sendTimer) {
      const delay = Math.max(0, minIntervalMs - (now - lastSentAt));
      sendTimer = window.setTimeout(() => {
        if (pendingPos) {
          doSend(pendingPos);
          lastSentAt = Date.now();
          pendingPos = null;
        }
        sendTimer = null;
      }, delay) as unknown as number;
    }
  }

  if (wsUrl) {
    try {
      ws = new WebSocket(wsUrl);
      ws.addEventListener('open', () => console.debug('[lt] ws open'));
      ws.addEventListener('close', () => console.debug('[lt] ws closed'));
      ws.addEventListener('error', e => onError?.(new Error('WebSocket error')));
    } catch (e) {
      onError?.(e as Error);
      ws = null;
    }
  }

  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        sendLocThrottled(lat, lng, pos.timestamp);
      },
      err => onError?.(err as unknown as Error),
      watchOptions || { enableHighAccuracy: false, maximumAge: 5000, timeout: 10000 }
    );
  } else {
    onError?.(new Error('Geolocation not supported'));
  }

  return function stop() {
    // send any pending position immediately before stopping
    if (pendingPos) {
      try { doSend(pendingPos); } catch (e) {}
      pendingPos = null;
    }
    if (sendTimer) {
      clearTimeout(sendTimer);
      sendTimer = null;
    }

    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (ws) {
      try {
        ws.close();
      } catch (e) {}
    }
  };
}
