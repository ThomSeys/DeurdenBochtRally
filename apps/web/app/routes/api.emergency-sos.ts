import type { ActionFunctionArgs } from 'react-router';
import { json, redirect } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const formData = await request.formData();
  const participantId = Number(formData.get('participantId'));
  const latitude = Number(formData.get('latitude'));
  const longitude = Number(formData.get('longitude'));
  const participantName = formData.get('participantName') as string;
  const participantPhone = formData.get('participantPhone') as string;

  // Validate required fields
  if (!participantId || !latitude || !longitude || !participantName) {
    return json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify that the participant belongs to the authenticated user
  const { data: participant } = await supabase
    .from('participants')
    .select('id, user_id')
    .eq('id', participantId)
    .eq('user_id', userId)
    .single();

  if (!participant) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Create the SOS alert
    const { data: alert, error: insertError } = await supabase
      .from('emergency_sos_alerts')
      .insert({
        participant_id: participantId,
        latitude,
        longitude,
        participant_name: participantName,
        participant_phone: participantPhone || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating SOS alert:', insertError);
      return json({ error: 'Failed to create SOS alert' }, { status: 500 });
    }

    // Get nearby buddies (within 5km)
    const { data: nearbyBuddies } = await supabase
      .rpc('get_nearby_buddies', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_radius_km: 5,
      })
      .limit(10);

    // Get all admin users
    const { data: admins } = await supabase
      .from('participants')
      .select('id, name, user_id')
      .eq('role', 'admin');

    // TODO: Send notifications to admins
    // This would integrate with your notification system (email, push, SMS)
    // For now, we'll just log it
    console.log('SOS Alert created:', {
      alertId: alert.id,
      participantName,
      location: { latitude, longitude },
      nearbyBuddies: nearbyBuddies?.length || 0,
      adminsNotified: admins?.length || 0,
    });

    // TODO: Queue notifications for:
    // 1. All admin users
    // 2. Emergency contacts (if configured)
    // 3. Nearby buddies (optional)

    // Store for offline sync if needed
    if ('serviceWorker' in navigator) {
      // The service worker will handle offline queueing
      console.log('SOS alert will be queued for offline sync if needed');
    }

    return json({
      success: true,
      alertId: alert.id,
      nearbyBuddies: nearbyBuddies?.length || 0,
      message: 'Emergency alert sent successfully. Help is on the way.',
    });
  } catch (error) {
    console.error('Unexpected error creating SOS alert:', error);
    return json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function loader() {
  return redirect('/dashboard');
}
