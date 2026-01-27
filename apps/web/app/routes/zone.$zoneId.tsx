import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation } from 'react-router';
import { useState, useEffect } from 'react';
import { getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import PortableText from '~/components/PortableText';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Zone - Deur Den Bocht' },
  ];
};

export async function action({ params, request }: ActionFunctionArgs) {
  console.info('[zone] action start');

  try {
    const user = await getUser(request);
    if (!user) {
      return { error: 'Je moet ingelogd zijn' };
    }

    const { zoneId } = params;
    if (!zoneId) {
      return { error: 'Zone ID is required' };
    }

    const formData = await request.formData();
    const action = formData.get('action') as string;
    const qrCode = formData.get('qrCode') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;

    // Get the zone from Sanity to verify it exists
    const zone = await sanityClient.fetch(
      `*[_type == "rallyZoneV2" && order == $order][0] {
        _id,
        title,
        is_active
      }`,
      { order: parseInt(zoneId) }
    );

    if (!zone) {
      return { error: 'Rally zone niet gevonden' };
    }

    // Admins can check in/out even if zone is not active
    if (!zone.is_active && !user.is_admin) {
      return { error: 'Deze zone is momenteel niet actief' };
    }

    // Check if action is valid
    if (action !== 'CHECKIN' && action !== 'CHECKOUT') {
      return { error: 'Ongeldige actie' };
    }

    // For check-in, verify they haven't already checked in (skip for admins)
    if (action === 'CHECKIN' && !user.is_admin) {
      const { data: existingCheckIn } = await supabaseAdmin
        .from('rally_zone_checkins')
        .select('id')
        .eq('participant_id', user.id)
        .eq('rally_zone_id', zone._id)
        .eq('action', 'CHECKIN')
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      // Check if there's a matching checkout
      if (existingCheckIn) {
        const { data: checkout } = await supabaseAdmin
          .from('rally_zone_checkins')
          .select('id')
          .eq('participant_id', user.id)
          .eq('rally_zone_id', zone._id)
          .eq('action', 'CHECKOUT')
          .gt('checked_at', existingCheckIn.checked_at)
          .single();

        if (!checkout) {
          return { error: 'Je hebt hier al ingecheckt zonder uit te checken' };
        }
      }
    }

    // Create check-in/checkout
    const { error: insertError } = await supabaseAdmin
      .from('rally_zone_checkins')
      .insert({
        participant_id: user.id,
        rally_zone_id: zone._id,
        action: action,
        qr_code: qrCode || `${action}-${Date.now()}`,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });

    if (insertError) {
      console.error('[zone] insert error', insertError);
      return { error: 'Er ging iets mis bij het opslaan' };
    }

    console.info('[zone] action success', { zoneId, action });
    return { 
      success: true, 
      action,
      message: action === 'CHECKIN' ? 'Check-in succesvol!' : 'Check-out succesvol!'
    };
  } catch (error) {
    console.error('[zone] action error', error);
    return { error: 'Onverwachte fout' };
  }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const { zoneId } = params;

  if (!zoneId || isNaN(parseInt(zoneId))) {
    throw new Response('Invalid zone ID', { status: 400 });
  }

  const zoneOrder = parseInt(zoneId);

  // Get zone from Sanity
  const zone = await sanityClient.fetch(
    `*[_type == "rallyZoneV2" && order == $order][0] {
      _id,
      title,
      order,
      character,
      start_location,
      end_location,
      briefing,
      guidelines,
      estimated_duration_minutes,
      difficulty,
      emergency_contact,
      is_active
    }`,
    { order: zoneOrder }
  );

  if (!zone) {
    throw new Response('Zone niet gevonden', { status: 404 });
  }

  // Get next zone for navigation after checkout
  const nextZone = await sanityClient.fetch(
    `*[_type == "rallyZoneV2" && order == $nextOrder][0] {
      _id,
      title,
      order
    }`,
    { nextOrder: zoneOrder + 1 }
  );

  // Get user's check-ins for this zone
  let checkIns = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from('rally_zone_checkins')
      .select('*')
      .eq('participant_id', user.id)
      .eq('rally_zone_id', zone._id)
      .order('checked_at', { ascending: false });
    
    checkIns = data;
  }

  return { 
    zone, 
    nextZone,
    user,
    checkIns,
    zoneNumber: zoneOrder
  };
}

export default function ZonePage() {
  const { zone, nextZone, user, checkIns, zoneNumber } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          setLocationError('Kon locatie niet bepalen (optioneel)');
        }
      );
    }
  }, []);

  // Determine if user should check in or check out
  const lastCheckIn = checkIns?.find(c => c.action === 'CHECKIN');
  const lastCheckOut = checkIns?.find(c => c.action === 'CHECKOUT');
  
  const shouldCheckOut = lastCheckIn && (!lastCheckOut || new Date(lastCheckIn.checked_at) > new Date(lastCheckOut.checked_at));
  const suggestedAction = shouldCheckOut ? 'CHECKOUT' : 'CHECKIN';

  const difficultyColor = 
    zone.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
    zone.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Zone Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {zone.title}
              </h1>
              <p className="text-gray-600 italic">{zone.character}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${difficultyColor}`}>
                {zone.difficulty === 'easy' ? 'Makkelijk' : 
                 zone.difficulty === 'moderate' ? 'Gemiddeld' : 
                 'Uitdagend'}
              </span>
              {zone.estimated_duration_minutes && (
                <p className="text-sm text-gray-500 mt-2">
                  ~{zone.estimated_duration_minutes} min
                </p>
              )}
            </div>
          </div>

          {!zone.is_active && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-semibold">Deze zone is momenteel gesloten</p>
            </div>
          )}

          {/* Location Info */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">Check-in Locatie</h3>
              <p className="text-gray-700">{zone.start_location?.name}</p>
              {zone.start_location?.landmark_description && (
                <p className="text-sm text-gray-600 mt-1">{zone.start_location.landmark_description}</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">Check-out Locatie</h3>
              <p className="text-gray-700">{zone.end_location?.name}</p>
              {zone.end_location?.landmark_description && (
                <p className="text-sm text-gray-600 mt-1">{zone.end_location.landmark_description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Briefing */}
        {zone.briefing && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Briefing</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <PortableText value={zone.briefing} />
            </div>
          </div>
        )}

        {/* Guidelines */}
        {zone.guidelines && zone.guidelines.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Richtlijnen</h2>
            <ul className="space-y-2">
              {zone.guidelines.map((guideline: string, i: number) => (
                <li key={i} className="flex items-start">
                  <Icon name="check" className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-700">{guideline}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Check-in/Checkout Form */}
        {user && zone.is_active && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {suggestedAction === 'CHECKIN' ? 'Check In' : 'Check Out'}
            </h2>

            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="text-red-800">{actionData.error}</p>
              </div>
            )}

            {actionData?.success && (
              <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                <p className="text-green-800 font-semibold">{actionData.message}</p>
              </div>
            )}

            <Form method="post">
              <input type="hidden" name="action" value={suggestedAction} />
              <input type="hidden" name="qrCode" value={`RZ${zoneNumber}-${suggestedAction}`} />
              {location && (
                <>
                  <input type="hidden" name="latitude" value={location.latitude} />
                  <input type="hidden" name="longitude" value={location.longitude} />
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all ${
                  suggestedAction === 'CHECKIN'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {isSubmitting ? 'Bezig...' : suggestedAction === 'CHECKIN' ? 'Check In' : 'Check Out'}
              </button>
            </Form>

            {locationError && (
              <p className="text-sm text-gray-500 mt-2 text-center">{locationError}</p>
            )}

            {/* Next Route Section - Show when ready to checkout */}
            {shouldCheckOut && nextZone && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                  <Icon name="map" className="w-5 h-5 mr-2" />
                  Volgende Route
                </h3>
                <p className="text-blue-800 mb-3">Na check-out: {nextZone.title}</p>
                <a
                  href={`/gpx/zones/rz${zoneNumber + 1}-${nextZone.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.gpx`}
                  download
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Icon name="download" className="w-4 h-4 mr-2" />
                  Download GPX Route
                </a>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-semibold mb-4">
              Je moet ingelogd zijn om in te checken
            </p>
            <a
              href="/login"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Inloggen
            </a>
          </div>
        )}

        {/* Check-in History */}
        {checkIns && checkIns.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Jouw Geschiedenis</h2>
            <div className="space-y-2">
              {checkIns.map((checkIn: any) => (
                <div key={checkIn.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center">
                    <Icon 
                      name={checkIn.action === 'CHECKIN' ? 'log-in' : 'log-out'} 
                      className={`w-5 h-5 mr-2 ${checkIn.action === 'CHECKIN' ? 'text-green-500' : 'text-blue-500'}`}
                    />
                    <span className="font-medium">
                      {checkIn.action === 'CHECKIN' ? 'Check-in' : 'Check-out'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(checkIn.checked_at).toLocaleString('nl-NL')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {zone.emergency_contact && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
            <div className="flex items-center">
              <Icon name="alert-triangle" className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="font-bold text-red-900">Noodcontact</h3>
                <p className="text-red-800">{zone.emergency_contact}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
