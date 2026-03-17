import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient, getActiveEdition, getSiteConfig } from '~/lib/sanity.server';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import { Icon } from '~/components/Icon';
import MapView from '~/components/MapView';
import ZoneRouteTips from '~/components/ZoneRouteTips';
import CSRFInput from '~/components/CSRFInput';
import { createRequestLogger } from '~/lib/logger.server';
import { getCSRFToken, verifyCSRFToken } from '~/lib/csrf.server';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const zone = data?.zone;
  const title = zone ? `${zone.title} - Deur Den Bocht` : 'Rally Zone - Deur Den Bocht';
  return [{ title }];
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function action({ params, request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);

  try {
    const isValidToken = await verifyCSRFToken(request);
    if (!isValidToken) {
      return { error: 'Ongeldige formulierinzending. Probeer opnieuw.' };
    }

    const user = await getUser(request);
    if (!user) {
      await requestLogger.warn('zone-checkin', 'Check-in failed: not authenticated');
      return { error: 'Je moet ingelogd zijn' };
    }

    const userLogger = requestLogger.withUser(user.id);
    const { zoneId } = params;

    if (!zoneId || isNaN(parseInt(zoneId))) {
      return { error: 'Ongeldige zone' };
    }

    const formData = await request.formData();
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;

    const zone = await sanityClient.fetch(
      `*[_type == "rallyZone" && order == $order][0] { _id, title, startPoint, is_open }`,
      { order: parseInt(zoneId) }
    );

    if (!zone) {
      return { error: 'Rally zone niet gevonden' };
    }

    if (!zone.is_open && !user.is_admin) {
      return { error: 'Deze zone is momenteel gesloten' };
    }

    if (latitude && longitude && zone.startPoint?.lat && zone.startPoint?.lng) {
      const dist = calculateDistance(
        parseFloat(latitude), parseFloat(longitude),
        zone.startPoint.lat, zone.startPoint.lng
      );
      if (dist > 100) {
        return { error: `Je bent te ver weg! Je moet binnen 100 meter van het startpunt zijn. (${Math.round(dist)}m)` };
      }
    }

    if (!user.is_admin) {
      const { data: existing } = await supabaseAdmin
        .from('rally_zone_checkins')
        .select('id')
        .eq('participant_id', user.id)
        .eq('zone_id', zone._id)
        .maybeSingle();

      if (existing) {
        return { error: 'Je bent al ingecheckt bij deze zone!' };
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from('rally_zone_checkins')
      .insert({
        participant_id: user.id,
        zone_id: zone._id,
        location_lat: latitude ? parseFloat(latitude) : null,
        location_lng: longitude ? parseFloat(longitude) : null,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      });

    if (insertError) {
      await userLogger.error('zone-checkin', 'Database error', insertError as Error);
      return { error: 'Er is iets misgegaan bij het opslaan' };
    }

    await userLogger.info('zone-checkin', 'Check-in successful', { zoneId });

    fetch('/api/check-achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: user.id, action: 'check-participant' }),
    }).catch(() => {});

    return { success: true, message: 'Check-in succesvol! 🏍️' };
  } catch (error) {
    await requestLogger.error('zone-checkin', 'Unexpected error', error as Error);
    return { error: 'Onverwachte fout' };
  }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  const { zoneId } = params;

  if (!zoneId || isNaN(parseInt(zoneId))) {
    throw new Response('Ongeldige zone ID', { status: 400 });
  }

  const zoneOrder = parseInt(zoneId);

  const [zone, allZones, edition, siteConfig, csrfToken] = await Promise.all([
    sanityClient.fetch(
      `*[_type == "rallyZone" && order == $order][0] {
        _id, title, description, location, order, color, is_open,
        "imageUrl": image.asset->url,
        "startLocation": startPoint,
        "endLocation": endPoint,
        skipRoute {
          instructions, estimatedDistance,
          startPoint { lat, lng }, endPoint { lat, lng },
          gpxFile { asset-> { url } }
        },
        routeTips[] {
          name, description, routeType, difficulty, estimatedDistance, character,
          warnings, highlights, exitInstructions, routeInstructions, rejoinInstructions,
          color, gpxFile { asset-> { url } },
          locations[] {
            _key, name, coordinates { lat, lng }, type, description,
            challenge { type, question, hint, options, correctAnswer, points, isActive }
          }
        }
      }`,
      { order: zoneOrder }
    ),
    sanityClient.fetch(`*[_type == "rallyZone"] | order(order asc) { _id, title, order }`),
    getActiveEdition(),
    getSiteConfig(),
    getCSRFToken(request),
  ]);

  if (!zone) {
    throw new Response('Zone niet gevonden', { status: 404 });
  }

  let isCheckedIn = false;
  let completedChallenges: string[] = [];
  let skipUsed = false;

  if (userId) {
    const [checkInResult, challengeResult] = await Promise.all([
      supabaseAdmin
        .from('rally_zone_checkins')
        .select('*')
        .eq('participant_id', userId)
        .eq('zone_id', zone._id)
        .maybeSingle(),
      supabaseAdmin
        .from('route_challenge_submissions')
        .select('location_key')
        .eq('participant_id', userId),
    ]);

    isCheckedIn = !!checkInResult.data;
    skipUsed = !!(checkInResult.data?.took_skip_route || checkInResult.data?.used_skip_route);
    completedChallenges = (challengeResult.data || []).map((c: any) => c.location_key);
  }

  return {
    zone,
    user,
    isCheckedIn,
    completedChallenges,
    skipUsed,
    allZones,
    edition,
    siteConfig,
    csrfToken,
    zoneOrder,
  };
}

export default function ZonePage() {
  const { zone, user, isCheckedIn, completedChallenges, skipUsed, allZones, edition, siteConfig, csrfToken, zoneOrder } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [checkedIn, setCheckedIn] = useState(isCheckedIn);
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (actionData?.success) {
      setCheckedIn(true);
    }
  }, [actionData]);

  useEffect(() => {
    if (zone.startLocation?.lat && zone.startLocation?.lng) {
      fetch(
        `/api/weather?lat=${zone.startLocation.lat}&lon=${zone.startLocation.lng}&location=${encodeURIComponent(zone.title)}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.data) setWeatherData(d.data); })
        .catch(() => {});
    }
  }, [zone]);

  const routeTipCount = zone.routeTips?.length || 0;
  const allHighlights = zone.routeTips?.flatMap((tip: any) =>
    (tip.locations || []).filter((loc: any) => loc.challenge?.isActive !== false && loc.challenge)
  ) || [];
  const highlightCount = allHighlights.length;
  const completedHighlightCount = allHighlights.filter((loc: any) =>
    completedChallenges.includes(loc._key)
  ).length;

  const prevZone = (allZones as any[]).find((z) => z.order === zoneOrder - 1);
  const nextZone = (allZones as any[]).find((z) => z.order === zoneOrder + 1);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header fixed transparent={true} />

      <main className="flex-1">
        {/* Zone Hero */}
        <div className="bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 text-white">
          {zone.imageUrl && (
            <div className="relative h-44 md:h-60 overflow-hidden">
              <img
                src={zone.imageUrl}
                alt={zone.title}
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900 via-primary-900/60 to-transparent" />
            </div>
          )}
          <div className="max-w-7xl mx-auto px-8 py-6 relative">
            {/* Breadcrumb */}
            <nav className="mb-3">
              <Link
                to="/rally"
                className="text-white/70 hover:text-white text-sm flex items-center gap-1 w-fit transition-colors"
              >
                <Icon name="chevron-left" className="w-4 h-4" />
                Rally Zones
              </Link>
            </nav>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <span
                  className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-2 ${
                    zone.is_open
                      ? 'bg-green-500/30 text-green-200'
                      : 'bg-yellow-500/30 text-yellow-200'
                  }`}
                >
                  {zone.is_open ? 'Open' : 'Gesloten'}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{zone.title}</h1>
                {zone.location && (
                  <p className="text-white/70 text-sm italic">{zone.location}</p>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {routeTipCount > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{routeTipCount}</div>
                    <div className="text-xs uppercase tracking-wide text-white/70">Route Tips</div>
                  </div>
                )}
                {highlightCount > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{highlightCount}</div>
                    <div className="text-xs uppercase tracking-wide text-white/70">Highlights</div>
                  </div>
                )}
                {weatherData && (
                  <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
                    <img
                      src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`}
                      className="w-6 h-6"
                      alt=""
                    />
                    <span className="font-bold">{weatherData.temp}°</span>
                  </div>
                )}
              </div>

                {/* Check-in */}
                {user ? (
                  <div className="">
                    {checkedIn ? (
                      <div className="flex items-center gap-3 text-teal-700">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                          <Icon name="check-circle" className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold">Je bent ingecheckt!</p>
                          <p className="text-sm text-teal-600">Je hebt deze zone bezocht.</p>
                        </div>
                      </div>
                    ) : zone.is_open ? (
                      <Form method="post">
                        <CSRFInput token={csrfToken} />
                        {location && (
                          <>
                            <input type="hidden" name="latitude" value={location.lat} />
                            <input type="hidden" name="longitude" value={location.lng} />
                          </>
                        )}

                        {actionData?.error && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-800 text-sm">
                            {actionData.error}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Icon name="map-pin" className="w-5 h-5" />
                          {isSubmitting ? 'Bezig...' : 'Check In bij deze Zone'}
                        </button>

                        {!location && (
                          <p className="text-xs text-gray-400 text-center mt-2">
                            📍 Locatie wordt bepaald — check-in is al mogelijk
                          </p>
                        )}
                      </Form>
                    ) : (
                      <div className="text-center text-yellow-700 bg-yellow-50 rounded-lg p-4">
                        <Icon name="lock" className="w-6 h-6 mx-auto mb-1" />
                        <p className="font-semibold">Zone is gesloten</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
                    <p className="text-yellow-800 font-semibold mb-3">
                      Log in om in te checken bij deze zone
                    </p>
                    <Link
                      to="/login"
                      className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Inloggen
                    </Link>
                  </div>
                )}  
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-6 space-y-5">
          {/* Description */}
          {zone.description && (
            <p className="text-gray-600 leading-relaxed">{zone.description}</p>
          )}

          {/* Map */}
          {(zone.startLocation || zone.endLocation) && (
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-100">
              <MapView
                startPoint={
                  zone.startLocation
                    ? { lat: zone.startLocation.lat, lng: zone.startLocation.lng, name: 'Startpunt' }
                    : undefined
                }
                endPoint={
                  zone.endLocation
                    ? { lat: zone.endLocation.lat, lng: zone.endLocation.lng, name: 'Eindpunt' }
                    : undefined
                }
                className="w-full h-56 md:h-72"
              />
            </div>
          )}

          

          {/* Route Tips */}
          {routeTipCount > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Kies je Route Tip</h2>
              <ZoneRouteTips
                routeTips={zone.routeTips}
                zoneTitle={zone.title}
                zoneId={zone._id}
                zoneStartLocation={zone.startLocation}
                zoneEndLocation={zone.endLocation}
                userLocation={location}
                completedChallenges={completedChallenges}
                isZoneCheckedIn={checkedIn}
                zoneSkipUsed={skipUsed}
                initialIndex={(() => {
                  const tips = zone.routeTips || [];
                  for (let i = 0; i < tips.length; i++) {
                    const tip = tips[i];
                    if (!tip || !Array.isArray(tip.locations)) continue;
                    const active = tip.locations.filter(
                      (loc: any) => loc.challenge && loc.challenge.isActive !== false
                    );
                    if (active.length === 0) continue;
                    if (active.some((loc: any) => !completedChallenges.includes(loc._key))) return i;
                  }
                  return 0;
                })()}
              />
            </div>
          )}


          {/* Zone Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {prevZone ? (
              <Link
                to={`/zone/${prevZone.order}`}
                className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 bg-white rounded-lg px-4 py-2.5 shadow-sm border border-gray-100 transition-colors"
              >
                <Icon name="chevron-left" className="w-4 h-4" />
                {prevZone.title}
              </Link>
            ) : (
              <div />
            )}

            <Link
              to="/rally"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              <Icon name="grid" className="w-4 h-4" />
              Alle Zones
            </Link>

            {nextZone ? (
              <Link
                to={`/zone/${nextZone.order}`}
                className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 bg-white rounded-lg px-4 py-2.5 shadow-sm border border-gray-100 transition-colors"
              >
                {nextZone.title}
                <Icon name="chevron-right" className="w-4 h-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </main>

      <Footer siteConfig={siteConfig} edition={edition} />
    </div>
  );
}
