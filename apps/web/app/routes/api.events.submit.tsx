import { type LoaderFunctionArgs } from 'react-router';
import { sendBulkPushNotifications, notificationTemplates } from '~/lib/push-notifications.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: LoaderFunctionArgs) {
  const { requireUserId } = await import('~/lib/session.server');
  const { sanityClient } = await import('~/lib/sanity.server');
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('events', 'Event submission initiated');

  if (request.method !== 'POST') {
    await requestLogger.warn('events', 'Event submit rejected: invalid method');
    return Response.json(
      { error: 'Methode niet toegestaan' },
      { status: 405 }
    );
  }

  try {

    const body = await request.json();
    const { title, description, type, severity, location } = body;

    // Validation
    if (!title || !type || !severity || !location) {
      await requestLogger.warn('events', 'Event submit failed: missing required fields', {
        hasTitle: !!title,
        hasType: !!type,
        hasSeverity: !!severity,
        hasLocation: !!location
      });
      return Response.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    if (!location.lat || !location.lng) {
      await requestLogger.warn('events', 'Event submit failed: invalid location', { location });
      return Response.json(
        { error: 'Ongeldige locatie' },
        { status: 400 }
      );
    }

    // Get the current edition
    const currentEdition = await sanityClient.fetch(`
      *[_type == "edition" && isActive == true][0]._id
    `);

    if (!currentEdition) {
      return Response.json(
        { error: 'Geen actieve editie gevonden' },
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

    await requestLogger.info('events', 'Event marker created successfully', {
      eventId: result._id,
      type,
      severity,
      location
    });

    // Send push notification for critical events
    if (severity === 'critical' || severity === 'high') {
      try {
        await requestLogger.info('events', 'Fetching subscriptions for critical event notification', { severity });
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
          await requestLogger.error('events', 'Failed to fetch subscriptions for critical event', subscriptionError as Error);
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
