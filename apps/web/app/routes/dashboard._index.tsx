import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link, Form } from 'react-router';
import { useState } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import { FORMULA_LABELS, RIDE_TYPE_LABELS } from '~/lib/utils';
import Header from '~/components/Header';

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

  try {
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

    // Calculate scores for all participants
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

      return {
        participant_id: sub.participant_id,
        totalScore: basicPoints + shadowTotal
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    // Check if current user is first
    isBochtenkoning = scores.length > 0 && scores[0].participant_id === user.id;
  }

  const eventDate = process.env.EVENT_DATE || '2026-05-16';

  return { 
    user, 
    submission, 
    documents, 
    completedZones, 
    isBochtenkoning, 
    eventDate,
    gpxRouteUrl: siteConfig?.gpxRouteFile?.asset?.url,
  };
  } catch (error) {
    // If offline or error, return minimal data so page can still render
    console.log('[Dashboard] Offline or error, returning cached user data:', error);
    const eventDate = process.env.EVENT_DATE || '2026-05-16';
    return {
      user,
      submission: null,
      documents: [],
      completedZones: 0,
      isBochtenkoning: false,
      eventDate,
      gpxRouteUrl: null,
    };
  }
}

export default function Dashboard() {
  const { user, submission, documents, completedZones, isBochtenkoning, eventDate, gpxRouteUrl } = useLoaderData<typeof loader>();
  const checkInUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/check-in/${user.id}`;
  const [qrCodeUrl, setQrCodeUrl] = useState(`/api/qrcode?text=${encodeURIComponent(checkInUrl)}` || user.qr_code_image_url);


  const documentsByCategory = {
    route: documents?.filter((d: any) => d.category === 'route') || [],
    rally_book: documents?.filter((d: any) => d.category === 'rally_book') || [],
    map: documents?.filter((d: any) => d.category === 'map') || [],
    instruction: documents?.filter((d: any) => d.category === 'instruction') || [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welkom, {user.first_name}! 👋
          </h1>
          <p className="text-xl">
            Klaar voor een dag vol bochten en avontuur?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Registration Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">✅</span>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📱</span>
              QR-code
            </h3>
            <div className="bg-gray-50 p-4 rounded text-center">
              <img 
                src={qrCodeUrl || ''}
                alt="QR Code" 
                className="w-full max-w-[200px] mx-auto mb-2"
                onError={() => setQrCodeUrl(`/api/qrcode?text=${encodeURIComponent(checkInUrl)}`)}
              />
              <p className="text-xs text-gray-600 font-mono mb-1">
                {user.qr_code}
              </p>
              <p className="text-xs text-gray-600 font-semibold">
                Toon dit bij de start
              </p>
            </div>
          </div>

          {/* Rally Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🏆</span>
              Rally Status
            </h3>
            {submission ? (
              <div className="space-y-3 text-sm">
                {isBochtenkoning && (
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl">👑</span>
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

        {/* Documents Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Live Map - ONLY visible on event day or for admins */}
          {(user.is_admin || new Date().toISOString().split('T')[0] === eventDate) && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xl mb-2 flex items-center">
                    <span className="text-3xl mr-3">🗺️</span>
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
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Open Map →
                </Link>
              </div>
            </div>
          )}

          {/* Routes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🗺️</span>
              GPX Routes
            </h3>
            <ul className="space-y-2">
              {gpxRouteUrl && (
                <li>
                  <a
                    href={gpxRouteUrl}
                    download="deur-den-bocht-route.gpx"
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 rounded-lg transition-colors border border-primary-200"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📕</span>
              Bochtenboek
            </h3>
            {documentsByCategory.rally_book.length > 0 ? (
              <ul className="space-y-2">
                {documentsByCategory.rally_book.map((doc: any) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      download
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🗺</span>
              Kaarten
            </h3>
            {documentsByCategory.map.length > 0 ? (
              <ul className="space-y-2">
                {documentsByCategory.map.map((doc: any) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      download
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Instructies & Info
            </h3>
            {documentsByCategory.instruction.length > 0 ? (
              <ul className="space-y-2">
                {documentsByCategory.instruction.map((doc: any) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      download
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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

        {/* Rally Submission CTA */}
        <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Rally codes indienen
          </h3>
          <p className="text-gray-700 mb-4">
            Heb je rally zones voltooid? Dien je codes in om punten te verzamelen!
          </p>
          <Link
            to="/dashboard/rally-submission"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {submission ? 'Codes bijwerken' : 'Codes indienen'}
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">Hulp nodig?</p>
          <p>
            📧 <a href="mailto:info@deurdenbocht.be" className="text-primary-600 hover:underline">
              info@deurdenbocht.be
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
