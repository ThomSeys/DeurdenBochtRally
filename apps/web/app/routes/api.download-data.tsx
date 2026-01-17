import type { LoaderFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  try {
    // Get participant data
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', userId)
      .single();

    // Get rally submission
    const { data: rallySubmission } = await supabaseAdmin
      .from('rally_submissions')
      .select('*')
      .eq('participant_id', userId)
      .single();

    // Get zone submissions
    const { data: zoneSubmissions } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('*')
      .eq('participant_id', userId);

    // Get achievements
    const { data: achievements } = await supabaseAdmin
      .from('participant_achievements')
      .select(`
        *,
        achievement:achievement_id (*)
      `)
      .eq('participant_id', userId);

    // Get documents
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .order('category', { ascending: true });

    // Compile all data
    const userData = {
      exportDate: new Date().toISOString(),
      dataRetentionPolicy: '1 jaar na evenement (conform GDPR)',
      participant: participant,
      rallySubmission: rallySubmission,
      zoneSubmissions: zoneSubmissions || [],
      achievements: achievements || [],
      availableDocuments: documents || [],
      privacyNotice: {
        rightToAccess: 'Je hebt het recht om je persoonlijke gegevens op te vragen (Art. 15 GDPR)',
        rightToRectification: 'Je hebt het recht om onjuiste gegevens te laten corrigeren (Art. 16 GDPR)',
        rightToErasure: 'Je hebt het recht om je gegevens te laten verwijderen (Art. 17 GDPR)',
        rightToDataPortability: 'Je hebt het recht om je gegevens over te dragen (Art. 20 GDPR)',
        rightToObject: 'Je hebt het recht om bezwaar te maken tegen verwerking (Art. 21 GDPR)',
        contactEmail: 'vzwddb@gmail.com',
        dataProtectionAuthority: 'Gegevensbeschermingsautoriteit (GBA) - https://www.gegevensbeschermingsautoriteit.be',
      }
    };

    // Return JSON file for download
    const json = JSON.stringify(userData, null, 2);
    const filename = `deur-den-bocht-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;

    return new Response(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[download-data] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to export data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
