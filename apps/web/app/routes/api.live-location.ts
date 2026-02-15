import type { ActionFunctionArgs } from 'react-router';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const [{ requireUserId }, { supabaseAdmin }] = await Promise.all([
    import('~/lib/session.server'),
    import('~/lib/supabase.server'),
  ]);

  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);

  if (request.method !== 'POST') {
    await requestLogger.warn('live-location', 'Rejected non-POST live location');
    return { error: 'Methode niet toegestaan' };
  }

  try {
    const body = await request.json();
    const { lat, lng, ts } = body || {};

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      await requestLogger.warn('live-location', 'Invalid payload', { body });
      return { error: 'Ongeldige payload' };
    }

    const recordedAt = ts ? new Date(ts) : new Date();

    await requestLogger.info('live-location', 'Received live location', { lat, lng, recordedAt: recordedAt.toISOString() });

    // Try to persist to a live_locations table if it exists. If not, don't fail the request.
    try {
      const { error } = await supabaseAdmin.from('live_locations').insert({
        latitude: lat,
        longitude: lng,
        recorded_at: recordedAt.toISOString(),
        participant_id: userId,
      });

      if (error) {
        // Log but don't return an error to the client (best-effort persistence)
        await requestLogger.warn('live-location', 'Failed to persist live location', { sqlError: error.message });
      } else {
        await requestLogger.info('live-location', 'Persisted live location');
      }
    } catch (persistErr) {
      await requestLogger.warn('live-location', 'Persistence attempt failed', persistErr as Error);
    }

    return { ok: true };
  } catch (err) {
    await requestLogger.error('live-location', 'Live location accept error', err as Error);
    return { error: 'Interne serverfout' };
  }
}
