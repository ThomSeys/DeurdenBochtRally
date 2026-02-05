import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link, Form } from 'react-router';
import { useState, useEffect } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabase, supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import { FORMULA_LABELS, RIDE_TYPE_LABELS } from '~/lib/utils';
import { isFeatureEnabled } from '~/lib/feature-flags.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { OnboardingTour, startOnboardingTour } from '~/components/OnboardingTour';
import { createRequestLogger } from '~/lib/logger.server';

declare global {
  interface Window {
    ENV?: {
      VAPID_PUBLIC_KEY?: string;
    };
  }
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Dashboard - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Dashboard home loaded');
  
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get zone check-ins (Concept B)
  const { data: zoneCheckins } = await supabase
    .from('rally_zone_checkins')
    .select('*')
    .eq('participant_id', user.id);

  // Get documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('category', { ascending: true });

  // Fetch GPX route file
  const siteConfig = await sanityClient.fetch(`
    *[_type == "siteConfig"][0] {
      gpxRouteFile {
        asset-> {
          url
        }
      }
    }
  `);

  const rallyZones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      character,
      color,
      "startLocation": startPoint,
      "endLocation": endPoint,
      "is_open": coalesce(is_active, true),
      emergency_contact,
      routeTips[] {
        _id,
        name,
        color,
        locations[] {
          _key,          _key,          name,
          coordinates {
            lat,
            lng
          },
          type,
          description,
          challenge {
            _id,
            question,
            hint,
            type,
            correctAnswer,
            points
          }
        },
      }
    }
  `);

  // Count completed zones (unique zone IDs)
  const completedZones = zoneCheckins ? new Set(zoneCheckins.map(c => c.zone_id)).size : 0;

  // Get challenge stats
  let challengeStats = {
    total_points_earned: 0,
    total_submitted: 0,
    total_correct: 0,
  };

  let completedChallenges = [];

  // Get stats for all validated submissions
  const { data: stats, error: statsError } = await supabaseAdmin
    .from('route_challenge_submissions')
    .select('points_awarded, is_correct')
    .eq('participant_id', user.id)
    .eq('is_validated', true);

  if (stats && !statsError) {
    challengeStats = {
      total_points_earned: stats.reduce((sum, s) => sum + (s.points_awarded || 0), 0),
      total_submitted: stats.length,
      total_correct: stats.filter(s => s.is_correct).length,
    };
  }

  // Get all challenge submissions with details (show all, not just validated)
  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('route_challenge_submissions')
    .select('*')
    .eq('participant_id', user.id)
    .order('submitted_at', { ascending: false });

  if (submissions && !submissionsError) {
    // Use the rallyZones data we already fetched to enrich submissions
    completedChallenges = (submissions as any[]).map((sub) => {
      let enrichedSub: any = { ...sub };
      
      // Find the zone using zone_id
      const zone = rallyZones.find((z: any) => z._id === sub.zone_id);
      if (zone) {
        enrichedSub.rally_zones = { name: zone.title };
        
        // Find the correct location using location_key
        for (const tip of zone.routeTips || []) {
          const location = tip.locations?.find((loc: any) => loc._key === sub.location_key);
          if (location && location.challenge) {
            enrichedSub.route_tips = { 
              title: tip.name
            };
            enrichedSub.challenge_details = {
              _id: location.challenge._id,
              question: location.challenge.question,
              hint: location.challenge.hint,
              type: location.challenge.type,
              points: location.challenge.points,
              correctAnswer: location.challenge.correctAnswer,
              submittedAnswer: sub.text_answer
            };
            break;
          }
        }
      }
      
      return enrichedSub;
    });
  }

  // V1: No competition/ranking - disabled for story-focused experience
  const isBochtenkoning = false;

  const eventDate = process.env.EVENT_DATE || '2026-08-08';
  
  // Generate QR code URL on server to avoid hydration mismatch
  const checkInUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/check-in/${user.id}`;
  const qrCodeUrl = `/api/qrcode?text=${encodeURIComponent(checkInUrl)}`;
// Get feature flags
  const rallyZonesEnabled = await isFeatureEnabled('rally-zones-enabled');
  const photoGalleryEnabled = await isFeatureEnabled('photo-gallery-enabled');
  const rideStoriesEnabled = await isFeatureEnabled('ride-stories-enabled');
  const achievementsEnabled = await isFeatureEnabled('achievements-enabled');
  const profileEditingEnabled = await isFeatureEnabled('profile-editing-enabled');
  const pushNotificationsEnabled = await isFeatureEnabled('push-notifications-enabled');
  const onboardingTourEnabled = await isFeatureEnabled('onboarding-tour-enabled');

  return { 
    user, 
    zoneCheckins, 
    documents, 
    completedZones, 
    isBochtenkoning, 
    eventDate,
    gpxRouteUrl: siteConfig?.gpxRouteFile?.asset?.url,
    qrCodeUrl, 
    rallyZonesEnabled,
    photoGalleryEnabled, 
    rideStoriesEnabled, 
    achievementsEnabled,
    profileEditingEnabled, 
    pushNotificationsEnabled,
    onboardingTourEnabled, 
    routePreference: user.route_preference || 'adventure', // Default to adventure
    challengeStats,
    completedChallenges,
    rallyZones
  };
}

export default function Dashboard() {
  const { user, zoneCheckins, documents, completedZones, isBochtenkoning, eventDate, gpxRouteUrl, qrCodeUrl, routePreference, rallyZonesEnabled, pushNotificationsEnabled, photoGalleryEnabled, rideStoriesEnabled, achievementsEnabled, onboardingTourEnabled, challengeStats, completedChallenges, rallyZones } = useLoaderData<typeof loader>();

  const [qrError, setQrError] = useState(false);
  const [isNotificationSubscribed, setIsNotificationSubscribed] = useState(false);
  const [pushDebugInfo, setPushDebugInfo] = useState<string>('');
  const [showChallengesModal, setShowChallengesModal] = useState(false);

  // Check if already subscribed to push notifications
  useEffect(() => {
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsNotificationSubscribed(!!subscription);
          
          // Log debug info
          console.log('[Push Debug] Service Worker ready:', registration);
          console.log('[Push Debug] Subscription:', subscription);
          console.log('[Push Debug] Notification permission:', Notification.permission);
        } catch (err) {
          console.error('[Push Debug] Error checking subscription:', err);
        }
      } else {
        console.error('[Push Debug] Service Worker not supported');
      }
    };
    checkSubscription();
  }, []);

  const documentsByCategory = {
    route: documents?.filter((d: any) => d.category === 'route') || [],
    rally_book: documents?.filter((d: any) => d.category === 'rally_book') || [],
    map: documents?.filter((d: any) => d.category === 'map') || [],
    instruction: documents?.filter((d: any) => d.category === 'instruction') || [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {onboardingTourEnabled && <OnboardingTour />}
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="home" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Welkom, {user.first_name}!</h1>
          <p className="text-xl text-primary-100">Klaar voor een dag vol bochten en avontuur?</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Push Notifications Setup Banner - Only show if not subscribed */}
        {pushNotificationsEnabled && !isNotificationSubscribed && (
        <div data-tour="notifications" className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-sm shadow p-6 mb-8">
          <div className="flex items-start gap-4">
            <Icon name="bell" className="w-10 h-10 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                Mis geen updates meer!
              </h3>
              <p className="text-gray-700 mb-4">
                Ontvang push notificaties voor rally updates, zone openings, en meer. Blijf altijd op de hoogte!
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={async () => {
                    try {
                      // Check if notifications are supported
                      if (!('Notification' in window)) {
                        alert('Je browser ondersteunt notificaties niet.');
                        return;
                      }

                      // Request permission
                      const permission = await Notification.requestPermission();
                      if (permission !== 'granted') {
                        alert('Je moet notificaties toestaan.');
                        return;
                      }

                      // Register service worker
                      if (!('serviceWorker' in navigator)) {
                        alert('Je browser ondersteunt service workers niet.');
                        return;
                      }

                      const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                      });

                      // Get VAPID key
                      const vapidPublicKey = (window.ENV as any)?.VITE_VAPID_PUBLIC_KEY;
                      if (!vapidPublicKey) {
                        alert('Notificaties zijn niet geconfigureerd. Neem contact op met admin.');
                        return;
                      }

                      // Convert VAPID key
                      const urlBase64ToUint8Array = (base64String: string) => {
                        const padding = '='.repeat((4 - base64String.length % 4) % 4);
                        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                        const rawData = window.atob(base64);
                        const outputArray = new Uint8Array(rawData.length);
                        for (let i = 0; i < rawData.length; ++i) {
                          outputArray[i] = rawData.charCodeAt(i);
                        }
                        return outputArray;
                      };

                      // Subscribe to push
                      const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                      });

                      // Send to server
                      const response = await fetch('/api/push-subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'subscribe',
                          subscription: subscription.toJSON(),
                        }),
                      });

                      if (!response.ok) {
                        const error = await response.text();
                        alert(`Fout: ${error}`);
                        return;
                      }

                      alert('Notificaties ingeschakeld! Je ontvangt nu updates.');
                      setIsNotificationSubscribed(true);
                    } catch (err) {
                      console.error('Notification setup error:', err);
                      alert(`Fout bij notificaties: ${err instanceof Error ? err.message : 'Onbekende fout'}`);
                    }
                  }}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-sm transition-colors"
                >
                  ✓ Notificaties inschakelen
                </button>
                <Link
                  to="/rally"
                  className="px-6 py-2 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-sm hover:bg-blue-50 transition-colors"
                >
                  Later
                </Link>
                
              </div>
              {pushDebugInfo && (
                <pre className="mt-4 p-3 bg-gray-800 text-green-400 text-xs rounded overflow-x-auto">
                  {pushDebugInfo}
                </pre>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Main CTA - Rally Submission (only for rally_zones preference) */}
        {rallyZonesEnabled && routePreference === 'adventure' && (
          <div data-tour="route-preference" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-sm shadow-xl p-6 md:p-8 text-white mb-8 transition-all hover:shadow-2xl border-2 border-primary-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-start gap-3 md:gap-4 w-full md:w-auto">
                <Icon name="flag" className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Rally Zones</h2>
                  <p className="text-primary-100 text-base md:text-lg">
                    {completedZones > 0 
                      ? `Je hebt ${completedZones} zone${completedZones !== 1 ? 's' : ''} bezocht! Deel je foto's en verhalen.`
                      : 'Bezoek de rally zones, maak foto\'s en deel je verhalen met de community!'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link
                  to="/dashboard/rally-submission"
                  className="text-center whitespace-nowrap bg-white text-primary-600 hover:bg-primary-50 px-6 md:px-8 py-3 md:py-4 rounded-sm font-bold text-base md:text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Icon name="map" className="w-5 h-5" />
                  Check in
                </Link>
                <Link
                  to="/rally"
                  className="text-center whitespace-nowrap bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/20 px-6 md:px-8 py-3 md:py-4 rounded-sm font-bold text-base md:text-lg transition-colors flex items-center justify-center gap-2"
                >
                  Bekijk Zones
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Scenic Route - Simplified CTA */}
        {routePreference === 'scenic' && (
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-sm shadow-xl p-6 md:p-8 text-white mb-8">
            <div className="flex items-start gap-4">
              <Icon name="map" className="w-16 h-16 flex-shrink-0" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Scenic Route</h2>
                <p className="text-gray-100 text-base md:text-lg mb-4">
                  Je hebt gekozen voor de rustige scenic route zonder rally zones. Download je GPX en geniet van de rit!
                </p>
                {gpxRouteUrl && (
                  <a
                    href={gpxRouteUrl}
                    download
                    className="inline-flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-sm font-bold transition-colors"
                  >
                    <Icon name="download" className="w-5 h-5" />
                    Download Complete Route GPX
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Registration Status */}
          <div data-tour="profile-section" className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="check" className="w-6 h-6 text-green-600" />
              Inschrijving
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600">Status:</dt>
                <dd className="font-medium text-green-600">Bevestigd</dd>
              </div>
              <div>
                <dt className="text-gray-600">Formule:</dt>
                <dd className="font-medium">{FORMULA_LABELS[user.formula as keyof typeof FORMULA_LABELS]}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Rittype:</dt>
                <dd className="font-medium">{RIDE_TYPE_LABELS[user.ride_type as keyof typeof RIDE_TYPE_LABELS]}</dd>
              </div>
            </dl>
          </div>

          {/* QR Code */}
          <div data-tour="qr-code" className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="phone" className="w-6 h-6 text-primary-600" />
              QR-code
            </h3>
            <div className="bg-gray-50 p-4 rounded text-center">
              {!qrError && qrCodeUrl ? (
                <img 
                  src={qrCodeUrl}
                  alt="QR Code" 
                  className="w-full max-w-[200px] mx-auto mb-2"
                  onError={() => setQrError(true)}
                />
              ) : (
                <div className="w-full max-w-[200px] mx-auto mb-2 bg-gray-200 rounded flex items-center justify-center" style={{height: '200px'}}>
                  <span className="text-gray-500 text-sm">QR code niet beschikbaar</span>
                </div>
              )}
              <p className="text-xs text-gray-600 font-mono mb-1">
                {user.qr_code}
              </p>
              <p className="text-xs text-gray-600 font-semibold">
                Toon dit bij de start
              </p>
            </div>
            <Link
              to="/dashboard/profile-edit"
              className="mt-4 block text-center text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Bewerk mijn gegevens →
            </Link>
          </div>

          {/* Rally Progress */}
          {rallyZonesEnabled && routePreference === 'adventure' && (
            <div data-tour="rally-zones" className="bg-white rounded-sm shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon name="map" className="w-6 h-6 text-primary-600" />
                Rally Avontuur
              </h3>
              {completedZones > 0 ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">Zones bezocht:</dt>
                    <dd className="font-medium text-2xl text-primary-600">{completedZones}/4</dd>
                  </div>
                  <Link
                    to="/rally"
                    className="inline-block mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Bekijk alle zones →
                  </Link>
                </div>
              ) : (
                <div className="text-gray-600 text-sm space-y-2">
                  <p>Start je avontuur!</p>
                  <Link
                    to="/rally"
                    className="inline-block mt-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ontdek de zones →
                  </Link>
                </div>
              )}
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 mt-4">
                <Icon name="award" className="w-6 h-6 text-amber-600" />
                Journey Punten
              </h3>
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Behaalde Punten</p>
                  <p className="font-bold text-3xl text-amber-600">{challengeStats.total_points_earned}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Challenges Goed</p>
                  <p className="font-bold text-3xl text-green-600">{challengeStats.total_correct}/{challengeStats.total_submitted}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Nog te beoordelen</p>
                  <p className="font-bold text-3xl text-accent-500">{completedChallenges.length - challengeStats.total_submitted}</p>
                </div>
              </div>
              {challengeStats.total_submitted === 0 && (
                <p className="text-gray-600 text-sm mt-4">
                  Ontdek challenges op de rally zones en verdien punten! 🎯
                </p>
              )}
              {completedChallenges.length > 0 && (
                <button
                  onClick={() => setShowChallengesModal(true)}
                  className="mt-4 w-full px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-sm font-medium transition-colors"
                >
                  Bekijk alle {completedChallenges.length} challenges →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Completed Challenges Modal - Removed from main viewport */}

        {/* New Feature Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {photoGalleryEnabled && (
            <Link
              to="/gallery"
              data-tour="gallery"
              className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <Icon name="camera" className="w-16 h-16 mb-3" />
              <h3 className="font-bold text-xl mb-2">Fotogalerij</h3>
              <p className="text-sm text-purple-100">
                Deel jouw rally momenten en bekijk foto's van andere deelnemers!
              </p>
            </Link>
          )}

          {rideStoriesEnabled && (
            <Link
              to="/dashboard/blog"
              data-tour="ride-stories"
              className="bg-gradient-to-br from-orange-500 to-red-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <Icon name="book-open" className="w-16 h-16 mb-3" />
              <h3 className="font-bold text-xl mb-2">Ride Stories</h3>
              <p className="text-sm text-orange-100">
                Schrijf en lees verhalen over de rally ervaringen van deelnemers!
              </p>
            </Link>
          )}

          {achievementsEnabled && (
            <Link
              to="/achievements"
              className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <Icon name="trophy" className="w-16 h-16 mb-3" />
              <h3 className="font-bold text-xl mb-2">Achievements</h3>
              <p className="text-sm text-yellow-100">
                Ontgrendel achievements door deel te nemen aan de rally zones!
              </p>
            </Link>
          )}

          <Link
            to="/dashboard/profile-edit"
            className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="user" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Mijn Profiel</h3>
            <p className="text-sm text-teal-100">
              Bewerk je gegevens, motor info en route voorkeuren!
            </p>
          </Link>

          <Link
            to="/dashboard/emergency-contacts"
            className="bg-gradient-to-br from-red-500 to-red-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="phone" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Noodcontacten</h3>
            <p className="text-sm text-red-100">
              Vul je noodcontacten in voor tijdens het event!
            </p>
          </Link>

          <Link
            to="/dashboard/checklist"
            className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="check-square" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Mijn Checklist</h3>
            <p className="text-sm text-primary-100">
              Bereid je voor op het event met je persoonlijke checklist!
            </p>
          </Link>

          <Link
            to="/dashboard/riding-buddies"
            className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="users" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Naftgenoten</h3>
            <p className="text-sm text-blue-100">
              Voeg mederijders toe om samen in groep te rijden!
            </p>
          </Link>

          {/* Removed: Certificates - Concept A only */}
        </div>

        {/* V1: Progress & Stats Cards disabled (competition-related)
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard/progress"
            className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="trending-up" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Mijn Voortgang</h3>
            <p className="text-sm text-blue-100">
              Real-time overzicht van je rally voortgang, positie en punten breakdown!
            </p>
          </Link>

          <Link
            to="/dashboard/stats"
            className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="bar-chart" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Mijn Statistieken</h3>
            <p className="text-sm text-indigo-100">
              Gedetailleerde analyse van je prestaties, zone tijden en shadow rally scores!
            </p>
          </Link>
          */}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/dashboard/privacy"
            className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="shield" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Privacy & Gegevens</h3>
            <p className="text-sm text-gray-100">
              Beheer je gegevens, download je data of verwijder je account (GDPR)
            </p>
          </Link>
        </div>

        {/* Documents Section */}
        <div data-tour="documents" className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Live Map - ONLY visible on event day or for admins */}
          {(user.is_admin || new Date().toISOString().split('T')[0] === eventDate) && (
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-sm shadow-lg p-6 text-white md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xl mb-2 flex items-center gap-3">
                    <Icon name="map" className="w-8 h-8" />
                    Live Rally Map
                  </h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Volg de route, rally zones en live evenementen tijdens de rally
                  </p>
                  {user.is_admin && new Date().toISOString().split('T')[0] !== eventDate && (
                    <p className="text-xs bg-yellow-500 text-yellow-900 inline-block px-2 py-1 rounded font-medium">
                      Admin Preview
                    </p>
                  )}
                </div>
                <Link
                  to="/live-map"
                  className="bg-white text-primary-600 px-6 py-3 rounded-sm font-semibold hover:bg-primary-50 transition-colors shadow-lg"
                >
                  Open Map →
                </Link>
              </div>
            </div>
          )}

          {/* Routes */}
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="map" className="w-6 h-6 text-primary-600" />
              GPX Routes
            </h3>
            <ul className="space-y-2">
              {gpxRouteUrl && (
                <li>
                  <a
                    href={gpxRouteUrl}
                    download="deur-den-bocht-route.gpx"
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 rounded-sm transition-colors border border-primary-200"
                  >
                    <div>
                      <div className="font-medium text-primary-900">Official Rally Route</div>
                      <div className="text-sm text-primary-700">Complete GPX file for navigation</div>
                    </div>
                    <span className="text-primary-600">↓</span>
                  </a>
                </li>
              )}
            </ul>
            {!gpxRouteUrl && documentsByCategory.route.length === 0 && (
              <p className="text-gray-500">Nog geen routes beschikbaar</p>
            )}
          </div>

          {/* Rally Book */}
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Icon name="book" className="w-6 h-6 mr-2" />
              Bochtenboek
            </h3>
            {documentsByCategory.rally_book.length > 0 ? (
              <ul className="space-y-2">
                {documentsByCategory.rally_book.map((doc: any) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      download
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-600">{doc.description}</div>
                        )}
                      </div>
                      <span className="text-primary-600">↓</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nog niet beschikbaar</p>
            )}
          </div>

          {/* Maps */}
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Icon name="map" className="w-6 h-6 mr-2" />
              Kaarten
            </h3>
            {documentsByCategory.map.length > 0 ? (
              <ul className="space-y-2">
                {documentsByCategory.map.map((doc: any) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      download
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-600">{doc.description}</div>
                        )}
                      </div>
                      <span className="text-primary-600">↓</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nog geen kaarten beschikbaar</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Icon name="clipboard" className="w-6 h-6 mr-2" />
              Instructies & Info
            </h3>
            {documentsByCategory.instruction.length > 0 ? (
              <ul className="space-y-2">
                {documentsByCategory.instruction.map((doc: any) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      download
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-600">{doc.description}</div>
                        )}
                      </div>
                      <span className="text-primary-600">↓</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nog geen instructies beschikbaar</p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">Hulp nodig?</p>
          <p>
            <Icon name="mail" className="w-5 h-5 inline mr-1" />
            <a href="mailto:vzwddb@gmail.com" className="text-primary-600 hover:underline">
              vzwddb@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* Completed Challenges Modal */}
      {showChallengesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1100]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4">
              <h3 className="text-lg font-bold">Mijn Ingestuurde Challenges</h3>
              <button 
                onClick={() => setShowChallengesModal(false)} 
                className="text-white hover:text-amber-100 text-2xl font-light"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {completedChallenges.map((challenge: any) => (
                <div 
                  key={challenge.id}
                  className={`bg-white rounded-sm shadow p-4 border-l-4 ${
                    challenge.is_correct ? 'border-l-green-600' : challenge.is_validated ? 'border-l-red-600' : 'border-l-yellow-600'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {challenge.challenge_details?.title || challenge.route_tips?.title || 'Routetip'}
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    <span className="font-medium">Vraag:</span> {challenge.challenge_details?.question || challenge.route_tips?.question || 'Vraag niet beschikbaar'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    <div className="bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                      <Icon name="marker" className="w-3 h-3 text-blue-700" />
                      <span className="text-blue-700 font-medium">{challenge.rally_zones?.name || 'Zone'}</span>
                    </div>
                    <div className={`px-2 py-1 rounded flex items-center gap-1 ${
                      challenge.is_correct 
                        ? 'bg-green-50 text-green-700'
                        : challenge.is_validated 
                          ? challenge.is_correct === false ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                          : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {challenge.is_correct ? (
                        <>
                          <Icon name="check" className="w-3 h-3" />
                          <span className="font-medium">Correct</span>
                        </>
                      ) : challenge.is_validated ? (
                        challenge.is_correct === false ? (
                          <>
                            <Icon name="x" className="w-3 h-3" />
                            <span className="font-medium">Incorrect</span>
                          </>
                        ) : (
                          <>
                            <Icon name="check" className="w-3 h-3" />
                            <span className="font-medium">Goedgekeurd</span>
                          </>
                        )
                      ) : (
                        <>
                          <Icon name="clock" className="w-3 h-3" />
                          <span className="font-medium">Wacht op goedkeuring</span>
                        </>
                      )}
                    </div>
                    {challenge.points_awarded !== null && (
                      <div className="bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                        <Icon name="star" className="w-3 h-3 text-amber-700" />
                        <span className="text-amber-700 font-bold">{challenge.points_awarded} pts</span>
                      </div>
                    )}
                  </div>
                  {(challenge.challenge_details?.submittedAnswer && challenge.challenge_details?.correctAnswer) && (
                    <div className="text-xs text-gray-600 mb-2">
                      Jouw antwoord: <span className="font-medium">{challenge.challenge_details.submittedAnswer}</span>, Correct: <span className="font-medium">{challenge.challenge_details?.correctAnswer}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
                    Ingestuurd op: {new Date(challenge.submitted_at).toLocaleDateString('nl-NL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowChallengesModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 font-medium transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
