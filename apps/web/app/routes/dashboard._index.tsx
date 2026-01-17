import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link, Form } from 'react-router';
import { useState, useEffect } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import { FORMULA_LABELS, RIDE_TYPE_LABELS } from '~/lib/utils';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

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
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get rally submission if exists
  const { data: submission } = await supabase
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', user.id)
    .single();

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

  // Count completed zones
  const completedZones = submission
    ? [
        submission.rz1_code,
        submission.rz2_code,
        submission.rz3_code,
        submission.rz4_code,
        submission.rz5_code,
        submission.rz6_code,
        submission.rz7_code,
        submission.rz8_code,
      ].filter((code) => code && code.trim()).length
    : 0;

  // Check if user is in first place (Bochtenkoning)
  let isBochtenkoning = false;
  if (submission) {
    // Get rally zones with points from Sanity
    const rallyZones = await sanityClient.fetch(
      `*[_type == "rallyZone"] | order(order asc) {
        order,
        points,
        validAnswers
      }`
    );

    // Get all rally submissions
    const { data: allSubmissions } = await supabase
      .from('rally_submissions')
      .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code');

    // Get shadow scores
    const { data: shadowScores } = await supabase
      .from('rally_zone_submissions')
      .select('participant_id, shadow_score');

    // Get achievement points
    const { data: achievementPoints } = await supabase
      .from('participants')
      .select('id, total_achievement_points');

    // Calculate scores for all participants (including achievements)
    const scores = (allSubmissions || []).map(sub => {
      let basicPoints = 0;
      let shadowTotal = 0;

      // Basic points
      for (let i = 1; i <= 8; i++) {
        const code = sub[`rz${i}_code` as keyof typeof sub] as string | null;
        if (code) {
          const zone = rallyZones[i - 1];
          const isCorrect = zone?.validAnswers?.some((answer: string) => 
            answer.toLowerCase() === code.toLowerCase()
          );
          if (isCorrect && zone?.points) {
            basicPoints += zone.points;
          }
        }
      }

      // Shadow points
      const participantShadowScores = shadowScores?.filter(
        s => s.participant_id === sub.participant_id
      ) || [];
      shadowTotal = participantShadowScores.reduce((sum, s) => sum + (s.shadow_score || 0), 0);

      // Achievement points
      const achievementScore = achievementPoints?.find(a => a.id === sub.participant_id)?.total_achievement_points || 0;

      return {
        participant_id: sub.participant_id,
        totalScore: basicPoints + shadowTotal + achievementScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    // Check if current user is first
    isBochtenkoning = scores.length > 0 && scores[0].participant_id === user.id;
  }

  const eventDate = process.env.EVENT_DATE || '2026-05-16';
  
  // Generate QR code URL on server to avoid hydration mismatch
  const checkInUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/check-in/${user.id}`;
  const qrCodeUrl = `/api/qrcode?text=${encodeURIComponent(checkInUrl)}`;

  return { 
    user, 
    submission, 
    documents, 
    completedZones, 
    isBochtenkoning, 
    eventDate,
    gpxRouteUrl: siteConfig?.gpxRouteFile?.asset?.url,
    qrCodeUrl,
  };
}

export default function Dashboard() {
  const { user, submission, documents, completedZones, isBochtenkoning, eventDate, gpxRouteUrl, qrCodeUrl } = useLoaderData<typeof loader>();
  const [qrError, setQrError] = useState(false);
  const [isNotificationSubscribed, setIsNotificationSubscribed] = useState(false);

  // Check if already subscribed to push notifications
  useEffect(() => {
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsNotificationSubscribed(!!subscription);
        } catch (err) {
          // Silent fail - notification subscription check not critical
        }
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
      <Header />

      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
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
        {!isNotificationSubscribed && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-sm shadow p-6 mb-8">
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
                <a
                  href="/dashboard/rally-submission"
                  className="px-6 py-2 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-sm hover:bg-blue-50 transition-colors"
                >
                  Later
                </a>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Main CTA - Rally Submission */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-sm shadow-xl p-6 md:p-8 text-white mb-8 transition-all hover:shadow-2xl border-2 border-primary-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-start gap-3 md:gap-4 w-full md:w-auto">
              <Icon name="flag" className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Rally Codes Indienen</h2>
                <p className="text-primary-100 text-base md:text-lg">
                  {submission && completedZones > 0 
                    ? `Je hebt ${completedZones} zone${completedZones !== 1 ? 's' : ''} voltooid! Update je codes en verzamel meer punten.`
                    : 'Dien je rally zone codes in om punten te verzamelen en mee te strijden om de Bochtenkoning titel!'}
                </p>
                {submission && (
                  <p className="text-primary-50 text-sm mt-2 font-semibold">
                    Totaal punten: <span className="text-xl md:text-2xl">{submission?.total_points}</span>
                  </p>
                )}
              </div>
            </div>
            <Link
              to="/dashboard/rally-submission"
              className="w-full md:w-auto text-center whitespace-nowrap bg-white text-primary-600 hover:bg-primary-50 px-6 md:px-8 py-3 md:py-4 rounded-sm font-bold text-base md:text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {submission ? 'Codes Bijwerken' : 'Nu Starten'}
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Registration Status */}
          <div className="bg-white rounded-sm shadow p-6">
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
          <div className="bg-white rounded-sm shadow p-6">
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
          </div>

          {/* Rally Progress */}
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="trophy" className="w-6 h-6 text-yellow-600" />
              Rally Status
            </h3>
            {submission ? (
              <div className="space-y-3 text-sm">
                {isBochtenkoning && (
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-sm p-3 mb-3">
                    <div className="flex items-center justify-center gap-2">
                      <Icon name="crown" className="w-8 h-8 text-yellow-500" />
                      <div className="text-center">
                        <div className="font-bold text-yellow-800 text-base">Bochtenkoning!</div>
                        <div className="text-xs text-yellow-700">Je staat op #1</div>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <dt className="text-gray-600">Zones voltooid:</dt>
                  <dd className="font-medium text-2xl text-primary-600">{completedZones}/8</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Totaal punten:</dt>
                  <dd className="font-medium text-xl">{submission?.total_points}</dd>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                Nog geen rally codes ingediend
              </p>
            )}
          </div>
        </div>

        {/* New Feature Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link
            to="/gallery"
            className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="camera" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Fotogalerij</h3>
            <p className="text-sm text-purple-100">
              Deel jouw rally momenten en bekijk foto's van andere deelnemers!
            </p>
          </Link>

          <Link
            to="/dashboard/blog"
            className="bg-gradient-to-br from-orange-500 to-red-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="book-open" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Ride Stories</h3>
            <p className="text-sm text-orange-100">
              Schrijf en lees verhalen over de rally ervaringen van deelnemers!
            </p>
          </Link>

          <Link
            to="/dashboard/achievements"
            className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="trophy" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Achievements</h3>
            <p className="text-sm text-yellow-100">
              Ontgrendel achievements door deel te nemen en punten te verzamelen!
            </p>
          </Link>

          <Link
            to="/certificates/completion"
            className="bg-gradient-to-br from-green-500 to-green-700 rounded-sm shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <Icon name="document" className="w-16 h-16 mb-3" />
            <h3 className="font-bold text-xl mb-2">Certificaat</h3>
            <p className="text-sm text-green-100">
              Download je deelname certificaat na het voltooien van de rally!
            </p>
          </Link>
        </div>

        {/* New: Progress & Stats Cards */}
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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
    </div>
  );
}
