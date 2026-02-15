import { json } from '@remix-run/node';
import { supabaseAdmin } from '~/lib/supabase.server';

/**
 * GET ?participantId=... -> { consent: boolean }
 * POST { participantId, consent } -> { ok: true }
 * NOTE: This endpoint does not implement auth; in production wire to your session system.
 */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const participantId = url.searchParams.get('participantId');
  if (!participantId) return json({ consent: false });

  const { data, error } = await supabaseAdmin
    .from('participants')
    .select('live_tracking_consent')
    .eq('id', participantId)
    .maybeSingle();

  if (error) return json({ consent: false });
  return json({ consent: !!data?.live_tracking_consent });
}

export async function action({ request }: { request: Request }) {
  try {
    const body = await request.json();
    // Debug log incoming payload
    // eslint-disable-next-line no-console
    console.info('[api.live-tracking-consent] received body:', body);

    const participantId = body.participantId || body.userId;
    const consent = !!body.consent;
    if (!participantId) return json({ error: 'missing participantId' }, { status: 400 });

    // Update consent. Replace with a proper auth-guard in production.
    const { data, error } = await supabaseAdmin
      .from('participants')
      .update({ live_tracking_consent: consent })
      .eq('id', participantId)
      .select('id, live_tracking_consent')
      .maybeSingle();

    // Debug log update result
    // eslint-disable-next-line no-console
    console.info('[api.live-tracking-consent] update result:', { data, error });

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ ok: true, updated: data });
  } catch (err: any) {
    return json({ error: err.message || String(err) }, { status: 500 });
  }
}
