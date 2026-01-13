import { type LoaderFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { sanityClient } from '~/lib/sanity.server';

export async function action({ request }: LoaderFunctionArgs) {
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
