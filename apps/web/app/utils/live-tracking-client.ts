// Lightweight live-tracking client helper
// Usage: const stop = startLiveTracking({ wsUrl, userId, onError })

type Options = {
  wsUrl?: string;
  postUrl?: string; // fallback HTTP publish endpoint
  userId: string;
  watchOptions?: PositionOptions;
  onError?: (err: Error) => void;
};

export function startLiveTracking(opts: Options) {
  const { wsUrl, postUrl = '/api/live-location', userId, watchOptions, onError } = opts;
  let ws: WebSocket | null = null;
  let watchId: number | null = null;

  function sendLoc(lat: number, lng: number, ts?: number) {
    const payload = { userId, lat, lng, ts: ts || Date.now() };
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
        sendLoc(lat, lng, pos.timestamp);
      },
      err => onError?.(err as unknown as Error),
      watchOptions || { enableHighAccuracy: false, maximumAge: 5000, timeout: 10000 }
    );
  } else {
    onError?.(new Error('Geolocation not supported'));
  }

  return function stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (ws) {
      try {
        ws.close();
      } catch (e) {}
    }
  };
}
