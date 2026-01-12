import type { LoaderFunctionArgs } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const url = new URL(request.url);
  const participantId = url.searchParams.get('participant_id');

  if (!participantId) {
    return { error: 'Participant ID is required', status: 400 };
  }

  const { data: submission, error } = await supabaseAdmin
    .from('rally_submissions')
    .select('rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code')
    .eq('participant_id', participantId)
    .single();

  if (error || !submission) {
    return { 
      rz1_code: null,
      rz2_code: null,
      rz3_code: null,
      rz4_code: null,
      rz5_code: null,
      rz6_code: null,
      rz7_code: null,
      rz8_code: null
    };
  }

  return submission;
}
