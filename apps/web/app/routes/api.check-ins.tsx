import type { LoaderFunctionArgs } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { data: checkIns } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select(`
      participant_id,
      zone_id,
      entry_latitude,
      entry_longitude,
      answer_latitude,
      answer_longitude,
      created_at,
      participants!rally_zone_submissions_participant_id_fkey (
        first_name,
        last_name,
        motorcycle_brand,
        motorcycle_model
      )
    `);

  return new Response(JSON.stringify(checkIns || []), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // 5 minutes - live data
    },
  });
}
