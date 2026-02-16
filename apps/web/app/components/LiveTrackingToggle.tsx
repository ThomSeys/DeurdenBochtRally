import React, { useEffect, useState, useRef } from 'react';
import { startLiveTracking } from '../utils/live-tracking-client';

// Minimal toggle component to opt-in/out of live-tracking.
// Integration notes:
// - Wire the `userId` prop from your auth/session layer.
// - Persist consent on the server (e.g., POST /api/user/live-tracking-consent).

type Props = {
  userId: string;
  wsUrl?: string; // e.g. ws://localhost:4001
  isTransparent?: boolean;
};

export default function LiveTrackingToggle({ userId, wsUrl, isTransparent }: Props) {
  // Read initial value from localStorage for instant UI feedback
  const [enabled, setEnabled] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('liveTrackingConsent') : null;
      return raw === 'true';
    } catch (e) {
      return false;
    }
  });
  const stopRef = useRef<(() => void) | null>(null);
  const userToggledRef = useRef(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const showTooltip = permissionDenied && (tooltipVisible || (typeof window !== 'undefined' && window.innerWidth < 768));

  async function ensureGeolocationAllowed(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('geolocation' in navigator)) {
      alert('Locatie wordt niet ondersteund in deze browser');
      return false;
    }

    try {
      // Prefer Permissions API when available to detect denied state
      // @ts-ignore PermissionName may be narrower in some TS configs
      if (navigator.permissions && navigator.permissions.query) {
        const p = await navigator.permissions.query({ name: 'geolocation' });
        if (p.state === 'granted') {
          setPermissionDenied(false);
          return true;
        }
        if (p.state === 'denied') {
          setPermissionDenied(true);
          return false;
        }
        // if 'prompt' fallthrough to actually requesting position to trigger prompt
      }

      // Fallback: try to request a single position which will either succeed or fail.
      return await new Promise<boolean>(resolve => {
        const done = (ok: boolean) => {
          try { resolve(ok); } catch (e) {}
        };
        navigator.geolocation.getCurrentPosition(
          () => {
            setPermissionDenied(false);
            done(true);
          },
          () => {
            setPermissionDenied(true);
            done(false);
          },
          { timeout: 10000 }
        );
      });
    } catch (e) {
      setPermissionDenied(true);
      return false;
    }
  }

  useEffect(() => {
    // Optionally, fetch initial consent from server
    let mounted = true;
    if (!userId) return () => { mounted = false; };

    fetch(`/api/user/live-tracking-consent?participantId=${encodeURIComponent(userId)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (typeof data?.consent === 'boolean') {
          setEnabled(Boolean(data.consent));
          try { localStorage.setItem('liveTrackingConsent', data.consent ? 'true' : 'false'); } catch (e) {}
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Watch permission state when possible so UI can show warning proactively
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.permissions || !navigator.permissions.query) return;
    let mounted = true;
    (async () => {
      try {
        // @ts-ignore
        const p = await navigator.permissions.query({ name: 'geolocation' });
        if (!mounted) return;
        setPermissionDenied(p.state === 'denied');
        const onChange = () => setPermissionDenied(p.state === 'denied');
        // Some browsers support onchange on permissionStatus
        // @ts-ignore
        if (p.addEventListener) p.addEventListener('change', onChange);
        else if (p.onchange !== undefined) p.onchange = onChange;
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (userId) {
        if (enabled) {
        // Before starting, double-check permission state (handle denied case)
        (async () => {
          const ok = await ensureGeolocationAllowed();
          if (!ok) {
            // Prevent starting and clear UI
            setPermissionDenied(true);
            try { localStorage.setItem('liveTrackingConsent', 'false'); } catch (e) {}
            setEnabled(false);
            return;
          }

          // start tracking
          stopRef.current = startLiveTracking({ wsUrl, userId, onError: err => console.warn('[lt]', err) });
        })();
        // persist consent on server only when user explicitly toggled
        if (userToggledRef.current) {
          try { localStorage.setItem('liveTrackingConsent', 'true'); } catch (e) {}
          fetch('/api/user/live-tracking-consent', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: true, participantId: userId }) }).catch(() => {});
          userToggledRef.current = false;
        }
        } else {
        // stop tracking
        if (stopRef.current) stopRef.current();
        stopRef.current = null;
        // persist consent on server only when user explicitly toggled
        if (userToggledRef.current) {
          try { localStorage.setItem('liveTrackingConsent', 'false'); } catch (e) {}
          fetch('/api/user/live-tracking-consent', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: false, participantId: userId }) }).catch(() => {});
          userToggledRef.current = false;
        }
        }
    }
    return () => {
      if (stopRef.current) stopRef.current();
      stopRef.current = null;
    };
  }, [enabled, wsUrl, userId]);

  return (
    <div className="live-tracking-toggle relative block md:inline-block group">
      <button
        type="button"
        aria-pressed={enabled}
        aria-describedby={permissionDenied ? 'lt-permission-warning' : undefined}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        onClick={async () => {
          // If enabling, ensure geolocation permission is available (or trigger prompt)
          if (!enabled) {
            const ok = await ensureGeolocationAllowed();
            if (!ok) {
              // user denied or not supported
              alert('Live tracking vereist locatie-toestemming. Schakel locatievoorzieningen in de browser of app-instellingen in.');
              return;
            }
          }

          // mark that the user explicitly toggled so we send the POST in the effect
          userToggledRef.current = true;
          try { localStorage.setItem('liveTrackingConsent', (!enabled).toString()); } catch (e) {}
          setEnabled(!enabled);
        }}
        title={enabled ? 'Live tracking aan' : 'Live tracking uit'}
        className={`flex items-center gap-3 py-3 w-full text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg block transition-colors font-medium focus:outline-none ${isTransparent ? 'text-white hover:text-white drop-shadow-md' : 'md:text-white'}`}
      >
        {/* Location icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c2.21 0 4 1.79 4 4 0 5-4 10-4 10s-4-5-4-10c0-2.21 1.79-4 4-4z" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
        </svg>

        <span className="flex-1 text-left md:hidden">Live tracking</span>

        {/* Active / permission dot */}
        {enabled && (
          <span className="absolute right-0 top-1/2 md:top-0 -translate-y-1/2 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 md:w-2 md:h-2 flex items-center justify-center shadow-sm"></span>
        )}
        {!enabled && permissionDenied && (
          <span className="absolute right-0 top-1/2 md:top-0 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 md:w-2 md:h-2 flex items-center justify-center shadow-sm"></span>
        )}
      </button>

      {/* Tooltip: visible on hover/focus of the group */}
      {showTooltip && (
        <div
          id="lt-permission-warning"
          role="status"
          className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-64 px-3 py-2 text-sm text-red-700 bg-white border border-gray-200 rounded shadow md:left-full md:-translate-x-0 md:top-0 md:ml-2"
        >
          Locatie-toestemming uitgeschakeld — open je browser of app-instellingen om live tracking in te schakelen.
        </div>
      )}
    </div>
  );
}
