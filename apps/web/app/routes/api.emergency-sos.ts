import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const body = await request.json();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  // Validate required fields
  if (!latitude || !longitude) {
    return { error: 'Missing required fields', status: 400 };
  }

  // Get the participant from the authenticated user
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, phone')
    .eq('id', userId)
    .single();

  if (!participant) {
    return { error: 'Participant not found', status: 404 };
  }

  const participantName = `${participant.first_name} ${participant.last_name}`;
  const participantPhone = participant.phone;

  try {
    // Create the SOS alert
    const { data: alert, error: insertError } = await (supabaseAdmin as any)
      .from('emergency_sos_alerts')
      .insert({
        participant_id: participant.id,
        latitude,
        longitude,
        participant_name: participantName,
        participant_phone: participantPhone || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !alert) {
      console.error('Error creating SOS alert:', insertError);
      return { error: 'Failed to create SOS alert', status: 500 };
    }

    // Get all admin users with their push subscriptions
    const { data: admins } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, email')
      .eq('is_admin', true);

    // Send push notifications to all admins
    if (admins && admins.length > 0) {
      const adminIds = admins.map(admin => admin.id);
      
      // Get push subscriptions for all admins
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .in('participant_id', adminIds)
        .eq('is_active', true);

      console.log('Found', subscriptions?.length || 0, 'admin push subscriptions');

      if (subscriptions && subscriptions.length > 0) {
        const { sendBulkPushNotifications } = await import('~/lib/push-notifications-enhanced.server');
        
        try {
          await sendBulkPushNotifications(
            subscriptions.map(sub => ({
              ...sub,
              keys: sub.keys || {}
            })),
            {
              title: '🚨 EMERGENCY SOS ALERT',
              body: `${participantName} has sent an emergency alert`,
              icon: '/icon-192.png',
              badge: '/icon-96.png',
              tag: `emergency-sos-${alert.id}`,
              requireInteraction: true,
              data: {
                type: 'emergency_sos',
                alertId: alert.id,
                participantId: participant.id,
                participantName,
                latitude,
                longitude,
                url: '/admin/emergency-alerts'
              },
              actions: [
                {
                  action: 'view',
                  title: 'View Alert',
                },
                {
                  action: 'dismiss',
                  title: 'Dismiss',
                }
              ]
            }
          );
          console.log('Push notifications sent to', subscriptions.length, 'admin devices');
        } catch (pushError) {
          console.error('Error sending push notifications:', pushError);
          // Don't fail the whole request if push fails
        }
      }
    }

    return {
      success: true,
      alertId: alert.id,
      message: 'Emergency alert sent successfully. Help is on the way.',
    };
  } catch (error) {
    console.error('Unexpected error creating SOS alert:', error);
    return { error: 'An unexpected error occurred' ,status: 500 }
  }
}

export async function loader() {
  return redirect('/dashboard');
}
