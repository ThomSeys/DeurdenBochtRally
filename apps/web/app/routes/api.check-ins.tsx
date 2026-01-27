import type { LoaderFunctionArgs } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  // Concept B: Return rally zone check-ins
  const { data: checkIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select(`
      id,
      participant_id,
      rally_zone_id,
      action,
      latitude,
      longitude,
      checked_at,
      created_at,
      participants (
        first_name,
        last_name,
        motorcycle_brand,
        motorcycle_model
      )
    `)
    .order('checked_at', { ascending: false });

  return new Response(JSON.stringify(checkIns || []), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // 5 minutes - live data
    },
  });
}
