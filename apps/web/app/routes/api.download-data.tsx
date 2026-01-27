import type { LoaderFunctionArgs } from 'react-router';
import { getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

/**
 * GDPR Compliance: Export user data
 * Allows participants to download all their personal data
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get participant data
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', user.id)
      .single();

    if (participantError) {
      throw participantError;
    }

    // Get rally zone check-ins (Concept B)
    const { data: checkIns, error: checkInsError } = await supabaseAdmin
      .from('rally_zone_checkins')
      .select('*')
      .eq('participant_id', user.id)
      .order('checked_at', { ascending: false });

    if (checkInsError) {
      console.error('Error fetching check-ins:', checkInsError);
    }

    // Get ride stories
    const { data: rideStories, error: storiesError } = await supabaseAdmin
      .from('ride_stories')
      .select('*')
      .eq('participant_id', user.id);

    if (storiesError) {
      console.error('Error fetching ride stories:', storiesError);
    }

    // Get emergency SOS history
    const { data: emergencyAlerts, error: sosError } = await supabaseAdmin
      .from('emergency_contacts')
      .select('*')
      .eq('participant_id', user.id);

    if (sosError) {
      console.error('Error fetching emergency alerts:', sosError);
    }

    // Get push notification history
    const { data: pushHistory, error: pushError } = await supabaseAdmin
      .from('push_notification_history')
      .select('*')
      .eq('participant_id', user.id);

    if (pushError) {
      console.error('Error fetching push history:', pushError);
    }

    // Compile all data
    const userData = {
      participant,
      rally_zone_checkins: checkIns || [],
      ride_stories: rideStories || [],
      emergency_alerts: emergencyAlerts || [],
      push_notification_history: pushHistory || [],
      exported_at: new Date().toISOString(),
      data_export_notice: 'This is your complete personal data as stored in our system, exported in compliance with GDPR regulations.',
    };

    // Return as downloadable JSON file
    const filename = `deur-den-bocht-data-${user.id}-${Date.now()}.json`;
    
    return new Response(JSON.stringify(userData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[api.download-data] error:', error);
    return Response.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
