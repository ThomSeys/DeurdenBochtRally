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
import { PWAInstallPrompt } from '~/components/PWAInstallPrompt';
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

  // Get accepted buddies for crew + live feed filtering
  const { data: buddyLinks } = await supabaseAdmin
    .from('participant_buddies')
    .select('buddy_id, buddy_first_name, buddy_last_name')
    .eq('participant_id', user.id)
    .eq('status', 'accepted');

  const buddyIds = (buddyLinks || []).map((b: any) => b.buddy_id).filter(Boolean);

  // Fetch GPX route file and Spotify playlist
  const siteConfig = await sanityClient.fetch(`
    *[_type == "siteConfig"][0] {
      gpxRouteFile {
        asset-> {
          url,
          originalFilename
        }
      },
      gpxRouteFiles[] {
        asset-> {
          url,
          originalFilename
        }
      },
      spotifyPlaylistUrl
    }
  `);

  const gpxRouteFiles = (siteConfig?.gpxRouteFiles || []).filter((file: any) => file?.asset?.url);
  const legacyGpxUrl = siteConfig?.gpxRouteFile?.asset?.url;
  const gpxRouteUrl = gpxRouteFiles[0]?.asset?.url || legacyGpxUrl;

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

  // Crew goals (user + buddies)
  const crewParticipantIds = [user.id, ...buddyIds];

  const { data: crewCheckIns } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('zone_id, participant_id')
    .in('participant_id', crewParticipantIds);

  const { data: crewChallenges } = await supabaseAdmin
    .from('route_challenge_submissions')
    .select('id, participant_id')
    .in('participant_id', crewParticipantIds);

  const crewZones = new Set((crewCheckIns || []).map((item: any) => item.zone_id));
  const crewStats = {
    buddyCount: buddyIds.length,
    zoneCount: crewZones.size,
    challengeCount: crewChallenges?.length || 0,
    goals: {
      zones: 3,
      challenges: 5,
      buddies: 2,
    },
  };

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
  const vibeAreaEnabled = await isFeatureEnabled('vibe-area-enabled');
  const liveFeedEnabled = await isFeatureEnabled('live-feed-enabled');
  const teamVibeEnabled = await isFeatureEnabled('team-vibe-enabled');
  const recapEnabled = await isFeatureEnabled('recap-enabled');
  const spotifyPlaylistEnabled = await isFeatureEnabled('spotify-playlist-enabled');
  const weatherEnabled = await isFeatureEnabled('weather-enabled');

  return { 
    user, 
    zoneCheckins, 
    documents, 
    completedZones, 
    isBochtenkoning, 
    eventDate,
    gpxRouteUrl,
    gpxRouteFiles,
    qrCodeUrl, 
    rallyZonesEnabled,
    photoGalleryEnabled, 
    rideStoriesEnabled, 
    achievementsEnabled,
    profileEditingEnabled, 
    pushNotificationsEnabled,
    vibeAreaEnabled,
    liveFeedEnabled,
    teamVibeEnabled,
    recapEnabled,
    spotifyPlaylistEnabled,
    weatherEnabled,
    spotifyPlaylistUrl: siteConfig?.spotifyPlaylistUrl || null,
    routePreference: user.route_preference || 'adventure', // Default to adventure
    challengeStats,
    completedChallenges,
    rallyZones,
    crewStats,
  };
}

export default function Dashboard() {
  const { 
    user, 
    zoneCheckins, 
    documents, 
    completedZones, 
    eventDate, 
    gpxRouteUrl, 
    gpxRouteFiles, 
    qrCodeUrl, 
    routePreference, 
    rallyZonesEnabled, 
    pushNotificationsEnabled, 
    photoGalleryEnabled, 
    rideStoriesEnabled, 
    achievementsEnabled, 
    vibeAreaEnabled, 
    liveFeedEnabled, 
    teamVibeEnabled, 
    recapEnabled,
    spotifyPlaylistEnabled,
    weatherEnabled,
    spotifyPlaylistUrl,
    challengeStats, 
    completedChallenges, 
    rallyZones, 
    crewStats 
  } = useLoaderData<typeof loader>();

  const [qrError, setQrError] = useState(false);
  const [isNotificationSubscribed, setIsNotificationSubscribed] = useState(false);
  const [pushDebugInfo, setPushDebugInfo] = useState<string>('');
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [mainTab, setMainTab] = useState<'features' | 'vibe'>('features');
  const [liveFilter, setLiveFilter] = useState<'all' | 'buddies'>('all');
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [buddyIds, setBuddyIds] = useState<string[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

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

  // Fetch live feed and auto-refresh every minute
  useEffect(() => {
    const fetchLiveFeed = async () => {
      try {
        const response = await fetch('/api/live-feed');
        if (!response.ok) throw new Error('Failed to fetch live feed');
        const data = await response.json();
        setLiveActivity(data.liveActivity || []);
        setBuddyIds(data.buddyIds || []);
        setIsLoadingFeed(false);
      } catch (error) {
        console.error('[Dashboard] Error fetching live feed:', error);
        setIsLoadingFeed(false);
      }
    };

    // Initial fetch
    fetchLiveFeed();

    // Set up auto-refresh every minute
    const interval = setInterval(fetchLiveFeed, 60000);

    return () => clearInterval(interval);
  }, []);

  const documentsByCategory = {
    route: documents?.filter((d: any) => d.category === 'route') || [],
    rally_book: documents?.filter((d: any) => d.category === 'rally_book') || [],
    map: documents?.filter((d: any) => d.category === 'map') || [],
    instruction: documents?.filter((d: any) => d.category === 'instruction') || [],
  };

  const buddyIdSet = new Set([user.id, ...(buddyIds || [])]);
  const filteredLiveActivity = liveFilter === 'buddies'
    ? (liveActivity || []).filter((item: any) => buddyIdSet.has(item.participant_id))
    : (liveActivity || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
                <Icon name="home" className="w-10 h-10" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Welkom, {user.first_name}!</h1>
              <p className="text-xl text-primary-100">Klaar voor een dag vol bochten en avontuur?</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

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

        <hr className="mb-8" />

        {/* Live sfeer + team vibe + tijdcapsule */}
        {/* Completed Challenges Modal - Removed from main viewport */}

        {/* Dashboard Tabs */}
        {vibeAreaEnabled && (
        <div className="flex gap-3 mb-8 w-full">
          <button
            onClick={() => setMainTab('features')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-sm transition-all ${
              mainTab === 'features' 
                ? 'bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-lg shadow-blue-500/30 transform' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon name="list" className="w-5 h-5" />
            <span>Menu</span>
          </button>
          <button
            onClick={() => setMainTab('vibe')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-sm transition-all ${
              mainTab === 'vibe' 
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 transform' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon name="heart" className="w-5 h-5" />
            <span>Sfeer</span>
          </button>
        </div>
        )}

        {/* New Feature Cards */}
        {(!vibeAreaEnabled || mainTab === 'features') && (
          <>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Menu</p>
          </div>
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

          {photoGalleryEnabled && (
            <Link
              to="/event-albums"
              className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <Icon name="folder" className="w-16 h-16 mb-3" />
              <h3 className="font-bold text-xl mb-2">Event Albums</h3>
              <p className="text-sm text-indigo-100">
                Bekijk officiële event foto's georganiseerd per rally zone!
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
              data-tour="achievements"
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
            data-tour="my-profile"
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
            data-tour="emergency-contacts"
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
            data-tour="my-checklist"
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
        </div></>
        )}

        {vibeAreaEnabled && mainTab === 'vibe' && (
        <div className="mb-10">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Sfeer</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Live Sfeer Block */}
            {liveFeedEnabled && (
            <div className="lg:col-span-2 flex flex-col gap-6 ">
              <div className="bg-slate-900 text-white rounded-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Live sfeer</p>
                      {!isLoadingFeed && (
                        <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                          <span className="text-[10px] font-medium text-green-300 uppercase tracking-wide">Live</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold">Bochten Feed</h3>
                    <p className="text-slate-200 text-sm mt-1">De laatste vibes van de route, live binnenrollend.</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-xs">
                    <span>{filteredLiveActivity.length} items</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 p-1 rounded-sm w-fit mb-4">
                  <button
                    onClick={() => setLiveFilter('all')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-sm transition-colors ${
                      liveFilter === 'all' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Alles
                  </button>
                  <button
                    onClick={() => setLiveFilter('buddies')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-sm transition-colors ${
                      liveFilter === 'buddies' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Naftgenoten
                  </button>
                </div>

                <div className="space-y-3">
                  {isLoadingFeed ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : filteredLiveActivity.length > 0 ? (
                    filteredLiveActivity.slice(0, 8).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors rounded-sm p-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Icon
                            name={item.type === 'checkin' ? 'map-pin' : item.type === 'challenge' ? 'target' : 'camera'}
                            className="w-5 h-5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {(item.participant?.first_name || 'Deelnemer')} {(item.participant?.last_name || '')}
                          </p>
                          <p className="text-xs text-slate-200">
                            {item.type === 'checkin' && `Checkte in bij ${item.zoneName}`}
                            {item.type === 'challenge' && `Diende een ${item.challengeType || 'challenge'} in bij ${item.zoneName}`}
                            {item.type === 'photo' && `Uploadde een foto bij ${item.zoneName}`}
                          </p>
                        </div>
                        {item.photoUrl && (
                          <img
                            src={item.photoUrl}
                            alt="Challenge foto"
                            className="w-12 h-12 rounded-sm object-cover border border-white/20"
                          />
                        )}
                        <div className="text-xs text-slate-300 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">Nog geen live activiteit. Geef het event wat minuten!</p>
                  )}
                </div>
                </div>
                
            {/* Spotify Playlist Block */}
            {spotifyPlaylistEnabled && spotifyPlaylistUrl && (
              <div className="relative overflow-hidden rounded-sm border border-[#1DB954]/40 bg-gradient-to-br from-[#0B0F0D] via-[#101812] to-[#0B0F0D] p-5 shadow-[0_10px_40px_rgba(13,18,15,0.35)]">
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#1DB954]/20 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#1DB954]/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#B7F3CC]">Event soundtrack</p>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#1DB954]">Spotify</span>
                  </div>
                  <h3 className="text-2xl font-bold mt-1 text-white">Rally vibes</h3>
                  <p className="text-sm text-[#CDE9D8] mt-2">
                    De officiele playlist voor onderweg. Rijd mee op de beats.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-3 py-1 text-xs font-semibold text-black">
                      <span className="h-2 w-2 rounded-full bg-black/70" />
                      On repeat
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                      <Icon name="music" className="h-3 w-3" />
                      100% good vibes
                    </span>
                  </div>
                  <div className="mt-4 rounded-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <iframe
                      src={spotifyPlaylistUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Weather Block */}
            {weatherEnabled && (
              <WeatherWidget rallyZones={rallyZones} />
            )}
              </div>
            )}

            <div className='flex flex-col gap-6'>
            {/* Team Vibe Block */}
            {teamVibeEnabled && (
            <div className="bg-amber-50 rounded-sm border border-amber-200 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Team vibe</p>
                <h3 className="text-xl font-bold text-amber-900 mt-1">Naftgenoten Challenges</h3>
                <p className="text-sm text-amber-800 mt-2">Samen rijden, samen scoren. Kleine doelen, grote sfeer.</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-900 font-semibold">Buddies</span>
                    <span className="text-amber-800">{crewStats.buddyCount}/{crewStats.goals.buddies}</span>
                  </div>
                  <div className="w-full h-2 bg-amber-200 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min((crewStats.buddyCount / crewStats.goals.buddies) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-900 font-semibold">Zones samen</span>
                    <span className="text-amber-800">{crewStats.zoneCount}/{crewStats.goals.zones}</span>
                  </div>
                  <div className="w-full h-2 bg-amber-200 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min((crewStats.zoneCount / crewStats.goals.zones) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-900 font-semibold">Crew challenges</span>
                    <span className="text-amber-800">{crewStats.challengeCount}/{crewStats.goals.challenges}</span>
                  </div>
                  <div className="w-full h-2 bg-amber-200 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min((crewStats.challengeCount / crewStats.goals.challenges) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <Link
                  to="/dashboard/riding-buddies"
                  className="mt-4 inline-flex items-center text-amber-900 font-semibold text-sm"
                >
                  Beheer je Naftgenoten →
                </Link>
              </div>
            )}

            {/* Tijdcapsule Block */}
            {recapEnabled && (
            <div className="bg-indigo-50 rounded-sm border border-indigo-200 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-700">Tijdcapsule</p>
                <h3 className="text-2xl font-bold mt-1 text-indigo-900">Jouw dag in 60s</h3>
                <p className="text-sm text-indigo-800 mt-2">
                  Een persoonlijke recap met je hoogtepunten, check-ins en crew vibes.
                </p>
                <Link
                  to="/dashboard/recap"
                  className="mt-4 inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-white/90 px-4 py-2 rounded-sm font-semibold transition-colors"
                >
                  Bekijk mijn recap
                  <span>→</span>
                </Link>
              </div>
            )}

              </div>
          </div>
        </div>
        )}

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

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard/privacy"
            className="bg-gradient-to-br md:col-span-1 from-gray-600 to-gray-800 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="shield" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Privacy & Gegevens</h3>
            <p className="text-sm text-gray-100">
              Beheer je gegevens, download je data of verwijder je account (GDPR)
            </p>
          </Link>
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
        </div>

        {/* Documents Section */}
        <div data-tour="documents" className="grid md:grid-cols-2 gap-6 mb-8">
          

          {/* Routes */}
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="map" className="w-6 h-6 text-primary-600" />
              GPX Routes
            </h3>
            <ul className="space-y-2">
              {gpxRouteFiles?.length > 0 ? (
                gpxRouteFiles.map((file: any) => (
                  <li key={file.asset?.url}>
                    <a
                      href={file.asset.url}
                      download={file.asset?.originalFilename || true}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 rounded-sm transition-colors border border-primary-200"
                    >
                      <div>
                        <div className="font-medium text-primary-900">
                          {file.asset?.originalFilename || 'Official Rally Route'}
                        </div>
                        <div className="text-sm text-primary-700">Complete GPX file for navigation</div>
                      </div>
                      <span className="text-primary-600">↓</span>
                    </a>
                  </li>
                ))
              ) : (
                gpxRouteUrl && (
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
                )
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

// Weather Widget Component
function WeatherWidget({ rallyZones }: { rallyZones: any[] }) {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      setIsLoading(true);
      
      // Get weather for each zone with a location
      const weatherPromises = rallyZones
        .filter(zone => zone.startLocation?.lat && zone.startLocation?.lng)
        .map(async (zone) => {
          try {
            const response = await fetch(
              `/api/weather?lat=${zone.startLocation.lat}&lon=${zone.startLocation.lng}&location=${encodeURIComponent(zone.title)}`
            );
            if (response.ok) {
              const result = await response.json();
              // Handle both { data: weatherData } and direct weatherData formats
              const data = result.data || result;
              return { zoneId: zone._id, zoneName: zone.title, data };
            }
          } catch (error) {
            console.error(`Failed to fetch weather for ${zone.title}:`, error);
          }
          return null;
        });

      const results = await Promise.all(weatherPromises);
      setWeatherData(results.filter(Boolean));
      setIsLoading(false);
    }

    fetchWeather();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [rallyZones]);

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-sm border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100 p-5 shadow-sm">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
        <div className="absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Live weer</p>
            <span className="text-[10px] uppercase tracking-[0.2em] text-sky-500">Laden...</span>
          </div>
          <h3 className="text-2xl font-bold mt-1 text-sky-900">Weer info</h3>
          <div className="mt-6 flex items-center justify-center text-sky-700">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="loader" className="w-5 h-5 animate-spin" />
              Live data ophalen
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentWeather = selectedZone 
    ? weatherData.find(w => w.zoneId === selectedZone)
    : weatherData[0];

  if (!currentWeather || !currentWeather.data) {
    return null;
  }

  const weather = currentWeather.data;
  const hasAlerts = weather.alerts && weather.alerts.length > 0;

  return (
    <div className={`relative overflow-hidden rounded-sm border bg-gradient-to-br from-sky-50 via-white to-sky-100 p-5 shadow-sm ${
      hasAlerts ? 'border-red-200' : 'border-sky-200'
    }`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
      <div className="absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-blue-200/30 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Live weer</p>
          <span className={`text-[10px] uppercase tracking-[0.2em] ${hasAlerts ? 'text-red-500' : 'text-sky-500'}`}>
            {new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <h3 className={`text-2xl font-bold mt-1 ${hasAlerts ? 'text-red-900' : 'text-sky-900'}`}>
          {currentWeather.zoneName}
        </h3>

        {/* Zone selector if multiple zones */}
        {weatherData.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {weatherData.map((w) => (
              <button
                key={w.zoneId}
                onClick={() => setSelectedZone(w.zoneId)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  (selectedZone === w.zoneId || (!selectedZone && w === weatherData[0]))
                    ? 'bg-sky-700 text-white border-sky-700'
                    : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                }`}
              >
                {w.zoneName}
              </button>
            ))}
          </div>
        )}

        {/* Weather Alerts */}
        {hasAlerts && (
          <div className="mt-4 space-y-2">
            {weather.alerts.map((alert: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-sm border px-3 py-2 text-sm ${
                  alert.severity === 'severe'
                    ? 'border-red-300 bg-red-50 text-red-800'
                    : alert.severity === 'warning'
                      ? 'border-orange-300 bg-orange-50 text-orange-800'
                      : 'border-blue-300 bg-blue-50 text-blue-800'
                }`}
              >
                <Icon name="alert-triangle" className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs uppercase tracking-[0.2em]">{alert.event}</div>
                  <div className="text-xs leading-relaxed">{alert.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Weather */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-sm border border-sky-100 bg-white/90 p-4">
            <div className="flex items-center gap-3">
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                className="w-14 h-14"
              />
              <div>
                <div className={`text-4xl font-bold leading-none ${hasAlerts ? 'text-red-900' : 'text-sky-900'}`}>
                  {weather.temp}°
                </div>
                <div className={`text-xs capitalize ${hasAlerts ? 'text-red-700' : 'text-sky-700'}`}>
                  {weather.description}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-sky-100 bg-white/90 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={hasAlerts ? 'text-red-600' : 'text-sky-600'}>Gevoelstemperatuur</span>
              <span className={`font-semibold ${hasAlerts ? 'text-red-900' : 'text-sky-900'}`}>
                {weather.feels_like}°
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={hasAlerts ? 'text-red-600' : 'text-sky-600'}>Windsnelheid</span>
              <span className={`font-semibold ${hasAlerts ? 'text-red-900' : 'text-sky-900'}`}>
                {weather.wind_speed} km/h
              </span>
            </div>
            {weather.rain_probability > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className={hasAlerts ? 'text-red-600' : 'text-sky-600'}>Kans op regen</span>
                <span className={`font-semibold ${hasAlerts ? 'text-red-900' : 'text-sky-900'}`}>
                  {weather.rain_probability}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

