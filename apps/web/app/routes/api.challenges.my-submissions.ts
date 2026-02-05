import type { LoaderFunctionArgs } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { getUserId } from '~/lib/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Check authentication
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get participant
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (participantError || !participant) {
      return Response.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Get all submissions
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('route_challenge_submissions')
      .select('*')
      .eq('participant_id', participant.id)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      return Response.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabaseAdmin
      .rpc('get_participant_challenge_stats', { p_participant_id: participant.id })
      .single();

    return Response.json({
      submissions: submissions || [],
      stats: stats || {
        total_submitted: 0,
        total_validated: 0,
        total_correct: 0,
        total_points_earned: 0,
        completion_percentage: 0
      }
    });

  } catch (error) {
    console.error('Error fetching challenge submissions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
