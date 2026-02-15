import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const [{ requireAdmin }, { supabaseAdmin }] = await Promise.all([
    import('~/lib/session.server'),
    import('~/lib/supabase.server'),
  ]);

  try {
    // Require admin access
    await requireAdmin(request);

    // Fetch recent live locations (last 10 minutes) and join participant info
    const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10).toISOString();

    const { data, error } = await supabaseAdmin
      .from('live_locations')
      .select('participant_id, latitude, longitude, recorded_at, participants(id, first_name, last_name, profile_photo_url)')
      .gte('recorded_at', tenMinutesAgo)
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.warn('[api.live-locations] supabase error', error.message);
      return Response.json({ locations: [] });
    }

    // Deduplicate by participant_id keeping the latest per participant
    const seen = new Set<string>();
    const unique: any[] = [];
    (data || []).forEach((row: any) => {
      const pid = row.participant_id;
      if (!pid) return;
      if (seen.has(pid)) return;
      seen.add(pid);
      unique.push({
        participant_id: pid,
        latitude: row.latitude,
        longitude: row.longitude,
        recorded_at: row.recorded_at,
        participant: row.participants || null,
      });
    });

    return Response.json({ locations: unique });
  } catch (err) {
    console.error('[api.live-locations] error', err);
    return Response.json({ locations: [] });
  }
}
