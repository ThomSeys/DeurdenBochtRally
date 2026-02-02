import { type LoaderFunctionArgs } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  const url = new URL(request.url);
  const participantId = url.searchParams.get('participant_id');

  if (!participantId) {
    return { error: 'participant_id is required', status: 400 };
  }

  const { data, error } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('zone_id, entry_timestamp')
    .eq('participant_id', participantId);

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { data: data || [] };
}
