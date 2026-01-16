import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useNavigation, redirect } from 'react-router';
import { useState, useRef } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import MapView from '~/components/MapView';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `Zone ${data?.zone?.title || ''} - Deur Den Bocht` },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const zoneId = parseInt(params.zoneId || '0');

  if (!zoneId || zoneId < 1 || zoneId > 8) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get zone info from Sanity
  const zone = await sanityClient.fetch(
    `*[_type == "rallyZone" && order == $order][0] {
      title,
      description,
      location,
      zoneType,
      estimatedDistance,
      exit,
      lus,
      checkpoints[] {
        name,
        description,
        codeHint,
        solution,
        validAnswers,
        location
      },
      checkpoint,
      codeHint,
      rejoin,
      points,
      color,
      "imageUrl": image.asset->url,
      startPoint {
        lat,
        lng
      },
      endPoint {
        lat,
        lng
      }
    }`,
    { order: zoneId }
  );

  if (!zone) {
    throw new Response('Zone not found', { status: 404 });
  }

  // Check if already started this zone (only if logged in)
  let existingSubmission = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('id, entry_timestamp')
      .eq('participant_id', user.id)
      .eq('zone_id', zoneId.toString())
      .single();
    existingSubmission = data;
  }

  return { 
    zone, 
    zoneId, 
    user,
    alreadyStarted: !!existingSubmission 
  };
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

    // Get zone info to determine checkpoint count
    const zone = await sanityClient.fetch(
      `*[_type == "rallyZone" && order == $order][0] {
        checkpoints[] { name },
        checkpoint
      }`,
      { order: zoneId - 1 }
    );

    const totalCheckpoints = zone?.checkpoints?.length || 1;

    // Check if any checkpoint for this zone already exists
    const { data: existing } = await supabaseAdmin
      .from('rally_zone_submissions')
      .select('id, checkpoint_number')
      .eq('participant_id', user.id)
      .eq('zone_id', zoneId.toString())
      .limit(1)
      .single();

    if (!existing) {
      // Create records for ALL checkpoints in this zone
      const checkpointRecords = [];
      for (let cpNum = 1; cpNum <= totalCheckpoints; cpNum++) {
        checkpointRecords.push({
          participant_id: user.id,
          zone_id: zoneId.toString(),
          checkpoint_number: cpNum,
          total_checkpoints: totalCheckpoints,
          entry_timestamp: new Date().toISOString(),
          entry_latitude: cpNum === 1 ? entryLatitude : null,  // Only first checkpoint has entry GPS
          entry_longitude: cpNum === 1 ? entryLongitude : null,
          entry_accuracy: cpNum === 1 ? entryAccuracy : null,
        });
      }

      const { error: insertError } = await supabaseAdmin
        .from('rally_zone_submissions')
        .insert(checkpointRecords);

      if (insertError) {
        console.error('[zone.$zoneId] insert error', insertError);
        return { error: 'Failed to create checkpoint records' };
      }

      console.info('[zone.$zoneId] created checkpoint records', { 
        zoneId, 
        totalCheckpoints,
        latitude: entryLatitude, 
        longitude: entryLongitude,
        accuracy: entryAccuracy 
      });
    } else {
      console.info('[zone.$zoneId] zone already started', { zoneId, existing });
    }

    console.info('[zone.$zoneId] action success', { zoneId });
    return redirect('/dashboard/rally-submission');
  } catch (error) {
    console.error('[zone.$zoneId] action error', error);
    return { error: 'Unexpected error' };
  }
}

export default function ZonePage() {
  const { zone, zoneId, user, alreadyStarted } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isStarting = navigation.state === 'submitting';
  const [locationError, setLocationError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Zone Header */}
        <div className="bg-white rounded-sm shadow-lg overflow-hidden mb-6">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                Zone {zoneId}: {zone.title}
              </h1>
              <div className="flex gap-2 flex-wrap">
                {zone.zoneType && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    zone.zoneType === 'short' ? 'bg-green-100 text-green-800' :
                    zone.zoneType === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {zone.zoneType === 'short' ? 'Type A - Kort' : 
                     zone.zoneType === 'medium' ? 'Type B - Middel' : 
                     'Type C - Lang'}
                  </span>
                )}
                {zone.estimatedDistance && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 whitespace-nowrap">
                    ~{zone.estimatedDistance}km
                  </span>
                )}
                <span className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
                  zone.color === 'green' ? 'bg-green-100 text-green-800' :
                  zone.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  zone.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {zone.points} punten
                </span>
              </div>
            </div>
            
            <p className="text-base sm:text-lg text-gray-700 mb-4 break-words">{zone.description}</p>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-xs sm:text-sm font-medium text-blue-800 break-words flex items-center gap-2">
                <Icon name="marker" className="w-4 h-4" />
                {zone.location}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-sm shadow-lg p-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 break-words">Instructies</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🚪 Exit</h3>
              <p className="text-gray-700">{zone.exit}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Icon name="refresh" className="w-5 h-5" />
                Lus
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{zone.lus}</p>
            </div>

            {/* Checkpoints - new multi-checkpoint system */}
            {zone.checkpoints && zone.checkpoints.length > 0 ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Icon name="target" className="w-5 h-5" />
                  Checkpoints ({zone.checkpoints.length})
                </h3>
                <div className="space-y-4">
                  {zone.checkpoints.map((checkpoint: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
                      <h4 className="font-semibold text-gray-900 mb-2">{checkpoint.name}</h4>
                      <p className="text-gray-700 mb-2">{checkpoint.description}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Icon name="lightbulb" className="w-4 h-4" />
                        Tip: {checkpoint.codeHint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Fallback to legacy single checkpoint */
              zone.checkpoint && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Icon name="target" className="w-5 h-5" />
                    Checkpoint
                  </h3>
                  <p className="text-gray-700">{zone.checkpoint}</p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <Icon name="lightbulb" className="w-4 h-4" />
                    Tip: {zone.codeHint}
                  </p>
                </div>
              )
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">↩️ Terugkeren</h3>
              <p className="text-gray-700">{zone.rejoin}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        {zone.startPoint && zone.endPoint ? (
          <div className="bg-white rounded-sm shadow-lg p-6 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 break-words">Kaart</h2>
            <div className="h-96 w-full rounded-sm overflow-hidden border-2 border-gray-300 bg-gray-100">
              <MapView
                startPoint={zone.startPoint}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : null}

        {/* Start Button */}
        <div className="bg-white rounded-sm shadow-lg p-6">
          {!user ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Icon name="lock" className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Log in om te starten</h3>
              <p className="text-gray-600 mb-4">Je moet ingelogd zijn om een zone te kunnen starten.</p>
              <a
                href="/login"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-sm font-bold transition-colors"
              >
                Inloggen
              </a>
            </div>
          ) : alreadyStarted ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Je bent al gestart!</h3>
              <p className="text-gray-600 mb-4">Veel succes met deze zone.</p>
              <a
                href="/dashboard/rally-submission"
                className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-sm font-bold transition-colors"
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
                <p className="text-sm text-orange-600 mb-4 flex items-center gap-1 justify-center">
                  <Icon name="warning" className="w-4 h-4" />
                  {locationError} - Je kunt toch doorgaan
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
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-sm font-bold text-lg transition-colors flex items-center gap-2 mx-auto"
              >
                {isStarting ? 'Bezig...' : (
                  <>
                    <Icon name="flag" className="w-6 h-6" />
                    Start Zone
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
