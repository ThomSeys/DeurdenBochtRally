import type { LoaderFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { generateCertificatePDF } from '~/lib/certificates';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }
  const { type } = params;

  // Get participant info
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', userId)
    .single();

  if (!participant) {
    throw new Response('Participant not found', { status: 404 });
  }

  // Get rally stats
  const { data: submission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', userId)
    .single();

  if (!submission && type !== 'participation') {
    throw new Response('No rally submission found', { status: 404 });
  }

  const stats = submission ? {
    zones_completed: Object.keys(submission).filter(k => k.startsWith('rz') && submission[k as keyof typeof submission]).length,
    total_distance: submission.total_distance || 0,
    total_points: submission.total_points || 0,
  } : {
    zones_completed: 0,
    total_distance: 0,
    total_points: 0,
  };

  // Get rank if winner certificate
  let rank: number | undefined;
  if (type === 'winner') {
    const { data: leaderboard } = await supabaseAdmin
      .rpc('get_leaderboard');
    
    if (!leaderboard) {
      throw new Response('Leaderboard not available', { status: 500 });
    }
    
    rank = leaderboard.findIndex((entry: any) => entry.participant_id === userId) + 1;
    
    if (!rank || rank > 10) {
      throw new Response('Not a top 10 finisher', { status: 403 });
    }
  }

  // Generate PDF
  const pdfBlob = await generateCertificatePDF(
    type as 'completion' | 'winner',
    participant,
    stats,
    rank
  );

  // Convert blob to buffer
  const buffer = await pdfBlob.arrayBuffer();

  // Log certificate generation
  await supabaseAdmin.from('certificates').insert({
    participant_id: userId,
    type: type as string,
    generated_at: new Date().toISOString(),
  });

  // Return PDF
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="deur-den-bocht-${type}-${participant.first_name}-${participant.last_name}.pdf"`,
    },
  });
}
