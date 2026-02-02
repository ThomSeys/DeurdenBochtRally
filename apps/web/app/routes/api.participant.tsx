import type { LoaderFunctionArgs } from 'react-router';
import { supabase } from '~/lib/supabase.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  const url = new URL(request.url);
  const participantId = url.searchParams.get('participant_id');

  if (!participantId) {
    return new Response(
      JSON.stringify({ error: 'participant_id required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data: participant } = await supabase
    .from('participants')
    .select('id, first_name, last_name, email, motorcycle_brand, motorcycle_model, license_plate, formula, ride_type, checked_in')
    .eq('id', participantId)
    .single();

  return new Response(JSON.stringify(participant || {}), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // 1 hour
    },
  });
}
