import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link } from 'react-router';
import { useState } from 'react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import MapView from '~/components/MapView';
import RouteTipsMap from '~/components/RouteTipsMap';
import ZoneRouteTips from '~/components/ZoneRouteTips';
import { getActiveEdition, getSiteConfig, sanityClient } from '~/lib/sanity.server';
import { getUserId, getUser } from '~/lib/session.server';
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
          name,
          coordinates {
            lat,
            lng
          },
          type,
          description
        }
      }
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
        .select('zone_id')
        .eq('participant_id', participant.id);

      if (checkIns) {
        // Get unique zone IDs that the user has checked into
        userCheckIns = [...new Set(checkIns.map(ci => ci.zone_id))];
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
      <section className="bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">De Rally Route</h1>
          <p className="text-xl max-w-3xl mx-auto">
            8 adventure segmenten om je rit onvergetelijk te maken
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
              <h3 className="font-bold text-lg mb-2">1. Kies Je Avontuur</h3>
              <p className="text-gray-700">Kies tussen de volledige route of selecteer specifieke rally zones die jou aanspreken</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">2. Download & Rijd</h3>
              <p className="text-gray-700">Download de GPX en geniet van prachtige wegen, bochten en landschappen</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">3. Check In (Optioneel)</h3>
              <p className="text-gray-700">Scan QR codes bij zones om je reis te tracken - geen verplichting, gewoon voor de fun!</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">4. Deel Je Verhaal</h3>
              <p className="text-gray-700">Upload foto's en deel je beleving met de community - dát maakt jou een echte bocht-held!</p>
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
                          <div className="flex items-center gap-3 mb-2">
                            <svg className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                              {segment.title}
                            </h3>
                            {segment.is_open ? (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                Uitdagend
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                                Binnenkort
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm ml-8">{segment.location}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="inline-block bg-gray-50 px-4 py-2 rounded-lg">
                            <span className="text-sm text-gray-600">Afstand</span>
                            <div className="text-xl font-bold text-primary-600">
                              {segment.routeTips?.length > 0 
                                ? `${Math.min(...segment.routeTips.map((t: any) => t.estimatedDistance))}-${Math.max(...segment.routeTips.map((t: any) => t.estimatedDistance))} km`
                                : '- km'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </summary>
                    
                    <div className="px-6 md:px-8 pb-6 md:pb-8 border-t border-gray-100">
                      {segment.description && (
                        <p className="text-gray-700 mb-6 mt-4">{segment.description}</p>
                      )}
                      
                      {/* Route Tips */}
                      {segment.routeTips && segment.routeTips.length > 0 && (
                        <ZoneRouteTips
                          routeTips={segment.routeTips}
                          zoneTitle={segment.title}
                          zoneStartLocation={segment.startLocation}
                          zoneEndLocation={segment.endLocation}
                        />
                      )}
                      
                      {!segment.is_open && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg mt-4">
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
