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

  useEffect(() => {
    if (userId) {
        if (enabled) {
        // start tracking
        stopRef.current = startLiveTracking({ wsUrl, userId, onError: err => console.warn('[lt]', err) });
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
    <div className="live-tracking-toggle">
      <button
        type="button"
        aria-pressed={enabled}
        onClick={() => {
          // mark that the user explicitly toggled so we send the POST in the effect
          userToggledRef.current = true;
          try { localStorage.setItem('liveTrackingConsent', (!enabled).toString()); } catch (e) {}
          setEnabled(!enabled);
        }}
        title={enabled ? 'Live tracking aan' : 'Live tracking uit'}
        className={`relative p-2 transition-all focus:outline-none ${isTransparent ? 'text-white hover:text-white drop-shadow-md' : 'text-white hover:text-primary-700'}`}
      >
        {/* Location icon */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c2.21 0 4 1.79 4 4 0 5-4 10-4 10s-4-5-4-10c0-2.21 1.79-4 4-4z" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
        </svg>

        {/* Active dot */}
        {enabled && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">•</span>
        )}
      </button>
    </div>
  );
}
