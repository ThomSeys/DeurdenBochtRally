import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link, Form, useActionData, useNavigation } from 'react-router';
import { useState, useEffect } from 'react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import MapView from '~/components/MapView';
import RouteTipsMap from '~/components/RouteTipsMap';
import ZoneRouteTips from '~/components/ZoneRouteTips';
import CheckInModal from '~/components/CheckInModal';
import { getActiveEdition, getSiteConfig, sanityClient } from '~/lib/sanity.server';
import { requireUserId, getUser } from '~/lib/session.server';
import { Icon } from '~/components/Icon';
import { supabaseAdmin } from '~/lib/supabase.server';
import { createRequestLogger } from '~/lib/logger.server';
import { useMasterTour } from '~/components/MasterTour';
import { getCSRFToken, verifyCSRFToken } from '~/lib/csrf.server';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const siteConfig = data?.siteConfig;
  const seoImage = siteConfig?.seoImage?.asset?.url;
  const rallyTitle = `Rally Route - ${siteConfig?.eventName || 'Deur Den Bocht'}`;
  const rallyDescription = `Ontdek de spektakulaire rally route van ${siteConfig?.eventName || 'Deur Den Bocht'}, check in op rally zones en volg je vrienden live.`;
  
  return [
    { title: rallyTitle },
    { name: 'description', content: rallyDescription },
    // Open Graph tags for social media sharing
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: rallyTitle },
    { property: 'og:description', content: rallyDescription },
    ...(seoImage ? [{ property: 'og:image', content: seoImage }] : []),
    { property: 'og:url', content: 'https://deurdenbochtmotorrit.be/rally' },
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: rallyTitle },
    { name: 'twitter:description', content: rallyDescription },
    ...(seoImage ? [{ name: 'twitter:image', content: seoImage }] : []),
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);

  try {
    // Verify CSRF token first
    const isValidToken = await verifyCSRFToken(request);
    if (!isValidToken) {
      await requestLogger.warn('rally-checkin', 'Check-in failed: invalid CSRF token');
      return { error: 'Invalid form submission. Please try again.', status: 403 };
    }

    const user = await getUser(request);
    if (!user) {
      await requestLogger.warn('rally-checkin', 'Check-in failed: user not authenticated');
      return { error: 'Je moet ingelogd zijn' };
    }

    const userLogger = requestLogger.withUser(user.id);
    const formData = await request.formData();
    const zoneId = formData.get('zoneId') as string;
    const latitude = formData.get('latitude') as string;
    const longitude = formData.get('longitude') as string;
    const selectedBuddiesStr = (formData.get('selectedBuddies') as string) || '';
    const selectedBuddyIds = selectedBuddiesStr ? selectedBuddiesStr.split(',').filter(Boolean) : [];
    

    if (!zoneId) {
      await userLogger.warn('rally-checkin', 'Check-in failed: missing zone ID');
      return { error: 'Zone ID is required' };
    }

    // Fetch zone start location from Sanity to validate proximity
    const zone = await sanityClient.fetch(`
      *[_type == "rallyZone" && _id == $zoneId][0] { _id, title, startPoint }
    `, { zoneId });

    if (!zone || !zone.startPoint) {
      await userLogger.warn('rally-checkin', 'Check-in failed: zone not found or missing startPoint', { zoneId });
      return { error: 'Rally zone niet gevonden' };
    }

    // If latitude/longitude were provided, ensure user is within 100 meters
    if (latitude && longitude) {
      const dist = calculateDistance(parseFloat(latitude), parseFloat(longitude), zone.startPoint.lat, zone.startPoint.lng);
      if (dist > 100) {
        return { error: `Je bent te ver weg! Je moet binnen 100 meter van het startpunt zijn. (huidige afstand: ${Math.round(dist)}m)` };
      }
    }

    // Check if already checked in
    if (!user.is_admin) {
      const { data: existingCheckIn } = await supabaseAdmin
        .from('rally_zone_checkins')
        .select('id')
        .eq('participant_id', user.id)
        .eq('zone_id', zoneId)
        .single();

      if (existingCheckIn) {
        await userLogger.warn('rally-checkin', 'Duplicate check-in attempt', { zoneId });
        return { error: 'Je hebt deze zone al bezocht!' };
      }
    }

    // Respect user's choice to use the skip route if submitted in the form
    const useSkipRoute = (formData.get('useSkipRoute') as string) === '1';

    // Create check-in (include used_skip_route flag if the column exists)
    // Prepare check-ins array for user + any selected buddies
    const checkInsToCreate: any[] = [];

    checkInsToCreate.push({
      participant_id: user.id,
      zone_id: zoneId,
      location_lat: latitude ? parseFloat(latitude) : null,
      location_lng: longitude ? parseFloat(longitude) : null,
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
    });

    // Ensure we don't create duplicate buddy check-ins: fetch existing check-ins for these buddies
    let filteredBuddyIds = selectedBuddyIds.slice();
    let skippedBuddyIds: string[] = [];
    if (filteredBuddyIds.length > 0) {
      try {
        const { data: existingForBuddies } = await supabaseAdmin
          .from('rally_zone_checkins')
          .select('participant_id')
          .in('participant_id', filteredBuddyIds)
          .eq('zone_id', zoneId);

        const existingSet = new Set((existingForBuddies || []).map((r: any) => r.participant_id));
        skippedBuddyIds = filteredBuddyIds.filter(id => existingSet.has(id));
        filteredBuddyIds = filteredBuddyIds.filter(id => !existingSet.has(id));
      } catch (e) {
        // ignore lookup errors and proceed with provided list
      }
    }

    // Add buddy check-ins (marked as checked in by this user) for filtered IDs only
    for (const buddyId of filteredBuddyIds) {
      checkInsToCreate.push({
        participant_id: buddyId,
        zone_id: zoneId,
        location_lat: latitude ? parseFloat(latitude) : null,
        location_lng: longitude ? parseFloat(longitude) : null,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      });
    }

    // Attach skip route flag for the user's check-in only
    if (useSkipRoute) {
      if (checkInsToCreate[0]) checkInsToCreate[0].took_skip_route = true;
    }

    let insertError = null;
    try {
      const res = await supabaseAdmin.from('rally_zone_checkins').insert(checkInsToCreate);
      insertError = (res as any).error || null;
    } catch (e: any) {
      insertError = e;
    }

    // If PostgREST reports the used_skip_route column is missing, retry without it
    if (insertError && (insertError.code === 'PGRST204' || (insertError.message && String(insertError.message).includes("used_skip_route")))) {
      await userLogger.warn('rally-checkin', 'used_skip_route column missing; retrying insert without it', { zoneId });
      const payloadWithoutFlag = { ...insertPayload };
      delete payloadWithoutFlag.used_skip_route;
      try {
        const res2 = await supabaseAdmin.from('rally_zone_checkins').insert(payloadWithoutFlag);
        insertError = (res2 as any).error || null;
      } catch (e: any) {
        insertError = e;
      }
    }

    if (insertError) {
      await userLogger.error('rally-checkin', 'Database error during check-in', insertError);
      return { error: 'Er is iets misgegaan bij het opslaan' };
    }

    await userLogger.info('rally-checkin', 'Check-in successful', { zoneId });

    // Trigger achievement check
    try {
      await fetch(`${new URL(request.url).origin}/api/check-achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          participantId: user.id,
          action: 'check-participant'
        })
      });
    } catch (error) {
      console.error('Failed to trigger achievement check:', error);
    }

    // Send notifications to buddies who were actually checked in (filtered list)
    if (filteredBuddyIds.length > 0) {
      try {
        const { data: checkerInfo } = await supabaseAdmin
          .from('participants')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const zoneInfo = await sanityClient.fetch(`
          *[_type == "rallyZone" && _id == $zoneId][0] { title }
        `, { zoneId });

        for (const buddyId of filteredBuddyIds) {
          const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('participant_id', buddyId)
            .eq('is_active', true);

          if (subscriptions && subscriptions.length > 0) {
            const { sendPushNotificationWithHistory } = await import('~/lib/push-notifications-enhanced.server');
            await sendPushNotificationWithHistory(
              subscriptions,
              {
                title: 'Groeps Check-in! 🏍️',
                body: `${checkerInfo?.first_name} ${checkerInfo?.last_name} heeft je ingecheckt bij ${zoneInfo?.title || 'een zone'}`,
                tag: 'buddy-checkin',
              },
              {
                title: 'Groeps Check-in! 🏍️',
                body: `${checkerInfo?.first_name} ${checkerInfo?.last_name} heeft je ingecheckt bij ${zoneInfo?.title || 'een zone'}`,
                eventType: 'buddy_checkin',
                targetType: 'single',
                sentBy: user.id,
                eventData: { zone_id: zoneId, checked_in_by: user.id },
              }
            );
          }
        }
      } catch (notifError) {
        console.error('[rally] Failed to send buddy check-in notifications:', notifError);
      }
    }

    return { success: true, message: 'Check-in succesvol!', usedSkipRoute: useSkipRoute, zoneId, buddiesCheckedIn: filteredBuddyIds.length, buddiesSkipped: skippedBuddyIds.length };
  } catch (error: any) {
    await requestLogger.error('rally-checkin', 'Unexpected error during check-in', error);
    return { error: 'Er is een onverwachte fout opgetreden' };
  }
}

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Require authentication to access rally page
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Rally page loaded');
  
  // Fetch user, edition, and config in parallel
  const [user, edition, siteConfig] = await Promise.all([
    getUser(request),
    getActiveEdition(),
    getSiteConfig(),
  ]);
  
  // Get Event Segments (Concept B)
  // Admins can see all zones, non-admins only see active zones
  const filterCondition = user?.is_admin ? '' : ' && is_open == true';
  const segments = await sanityClient.fetch(`
    *[_type == "rallyZone"${filterCondition}] | order(order asc) {
      _id,
      title,
      description,
      location,
      order,
      color,
      is_open,
      is_active,
      "startLocation": startPoint,
      "endLocation": endPoint,
      skipRoute {
        instructions,
        estimatedDistance,
        startPoint { lat, lng },
        endPoint { lat, lng },
        gpxFile { asset-> { url } }
      },
      routeTips[] {
        name,
        description,
        routeType,
        difficulty,
        estimatedDistance,
        character,
        warnings,
        highlights,
        exitInstructions,
        routeInstructions,
        rejoinInstructions,
        color,
        locations[] {
          _key,
          name,
          coordinates {
            lat,
            lng
          },
          type,
          description,
          challenge {
            type,
            question,
            hint,
            options,
            correctAnswer,
            points,
            isActive
          }
        }
      }
    }
  `);

  console.log('[rally] user:', user?.email, 'is_admin:', user?.is_admin, 'segments count:', segments.length);

  // Get user's check-ins if logged in
  let userCheckIns: string[] = [];
  let completedChallenges: string[] = [];
  if (userId) {
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('id', userId)
      .single();

      if (participant) {
      const { data: checkIns } = await supabaseAdmin
        .from('rally_zone_checkins')
        .select('*')
        .eq('participant_id', participant.id);

      if (checkIns) {
        // Get unique zone IDs that the user has checked into
        userCheckIns = [...new Set(checkIns.map((ci: any) => ci.zone_id))];
        console.log('[rally] userCheckIns:', userCheckIns);

        // Build map of which zones were checked-in with a skip-route flag
        const skipMap: Record<string, boolean> = {};
        checkIns.forEach((ci: any) => {
          const zone = ci.zone_id;
          const used = !!(ci.took_skip_route || ci.used_skip_route || ci.tookSkipRoute || ci.usedSkipRoute);
          if (zone) skipMap[zone] = skipMap[zone] || used;
        });

        // Attach to the return payload via a variable we'll include below
        (globalThis as any).__rally_skip_map = skipMap;
        console.log('[rally] skipMap:', skipMap);
      }

      // Get completed challenges
      const { data: challengeSubmissions } = await supabaseAdmin
        .from('route_challenge_submissions')
        .select('location_key')
        .eq('participant_id', participant.id);

      if (challengeSubmissions) {
        completedChallenges = challengeSubmissions.map(cs => cs.location_key);
        console.log('[rally] completedChallenges:', completedChallenges.length);
      }
    }
  }

  // Read skip map attached above (defensive fallback)
  const loaderSkipMap = (globalThis as any).__rally_skip_map || {};

  // Get user's accepted buddies for group check-in (both directions)
  let buddiesList: Array<any> = [];
  if (userId) {
    const { data: buddyRows } = await supabaseAdmin
      .from('participant_buddies')
      .select('participant_id, buddy_id, buddy_first_name, buddy_last_name, buddy_profile_photo_url')
      .or(`participant_id.eq.${userId},buddy_id.eq.${userId}`)
      .eq('status', 'accepted');

    const reverseIds: string[] = [];
    const temp: Array<any> = [];
    (buddyRows || []).forEach((r: any) => {
      if (r.participant_id === userId) {
        temp.push({ buddy_id: r.buddy_id, buddy: { id: r.buddy_id, first_name: r.buddy_first_name, last_name: r.buddy_last_name }, buddy_profile_photo_url: r.buddy_profile_photo_url });
      } else if (r.buddy_id === userId) {
        // we'll need to fetch the participant's name & photo separately
        temp.push({ buddy_id: r.participant_id, buddy: { id: r.participant_id, first_name: null, last_name: null }, buddy_profile_photo_url: null });
        if (r.participant_id) reverseIds.push(r.participant_id);
      }
    });

    if (reverseIds.length > 0) {
      const { data: participants } = await supabaseAdmin
        .from('participants')
        .select('id, first_name, last_name, profile_photo_url')
        .in('id', reverseIds);

      const byId: Record<string, any> = {};
      (participants || []).forEach((p: any) => { byId[p.id] = p; });

         temp.forEach((t) => {
           if (byId[t.buddy.id]) {
             if ((!t.buddy.first_name || !t.buddy.last_name) && byId[t.buddy.id]) {
               t.buddy.first_name = byId[t.buddy.id].first_name;
               t.buddy.last_name = byId[t.buddy.id].last_name;
             }
             // attach their profile photo if available
             if (byId[t.buddy.id].profile_photo_url) {
               t.buddy_profile_photo_url = byId[t.buddy.id].profile_photo_url;
             }
           }
         });

         // Server-side dedupe: merge entries by buddy_id and prefer any available photo or names
         const byBuddyId = new Map<string, any>();
         for (const t of temp) {
           const id = t.buddy_id;
           if (!id) continue;
           if (!byBuddyId.has(id)) {
             // normalize structure to what the component expects
             byBuddyId.set(id, {
               buddy_id: id,
               buddy: { id: t.buddy.id, first_name: t.buddy.first_name, last_name: t.buddy.last_name },
               buddy_profile_photo_url: t.buddy_profile_photo_url || null,
             });
           } else {
             const existing = byBuddyId.get(id);
             // fill missing name fields
             if ((!existing.buddy.first_name || !existing.buddy.last_name) && (t.buddy.first_name || t.buddy.last_name)) {
               existing.buddy.first_name = existing.buddy.first_name || t.buddy.first_name;
               existing.buddy.last_name = existing.buddy.last_name || t.buddy.last_name;
             }
             // prefer existing photo, otherwise take new one if present
             if (!existing.buddy_profile_photo_url && t.buddy_profile_photo_url) {
               existing.buddy_profile_photo_url = t.buddy_profile_photo_url;
             }
           }
         }

         buddiesList = Array.from(byBuddyId.values());
    }

    buddiesList = temp.filter(t => t.buddy && t.buddy.id);
  }

  return { userId, user, edition, segments, siteConfig, userCheckIns, completedChallenges, csrfToken: await getCSRFToken(request), skipUsedZones: loaderSkipMap, buddies: buddiesList };
}

function RallyTourButton() {
  const { startPageTour } = useMasterTour();
  return (
    <button
      onClick={() => startPageTour('/rally')}
      className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white font-semibold transition-all"
    >
      <Icon name="help-circle" className="w-5 h-5" />
      <span>Rondleiding</span>
    </button>
  );
}

export default function Rally() {
  const { userId, user, edition, segments, siteConfig, userCheckIns, completedChallenges, csrfToken, skipUsedZones, buddies } = useLoaderData<typeof loader>();

  console.log("🚀 ~ Rally ~ buddies:", buddies);

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [visibleMaps, setVisibleMaps] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [checkInModalZone, setCheckInModalZone] = useState<any>(null);
  const [zoneWeatherData, setZoneWeatherData] = useState<Record<string, any>>({});
  const [selectedWeatherZone, setSelectedWeatherZone] = useState<any>(null);
  const [localCheckedIn, setLocalCheckedIn] = useState<Set<string>>(new Set(userCheckIns || []));
  const [skipUsedMap, setSkipUsedMap] = useState<Record<string, boolean>>(skipUsedZones || {});
  const checkedInSet = localCheckedIn;

  // Keep localCheckedIn in sync when loader updates
  useEffect(() => {
    setLocalCheckedIn(new Set(userCheckIns || []));
  }, [userCheckIns]);

  // Initialize skipUsedMap from loader-provided values (persisted choices)
  useEffect(() => {
    if (skipUsedZones && Object.keys(skipUsedZones).length > 0) {
      setSkipUsedMap(skipUsedZones);
    }
  }, [skipUsedZones]);
  const isSubmitting = navigation.state === 'submitting';

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('[rally] Geolocation error:', error.message);
        }
      );
    }
  }, []);

  // Close modal on successful check-in
  useEffect(() => {
    if (actionData?.success) {
      setCheckInModalZone(null);
      // Optimistically add this zone to the local checked-in set so UI updates immediately
      if (actionData.zoneId) {
        setLocalCheckedIn((prev) => {
          const next = new Set(prev);
          next.add(actionData.zoneId);
          return next;
        });
      }

      // Record whether the user used the skip route for this zone
      if (actionData.usedSkipRoute && actionData.zoneId) {
        setSkipUsedMap((prev) => ({ ...prev, [actionData.zoneId]: true }));
      }
    }
  }, [actionData]);

  // Fetch weather data for each segment
  useEffect(() => {
    const fetchZoneWeather = async () => {
      const weatherData: Record<string, any> = {};
      
      for (const segment of segments) {
        // Try to get coordinates from startLocation, fallback to first routeTip location
        let lat: number | undefined;
        let lng: number | undefined;
        
        if (segment.startLocation?.coordinates) {
          lat = segment.startLocation.coordinates.lat;
          lng = segment.startLocation.coordinates.lng;
        } else if (segment.routeTips?.[0]?.locations?.[0]?.coordinates) {
          lat = segment.routeTips[0].locations[0].coordinates.lat;
          lng = segment.routeTips[0].locations[0].coordinates.lng;
        }
        
        if (lat && lng) {
          try {
            const response = await fetch(
              `/api/weather?lat=${lat}&lon=${lng}&location=${encodeURIComponent(segment.title)}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.data) {
                weatherData[segment._id] = data.data;
              }
            }
          } catch (error) {
            console.error(`Failed to fetch weather for ${segment.title}:`, error);
          }
        } else {
          console.warn(`No coordinates found for segment ${segment.title}`);
        }
      }
      
      setZoneWeatherData(weatherData);
    };

    if (segments.length > 0) {
      fetchZoneWeather();
    }
  }, [segments]);

  const toggleMap = (segmentId: string) => {
    setVisibleMaps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentId)) {
        newSet.delete(segmentId);
      } else {
        newSet.add(segmentId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">De Rally Route</h1>
          <p className="text-xl max-w-3xl mx-auto">
            8 adventure segmenten om je rit onvergetelijk te maken
          </p>
          <RallyTourButton />
        </div>
      </section>

      {/* How it works */}
      <section data-tour="rally-how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Hoe werkt het?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">1. Kies Je Avontuur</h3>
              <p className="text-gray-700">Kies tussen de volledige route of selecteer specifieke rally zones die jou aanspreken</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">2. Download & Rijd</h3>
              <p className="text-gray-700">Download de GPX en geniet van prachtige wegen, bochten en landschappen</p>
            </div>
            <div data-tour="rally-checkin-info" className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">3. Check In (Optioneel)</h3>
              <p className="text-gray-700">Scan QR codes bij zones om je reis te tracken - geen verplichting, gewoon voor de fun!</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">4. Doe de challenges (Optioneel)</h3>
              <p className="text-gray-700">Voltooi uitdagingen om punten te verdienen - Samen maken we er wat legendarisch van!</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">5. Deel Je Verhaal</h3>
              <p className="text-gray-700">Upload foto's en deel je beleving met de community - dát maakt jou een echte bocht-held!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rally Route Segments */}
      {segments && segments.length > 0 && (
        <section data-tour="rally-segments" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              De Rally Route - {segments.length} Segmenten
            </h2>
            
            {/* Complete Route User Notice */}
            {user?.route_preference === 'scenic' && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-sm mb-8 max-w-4xl mx-auto">
                <div className="flex items-start">
                  <Icon name="info" className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Scenic Route Modus
                    </h3>
                    <p className="text-blue-800 mb-3">
                      Je hebt gekozen voor de <strong>Scenic Route</strong> ervaring. Deze rally zones zijn optioneel voor jou - je kunt de volledige route rijden zonder in te checken bij specifieke zones.
                    </p>
                    <p className="text-blue-700 text-sm">
                      💡 Tip: Download je GPX route vanuit het dashboard en geniet gewoon van de rit!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {segments.map((segment: any) => {
                const isCheckedIn = checkedInSet.has(segment._id);
                const canViewData = isCheckedIn || user?.is_admin || true; // Always show for now
                  
                return (
                  <details
                    key={segment._id}
                    className={`group border-l-4 rounded-lg shadow-lg overflow-hidden bg-white border-${segment.color || 'gray'}-500`}
                    open
                  >
                    <summary className="p-6 md:p-8 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col gap-3 mb-2">
                            <div>
                            {segment.is_open ? (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                Open
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                                Gesloten
                              </span>
                            )}</div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                              {segment.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 text-sm ml-8">{segment.location}</p>
                        </div>
                        <div className="text-right ml-4 flex flex-col gap-3">
                          <div className="inline-block bg-gray-50 px-4 py-2 rounded-lg">
                            <span className="text-sm text-gray-600">Afstand</span>
                            <div className="text-xl font-bold text-primary-600">
                              {segment.routeTips?.length > 0 
                                ? `${Math.min(...segment.routeTips.map((t: any) => t.estimatedDistance))}-${Math.max(...segment.routeTips.map((t: any) => t.estimatedDistance))} km`
                                : '- km'
                              }
                            </div>
                          </div>
                          {zoneWeatherData[segment._id] && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedWeatherZone({ ...zoneWeatherData[segment._id], zoneName: segment.title });
                              }}
                              className="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg transition-colors border border-sky-200"
                            >
                              <img
                                src={`https://openweathermap.org/img/wn/${zoneWeatherData[segment._id].icon}@2x.png`}
                                alt="weather"
                                className="w-6 h-6"
                              />
                              <span className="text-sm font-semibold text-sky-900">{zoneWeatherData[segment._id].temp}°</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </summary>
                    
                    <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-gray-100">
                      {segment.description && (
                        <p className="text-gray-700 mb-6 mt-4">{segment.description}</p>
                      )}
                      
                      {/* Route Tips or Hazepad download if user used skip route */}
                      {segment.routeTips && segment.routeTips.length > 0 && (
                        <div data-tour="rally-tips">
                          {skipUsedMap[segment._id] === true && segment.skipRoute?.gpxFile?.asset?.url ? (
                            (() => {
                              const gpxUrl = segment.skipRoute.gpxFile.asset.url;
                              const gpxFilename = decodeURIComponent((gpxUrl.split('/').pop() || 'route.gpx'));
                              // Try to derive sensible start/end points for MapView fallbacks
                              const skipStart = segment.skipRoute?.startPoint?.lat
                                ? { lat: segment.skipRoute.startPoint.lat, lng: segment.skipRoute.startPoint.lng, name: `${segment.title} start` }
                                : segment.startLocation?.coordinates
                                ? { lat: segment.startLocation.coordinates.lat, lng: segment.startLocation.coordinates.lng }
                                : undefined;
                              const skipEnd = segment.skipRoute?.endPoint?.lat
                                ? { lat: segment.skipRoute.endPoint.lat, lng: segment.skipRoute.endPoint.lng, name: `${segment.title} einde` }
                                : segment.endLocation?.coordinates
                                ? { lat: segment.endLocation.coordinates.lat, lng: segment.endLocation.coordinates.lng }
                                : undefined;

                              return (
                                <>
                                  <div className="mb-4 p-4 rounded-sm border border-dashed border-primary-200 bg-primary-50 flex items-center justify-between">
                                    <div>
                                      <h5 className="font-semibold text-primary-900">Hazepad geselecteerd</h5>
                                      <p className="text-sm text-gray-700">Je hebt gekozen voor het hazepad — routetips en challenges zijn uitgeschakeld voor deze zone.</p>
                                    </div>
                                    <a
                                      href={gpxUrl}
                                      download={gpxFilename}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded"
                                    >
                                      <Icon name="download" className="w-4 h-4" />
                                      Download GPX
                                    </a>
                                  </div>

                                  {/* Inline map showing the skip GPX and user's location */}
                                  <div className="mt-4 rounded-sm overflow-hidden border border-gray-100">
                                    <MapView
                                      startPoint={skipStart}
                                      endPoint={skipEnd}
                                      skipGpxUrl={gpxUrl}
                                      className="w-full h-64"
                                    />
                                  </div>
                                </>
                              );
                            })()
                          ) : (
                            <ZoneRouteTips
                              routeTips={segment.routeTips}
                              zoneTitle={segment.title}
                              zoneId={segment._id}
                              zoneStartLocation={segment.startLocation}
                              zoneEndLocation={segment.endLocation}
                              userLocation={userLocation}
                              completedChallenges={completedChallenges || []}
                              isZoneCheckedIn={checkedInSet.has(segment._id)}
                              zoneSkipUsed={skipUsedMap[segment._id] === true}
                            />
                          )}
                        </div>
                      )}

                      {/* Check-in Button */}
                      {userId && !checkedInSet.has(segment._id) && (
                        <button
                          data-tour="rally-checkin-button"
                          onClick={() => setCheckInModalZone(segment)}
                          className="w-full mt-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 py-4 rounded-sm font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          <Icon name="map-pin" className="w-5 h-5" />
                          Check In bij deze Zone
                        </button>
                      )}

                      {userId && checkedInSet.has(segment._id) && (
                        <div className="mt-4 bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-400 p-4 rounded-sm shadow-sm">
                          <p className="text-teal-900 font-bold flex items-center gap-2">
                            <Icon name="check-circle" className="w-5 h-5" />
                            Je bent in deze zone al ingecheckt!
                          </p>
                        </div>
                      )}
                      
                      {!segment.is_open && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-sm mt-4">
                          <p className="text-yellow-800 font-semibold flex items-center gap-2">
                            <Icon name="info" className="w-5 h-5" />
                            Dit segment is momenteel niet actief
                          </p>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Check-in Modal */}
      {checkInModalZone && (
        <CheckInModal
          isOpen={!!checkInModalZone}
          onClose={() => setCheckInModalZone(null)}
          zone={checkInModalZone}
          actionData={actionData}
          isSubmitting={isSubmitting}
          csrfToken={csrfToken}
          buddies={buddies}
        />
      )}

      {/* Weather Detail Modal */}
      {selectedWeatherZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1100]">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-6 border-b border-sky-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold">Weerinfo</p>
                  <h3 className="text-2xl font-bold text-sky-900 mt-1">{selectedWeatherZone.zoneName}</h3>
                </div>
                <button
                  onClick={() => setSelectedWeatherZone(null)}
                  className="text-sky-600 hover:text-sky-900 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Current Weather */}
              <div className="flex items-center gap-4 bg-sky-50 p-4 rounded-lg">
                <img
                  src={`https://openweathermap.org/img/wn/${selectedWeatherZone.icon}@2x.png`}
                  alt={selectedWeatherZone.description}
                  className="w-16 h-16"
                />
                <div>
                  <div className="text-4xl font-bold text-sky-900">{selectedWeatherZone.temp}°</div>
                  <p className="text-sm text-sky-700 capitalize">{selectedWeatherZone.description}</p>
                </div>
              </div>

              {/* Weather Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Gevoelstemperatuur</span>
                  <span className="font-semibold text-gray-900">{selectedWeatherZone.feels_like}°</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Windsnelheid</span>
                  <span className="font-semibold text-gray-900">{selectedWeatherZone.wind_speed} km/h</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Luchtvochtigheid</span>
                  <span className="font-semibold text-gray-900">{selectedWeatherZone.humidity}%</span>
                </div>
                {selectedWeatherZone.rain_probability > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Kans op regen</span>
                    <span className="font-semibold text-gray-900">{selectedWeatherZone.rain_probability}%</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedWeatherZone(null)}
                className="w-full mt-4 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {!userId && edition?.registrationOpen && (
        <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Klaar voor het avontuur?</h2>
            <p className="text-xl mb-8">
              Schrijf je in en ontdek de mooiste routes en verhalen
            </p>
            <Link
              to="/registration"
              className="inline-block bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-sm text-lg font-semibold transition-colors"
            >
              Inschrijven
            </Link>
          </div>
        </section>
      )}

      <Footer siteConfig={siteConfig} edition={edition} />
    </div>
  );
}
