import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData, useNavigation, Link } from 'react-router';
import { useState, useEffect, useRef } from 'react';
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
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Header fixed transparent={true} />

      <main className="flex-1">
        {/* Hero — split: image left (parallax), info right */}
        <div className="flex flex-col-reverse lg:flex-row lg:items-stretch min-h-[70vh]">

          {/* Text half */}
          <div className="lg:w-[52%] bg-gray-900 text-white flex flex-col justify-center px-8 pt-28 pb-16 lg:px-16 xl:px-24">
            {/* Breadcrumb */}
            <nav className="mb-6">
              <Link to="/rally" className="text-white/40 hover:text-white text-sm flex items-center gap-1 w-fit transition-colors">
                <Icon name="chevron-left" className="w-4 h-4" />
                Rally Zones
              </Link>
            </nav>

            <div className="flex items-center gap-3 mb-5">
              <p className="text-primary-400 font-bold uppercase tracking-widest text-xs">
                Zone {String(zone.order).padStart(2, '0')}
              </p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                zone.is_open ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
              }`}>
                {zone.is_open ? 'Open' : 'Gesloten'}
              </span>
              {checkedIn && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 flex items-center gap-1">
                  <Icon name="checkSimple" className="w-3 h-3" /> Ingecheckt
                </span>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-4 leading-tight">
              {zone.title}
            </h1>

            {zone.location && (
              <div className="flex items-center gap-2 text-white/40 text-sm mb-6 border-l-2 border-primary-500 pl-4">
                <Icon name="marker" className="w-4 h-4 shrink-0" />
                <span>{zone.location}</span>
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-10">
              {routeTipCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon name="map" className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-white leading-none">{routeTipCount}</div>
                    <div className="text-xs text-white/40 mt-0.5">{routeTipCount === 1 ? 'Route' : 'Routes'}</div>
                  </div>
                </div>
              )}
              {highlightCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon name="star" className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-white leading-none">
                      {completedHighlightCount > 0 ? `${completedHighlightCount}/` : ''}{highlightCount}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">Challenges</div>
                  </div>
                </div>
              )}
              {weatherData && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <img src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} className="w-6 h-6" alt="" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-white leading-none">{weatherData.temp}°</div>
                    <div className="text-xs text-white/40 mt-0.5">Nu ter plaatse</div>
                  </div>
                </div>
              )}
            </div>

            {/* Check-in */}
            {user ? (
              checkedIn ? (
                <div className="flex items-center gap-3 text-teal-400">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center shrink-0">
                    <Icon name="check-circle" className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-teal-300">Ingecheckt!</p>
                    <p className="text-sm text-teal-500">Je hebt deze zone bezocht.</p>
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
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                      {actionData.error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Icon name="marker" className="w-4 h-4" />
                    {isSubmitting ? 'Bezig...' : 'Check In bij deze Zone'}
                  </button>
                  {!location && (
                    <p className="text-xs text-white/30 mt-2">📍 Locatie wordt bepaald — check-in is al mogelijk</p>
                  )}
                </Form>
              ) : (
                <div className="flex items-center gap-3 text-yellow-400">
                  <Icon name="lock" className="w-5 h-5" />
                  <span className="font-semibold">Zone is gesloten</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-white/50 text-sm">Log in om in te checken.</p>
                <Link to="/login" className="text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors">
                  Inloggen →
                </Link>
              </div>
            )}
          </div>

          {/* Image half */}
          <div className="lg:w-[48%] h-72 sm:h-[28rem] lg:h-auto relative">
            {zone.imageUrl ? (
              <img src={zone.imageUrl} alt={zone.title} className="w-full h-full object-cover block" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600" />
            )}
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-6 left-6 text-white/[0.10] text-[110px] font-black leading-none select-none">
              {String(zone.order).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-900">
          {/* Description + map row */}
          {(zone.description || zone.startLocation || zone.endLocation) && (
            <div className="border-b border-white/10">
              <div className="max-w-4xl mx-auto px-8 py-14">
                {zone.description && (
                  <p className="text-white/65 text-lg leading-relaxed mb-10">{zone.description}</p>
                )}
                {(zone.startLocation || zone.endLocation) && (
                  <div className="overflow-hidden">
                    <MapView
                      startPoint={zone.startLocation ? { lat: zone.startLocation.lat, lng: zone.startLocation.lng, name: 'Startpunt' } : undefined}
                      endPoint={zone.endLocation ? { lat: zone.endLocation.lat, lng: zone.endLocation.lng, name: 'Eindpunt' } : undefined}
                      className="w-full h-56 md:h-80"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route Tips */}
          {routeTipCount > 0 && (
            <div className="border-b border-white/10">
              <div className="w-full px-8 py-14">
                <p className="text-primary-400 font-bold uppercase tracking-widest text-xs mb-4">Kies je route</p>
                <h2 className="text-3xl font-black text-white mb-8">Route Tips</h2>
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
                      const active = tip.locations.filter((loc: any) => loc.challenge && loc.challenge.isActive !== false);
                      if (active.length === 0) continue;
                      if (active.some((loc: any) => !completedChallenges.includes(loc._key))) return i;
                    }
                    return 0;
                  })()}
                />
              </div>
            </div>
          )}

          {/* Zone navigation */}
          <div className="max-w-4xl mx-auto px-8 py-10 flex items-center justify-between gap-3">
            {prevZone ? (
              <Link to={`/zone/${prevZone.order}`} className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors group">
                <Icon name="chevron-left" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                {prevZone.title}
              </Link>
            ) : <div />}

            <Link to="/rally" className="text-xs text-white/30 hover:text-white/60 uppercase tracking-widest font-semibold transition-colors">
              Alle Zones
            </Link>

            {nextZone ? (
              <Link to={`/zone/${nextZone.order}`} className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors group">
                {nextZone.title}
                <Icon name="chevron-right" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : <div />}
          </div>
        </div>
      </main>

      <Footer siteConfig={siteConfig} edition={edition} />
    </div>
  );
}
