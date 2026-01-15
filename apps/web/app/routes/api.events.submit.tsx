import { type LoaderFunctionArgs } from 'react-router';
import { sendBulkPushNotifications, notificationTemplates } from '~/lib/push-notifications.server';

export async function action({ request }: LoaderFunctionArgs) {
  const { requireUserId } = await import('~/lib/session.server');
  const { sanityClient } = await import('~/lib/sanity.server');
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  
  console.info('[api.events.submit] action start', { method: request.method });

  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    await requireUserId(request);

    const body = await request.json();
    const { title, description, type, severity, location } = body;

    // Validation
    if (!title || !type || !severity || !location) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!location.lat || !location.lng) {
      return Response.json(
        { error: 'Invalid location' },
        { status: 400 }
      );
    }

    // Get the current edition
    const currentEdition = await sanityClient.fetch(`
      *[_type == "edition" && isActive == true][0]._id
    `);

    if (!currentEdition) {
      return Response.json(
        { error: 'No active edition found' },
        { status: 400 }
      );
    }

    // Create the event marker in Sanity
    const eventMarker = {
      _type: 'eventMarker',
      title,
      description: description || '',
      type,
      severity,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      isActive: true,
      edition: {
        _type: 'reference',
        _ref: currentEdition,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await sanityClient.create(eventMarker);

    console.info('[api.events.submit] action success', { eventId: result._id });

    // Send push notification for critical events
    if (severity === 'critical' || severity === 'high') {
      try {
        console.info('[api.events.submit] fetching subscriptions for critical event...');
        const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
          .from('push_subscriptions')
          .select('endpoint, keys')
          .eq('is_active', true);

        console.info('[api.events.submit] subscriptions query result', { 
          count: subscriptions?.length || 0,
          error: subscriptionError?.message,
          subscriptions: subscriptions?.slice(0, 2) // log first 2 for debugging
        });

        if (subscriptionError) {
          console.error('[api.events.submit] error fetching subscriptions', subscriptionError);
        }

        if (subscriptions && subscriptions.length > 0) {
          const notification = notificationTemplates.criticalEvent(title, description, {
            type,
            severity,
            source: 'live-map',
          });
          console.info('[api.events.submit] sending notification to', subscriptions.length, 'subscribers');
          const result = await sendBulkPushNotifications(subscriptions, notification);
          console.info('[api.events.submit] critical event notification result', result);
        } else {
          console.warn('[api.events.submit] no active subscriptions found');
        }
      } catch (pushError) {
        console.error('[api.events.submit] error sending critical event notification', pushError);
      }
    } else {
      console.info('[api.events.submit] event severity not critical/high, skipping notification', { severity });
    }

    return Response.json(
      {
        success: true,
        eventId: result._id,
        message: 'Event submitted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api.events.submit] action error', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to submit event',
      },
      { status: 500 }
    );  
  }
}
