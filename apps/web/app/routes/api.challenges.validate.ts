import type { ActionFunctionArgs } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import { getUserId } from '~/lib/session.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Check authentication
    const userId = await getUserId(request);
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!participant?.is_admin) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { submissionId, isCorrect, points, notes } = await request.json();

    if (!submissionId) {
      return Response.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    // Update submission
    const { data, error } = await supabaseAdmin
      .from('route_challenge_submissions')
      .update({
        is_correct: isCorrect,
        is_validated: true,
        validated_at: new Date().toISOString(),
        validated_by: userId,
        points_awarded: points,
        admin_notes: notes || null,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Failed to validate submission:', error);
      return Response.json({ error: 'Failed to validate submission' }, { status: 500 });
    }

    console.log('✅ Submission validated:', submissionId, 'by admin:', userId);

    return Response.json({ success: true, submission: data });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
