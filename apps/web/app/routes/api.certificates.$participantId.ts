import type { LoaderFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { generateParticipantCertificate } from '~/lib/pdf-generator.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const participantId = params.participantId;

  if (!participantId) {
    throw new Response('Invalid participant ID', { status: 400 });
  }

  // Get participant data
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('id', participantId.toString())
    .single();

  if (!participant) {
    throw new Response('Participant not found', { status: 404 });
  }

  // Check if user is accessing their own certificate or is an admin
  const { data: requestingParticipant } = await supabase
    .from('participants')
    .select('id, is_admin')
    .eq('user_id', userId)
    .single();

  const isOwnCertificate = requestingParticipant?.id === participantId;
  const isAdmin = requestingParticipant?.is_admin === true;

  if (!isOwnCertificate && !isAdmin) {
    throw new Response('Unauthorized', { status: 403 });
  }

  try {
    // Get comprehensive participant data using the database function
    const { data: reportData } = await (supabase as any)
      .rpc('get_participant_report_data', { p_participant_id: participantId });

    if (!reportData) {
      throw new Error('Failed to fetch participant data');
    }

    // Generate PDF certificate
    const pdfBuffer = await generateParticipantCertificate(reportData);

    // Return PDF as response
    return new Response(pdfBuffer.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${participant.first_name}-${participant.last_name}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Response('Failed to generate certificate', { status: 500 });
  }
}
