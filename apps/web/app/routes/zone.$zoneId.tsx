import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useNavigation, redirect } from 'react-router';
import { useState, useRef } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import MapView from '~/components/MapView';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Zone ${data?.zone?.title || ''} - Deur Den Bocht` },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);
  const zoneId = parseInt(params.zoneId || '0');

  if (!user || !zoneId || zoneId < 1 || zoneId > 8) {
    throw new Response('Not Found', { status: 404 });
  }

  try {
    // Get zone info from Sanity
    const zone = await sanityClient.fetch(
      `*[_type == "rallyZone" && order == $order][0] {
        title,
        description,
        location,
        exit,
        lus,
        checkpoint,
        codeHint,
        rejoin,
        points,
        color,
        "imageUrl": image.asset->url,
        startPoint,
        endPoint
      }`,
      { order: zoneId - 1 }
    );

    if (!zone) {
      throw new Response('Zone not found', { status: 404 });
    }

    // Check if already started this zone
    const { data: existingSubmission } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('id, entry_timestamp')
      .eq('participant_id', user.id)
      .eq('zone_id', zoneId.toString())
      .single();

    return { 
      zone, 
      zoneId, 
      user,
      alreadyStarted: !!existingSubmission 
    };
  } catch (error) {
    console.log('[Zone] Offline or error:', error);
    // Return minimal zone data
    return {
      zone: { title: `Zone ${zoneId}`, description: 'Offline', color: 'gray' },
      zoneId,
      user,
      alreadyStarted: false
    };
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  console.info('[zone.$zoneId] action start');

  try {
    await requireUserId(request);
    const user = await getUser(request);
    const zoneId = parseInt(params.zoneId || '0');

    if (!user || !zoneId) {
      return { error: 'Invalid request' };
    }

    const formData = await request.formData();
    const entryLatitude = formData.get('entryLatitude') ? parseFloat(formData.get('entryLatitude') as string) : null;
    const entryLongitude = formData.get('entryLongitude') ? parseFloat(formData.get('entryLongitude') as string) : null;
    const entryAccuracy = formData.get('entryAccuracy') ? parseFloat(formData.get('entryAccuracy') as string) : null;

    const { data: existing } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('id, entry_timestamp')
      .eq('participant_id', user.id)
      .eq('zone_id', zoneId.toString())
      .single();

    if (!existing) {
      await supabaseAdmin
        .from('rally_zone_submissions')
        .insert({
          participant_id: user.id,
          zone_id: zoneId.toString(),
          entry_timestamp: new Date().toISOString(),
          entry_latitude: entryLatitude,
          entry_longitude: entryLongitude,
          entry_accuracy: entryAccuracy,
        });

      console.info('[zone.$zoneId] submission created with GPS', { 
        zoneId, 
        latitude: entryLatitude, 
        longitude: entryLongitude,
        accuracy: entryAccuracy 
      });
    }

    console.info('[zone.$zoneId] action success', { zoneId });
    return redirect('/dashboard/rally-submission');
  } catch (error) {
    console.error('[zone.$zoneId] action error', error);
    return { error: 'Unexpected error' };
  }
}

export default function ZonePage() {
  const { zone, zoneId, alreadyStarted } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isStarting = navigation.state === 'submitting';
  const [locationError, setLocationError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Zone Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {zone.imageUrl && (
            <div className="h-64 overflow-hidden">
              <img
                src={zone.imageUrl}
                alt={zone.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Zone {zoneId}: {zone.title}
              </h1>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                zone.color === 'green' ? 'bg-green-100 text-green-800' :
                zone.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                zone.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {zone.points} punten
              </span>
            </div>
            
            <p className="text-lg text-gray-700 mb-4">{zone.description}</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-sm font-medium text-blue-800">
                📍 {zone.location}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructies</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🚪 Exit</h3>
              <p className="text-gray-700">{zone.exit}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔄 Lus</h3>
              <p className="text-gray-700 whitespace-pre-line">{zone.lus}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Checkpoint</h3>
              <p className="text-gray-700">{zone.checkpoint}</p>
              <p className="text-sm text-gray-600 mt-1">💡 Tip: {zone.codeHint}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">↩️ Terugkeren</h3>
              <p className="text-gray-700">{zone.rejoin}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        {zone.startPoint && zone.endPoint && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kaart</h2>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapView
                startPoint={zone.startPoint}
                endPoint={zone.endPoint}
              />
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {alreadyStarted ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Je bent al gestart!</h3>
              <p className="text-gray-600 mb-4">Veel succes met deze zone.</p>
              <a
                href="/dashboard/rally-submission"
                className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Terug naar Dashboard
              </a>
            </div>
          ) : (
            <form ref={formRef} method="post" className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Klaar om te starten?</h3>
              <p className="text-gray-600 mb-6">
                Door op "Start Zone" te klikken, registreer je dat je deze zone begint.
                Je kunt daarna de code invoeren in het dashboard.
              </p>
              {locationError && (
                <p className="text-sm text-orange-600 mb-4">
                  ⚠️ {locationError} - Je kunt toch doorgaan
                </p>
              )}
              <button
                type="submit"
                disabled={isStarting}
                onClick={(e) => {
                  e.preventDefault();
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        // Add GPS data to form
                        const formData = new FormData(formRef.current!);
                        formData.append('entryLatitude', position.coords.latitude.toString());
                        formData.append('entryLongitude', position.coords.longitude.toString());
                        formData.append('entryAccuracy', position.coords.accuracy.toString());
                        
                        // Submit with GPS data
                        formRef.current?.submit();
                      },
                      (error) => {
                        console.warn('Location error:', error);
                        setLocationError('GPS kon niet worden bepaald');
                        // Submit without GPS
                        formRef.current?.submit();
                      }
                    );
                  } else {
                    // Geolocation not available, submit without GPS
                    formRef.current?.submit();
                  }
                }}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                {isStarting ? 'Bezig...' : '🏁 Start Zone'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
