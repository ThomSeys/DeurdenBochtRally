import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link } from 'react-router';
import { useState } from 'react';
import { PortableText } from '@portabletext/react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import MapView from '~/components/MapView';
import { getActiveEdition, getSiteConfig, sanityClient } from '~/lib/sanity.server';
import { getUserId, getUser } from '~/lib/session.server';
import { urlFor } from '~/lib/sanity';
import { Icon } from '~/components/Icon';
import { supabaseAdmin } from '~/lib/supabase.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Route - Deur Den Bocht' },
    { name: 'description', content: 'Ontdek de rally route van Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  const user = await getUser(request);
  const edition = await getActiveEdition();
  const siteConfig = await getSiteConfig();
  
  // Get Event Segments (Concept B)
  // Admins can see all zones, non-admins only see active zones
  const filterCondition = user?.is_admin ? '' : ' && is_active == true';
  const segments = await sanityClient.fetch(`
    *[_type == "rallyZoneV2"${filterCondition}] | order(order asc) {
      _id,
      title,
      order,
      start_location,
      end_location,
      distance_km,
      estimated_duration_minutes,
      character,
      difficulty,
      scenic_highlights,
      is_active
    }
  `);

  console.log('[rally] user:', user?.email, 'is_admin:', user?.is_admin, 'segments count:', segments.length);

  // Get user's check-ins if logged in
  let userCheckIns: string[] = [];
  if (userId) {
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('id', userId)
      .single();

    if (participant) {
      const { data: checkIns } = await supabaseAdmin
        .from('rally_zone_checkins')
        .select('rally_zone_id')
        .eq('participant_id', participant.id);

      if (checkIns) {
        // Get unique zone IDs that the user has checked into
        userCheckIns = [...new Set(checkIns.map(ci => ci.rally_zone_id))];
        console.log('[rally] userCheckIns:', userCheckIns);
      }
    }
  }

  return { userId, user, edition, segments, siteConfig, userCheckIns };
}

export default function Rally() {
  const { userId, user, edition, segments, siteConfig, userCheckIns } = useLoaderData<typeof loader>();
  const [visibleMaps, setVisibleMaps] = useState<Set<string>>(new Set());
  const checkedInSet = new Set(userCheckIns);

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
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">De Rally Route</h1>
          <p className="text-xl max-w-3xl mx-auto">
            8 route segmenten waar je kunt inchecken voor Den Bochtenkoning
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Hoe werkt het?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">1. QR Code Scannen</h3>
              <p className="text-gray-700">Scan de QR code bij het begin van een rally zone om in te checken</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">2. Rijd de Zone</h3>
              <p className="text-gray-700">Volg de route door het segment en geniet van het landschap</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">3. Check Uit</h3>
              <p className="text-gray-700">Scan de QR code aan het einde om uit te checken en je aanwezigheid te registreren</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">4. Voltooi de Route</h3>
              <p className="text-gray-700">Hoe meer zones je doet, hoe hoger je scoort in het klassement!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rally Route Segments */}
      {segments && segments.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              De Rally Route - {segments.length} Segmenten
            </h2>
            <div className="space-y-8">
              {segments.map((segment: any) => {
                const isCheckedIn = checkedInSet.has(segment._id);
                // Admins can always see all zone data
                const canViewData = isCheckedIn || user?.is_admin;
                const difficultyColor = 
                  segment.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  segment.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800';
                  
                return (
                  <div
                    key={segment._id}
                    className={`border-l-4 rounded-sm shadow-lg overflow-hidden ${
                      isCheckedIn 
                        ? 'bg-gradient-to-r from-gray-100 to-primary-200 border-primary-600' 
                        : 'bg-gray-100 border-gray-400'
                    }`}
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                              {segment.title}
                            </h3>
                            {canViewData && (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${difficultyColor}`}>
                                {segment.difficulty === 'easy' ? 'Makkelijk' : 
                                 segment.difficulty === 'moderate' ? 'Gemiddeld' : 
                                 'Uitdagend'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {canViewData ? (
                            <div className="inline-block bg-white px-4 py-2 rounded-sm shadow">
                              <span className="text-sm text-gray-600">Afstand</span>
                              <div className="text-2xl font-bold text-primary-600">{segment.distance_km} km</div>
                            </div>
                          ) : (
                            <div className="inline-block bg-gray-200 px-4 py-2 rounded-sm">
                              <Icon name="lock" className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!canViewData ? (
                        <div className="bg-gray-200 p-4 rounded-sm">
                          <p className="text-gray-600 text-center">
                            <Icon name="lock" className="w-5 h-5 inline mr-2" />
                            Check in bij dit segment om de details te zien
                          </p>
                        </div>
                      ) : (
                        <>
                          {segment.character && (
                            <p className="text-gray-700 mb-4 text-lg italic">{segment.character}</p>
                          )}
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-4 rounded-sm shadow">
                              <h4 className="font-semibold text-gray-900 mb-2">Start</h4>
                              <p className="text-gray-700">{segment.start_location?.name}</p>
                              {segment.start_location?.landmark_description && (
                                <p className="text-sm text-gray-600 mt-1">{segment.start_location.landmark_description}</p>
                              )}
                            </div>
                            <div className="bg-white p-4 rounded-sm shadow">
                              <h4 className="font-semibold text-gray-900 mb-2">Einde</h4>
                              <p className="text-gray-700">{segment.end_location?.name}</p>
                              {segment.end_location?.landmark_description && (
                                <p className="text-sm text-gray-600 mt-1">{segment.end_location.landmark_description}</p>
                              )}
                            </div>
                          </div>
                          
                          {segment.scenic_highlights && segment.scenic_highlights.length > 0 && (
                            <div className="bg-white p-4 rounded-sm shadow mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Hoogtepunten</h4>
                              <div className="flex flex-wrap gap-2">
                                {segment.scenic_highlights.map((highlight: string, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                                    {highlight}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {segment.estimated_duration_minutes && (
                            <p className="text-gray-600 text-sm mb-4">
                              <Icon name="clock" className="w-4 h-4 inline mr-1" />
                              Geschatte tijd: {segment.estimated_duration_minutes} minuten
                            </p>
                          )}
                          
                          {!segment.is_active && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-sm">
                              <p className="text-yellow-800 font-semibold">
                                <Icon name="info" className="w-5 h-5 inline mr-2" />
                                Dit segment is momenteel niet actief
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard Info */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Den Bochtenkoning
          </h2>
          <div className="bg-white rounded-sm shadow-lg p-8">
            <div className="text-center mb-8">
              <Icon name="trophy" className="w-16 h-16 mx-auto text-primary-600 mb-4" />
              <p className="text-xl text-gray-700 mb-4">
                Wie de meeste rally zones checkt, wordt gekroond tot <strong>Den Bochtenkoning</strong>!
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-sm">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <p className="font-bold text-gray-900">Check In</p>
                  <p className="text-sm text-gray-600">Scan de QR code bij het begin van een zone</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-sm">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <p className="font-bold text-gray-900">Check Uit</p>
                  <p className="text-sm text-gray-600">Scan de QR code aan het einde van de zone</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-sm border-2 border-green-500">
                <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-gray-900">Zone Voltooid!</p>
                  <p className="text-sm text-gray-600">Elke voltooide zone telt mee voor het klassement</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-sm">
              <p className="text-sm text-gray-700">
                <strong>Tip:</strong> Hoe meer zones je doet, hoe hoger je scoort. Probeer ze allemaal te doen!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!userId && edition?.registrationOpen && (
        <section className="py-16 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Klaar voor de uitdaging?</h2>
            <p className="text-xl mb-8">
              Schrijf je in en doe mee om Den Bochtenkoning te worden
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
