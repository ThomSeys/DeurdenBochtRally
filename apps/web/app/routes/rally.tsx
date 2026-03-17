import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link } from 'react-router';
import { useState, useEffect } from 'react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import { getActiveEdition, getSiteConfig, sanityClient } from '~/lib/sanity.server';
import { requireUserId, getUser } from '~/lib/session.server';
import { Icon } from '~/components/Icon';
import { supabaseAdmin } from '~/lib/supabase.server';
import { createRequestLogger } from '~/lib/logger.server';
import { useMasterTour } from '~/components/MasterTour';
import Carousel from '~/components/Carousel';
import HeroMedia from '~/components/HeroMedia';

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

const ZONE_COLORS: Record<string, { border: string; badge: string; fallback: string }> = {
  green:  { border: 'border-green-500',  badge: 'bg-green-500',  fallback: 'from-green-900 via-green-700 to-green-500' },
  yellow: { border: 'border-yellow-500', badge: 'bg-yellow-500', fallback: 'from-yellow-900 via-yellow-700 to-yellow-500' },
  orange: { border: 'border-orange-500', badge: 'bg-orange-500', fallback: 'from-orange-900 via-orange-700 to-orange-500' },
  red:    { border: 'border-red-500',    badge: 'bg-red-600',    fallback: 'from-red-950 via-red-800 to-red-600' },
};

const DIFFICULTY_LABELS: Record<string, { label: string; cls: string }> = {
  easy:   { label: 'Eenvoudig',  cls: 'bg-green-100 text-green-700' },
  medium: { label: 'Gemiddeld',  cls: 'bg-yellow-100 text-yellow-700' },
  hard:   { label: 'Uitdagend',  cls: 'bg-red-100 text-red-700' },
};


export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  await requestLogger.info('page-view', 'Rally page loaded');

  const [user, edition, siteConfig] = await Promise.all([
    getUser(request),
    getActiveEdition(),
    getSiteConfig(),
  ]);

  const filterCondition = user?.is_admin ? '' : ' && is_open == true';
  const segments = await sanityClient.fetch(`
    *[_type == "rallyZone"${filterCondition}] | order(order asc) {
      _id, title, description, location, order, color, is_open,
      "imageUrl": image.asset->url,
      routeTips[] {
        name, estimatedDistance, difficulty, routeType,
        "challengeCount": count(locations[defined(challenge)])
      }
    }
  `);

  let userCheckIns: string[] = [];
  if (userId) {
    const { data: checkIns } = await supabaseAdmin
      .from('rally_zone_checkins')
      .select('zone_id')
      .eq('participant_id', userId);
    if (checkIns) {
      userCheckIns = [...new Set(checkIns.map((ci: any) => ci.zone_id))] as string[];
    }
  }

  return { userId, user, edition, segments, siteConfig, userCheckIns };
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
  const { userId, user, edition, segments, siteConfig, userCheckIns } = useLoaderData<typeof loader>();
  const [checkedInSet] = useState(() => new Set(userCheckIns || []));

  const openSegments = segments.filter((s: any) => s.is_open);
  const allDistances = segments.flatMap((s: any) =>
    (s.routeTips || []).map((t: any) => t.estimatedDistance).filter(Boolean)
  );
  const totalMinKm = allDistances.length ? Math.min(...allDistances) : null;
  const totalMaxKm = allDistances.length ? Math.max(...allDistances) : null;
  const checkedInCount = segments.filter((s: any) => checkedInSet.has(s._id)).length;
  const heroBgUrl = siteConfig?.heroBackgroundImage?.asset?.url;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="relative text-white overflow-hidden">
        <HeroMedia siteConfig={siteConfig} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-primary-200 font-semibold text-sm uppercase tracking-widest mb-3">
              {siteConfig?.eventName || 'Deur Den Bocht'} · {siteConfig?.eventDate ? new Date(siteConfig.eventDate).getFullYear() : new Date().getFullYear()}
            </p>
            <h1 className="text-5xl lg:text-6xl font-black mb-4 leading-tight">
              De Rally Route
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed mb-8 max-w-2xl">
              Rijd door spectaculaire zones, ontdek verborgen wegen en doe uitdagende opdrachten onderweg.
              Jij kiest je eigen avontuur.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon name="flag" className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black leading-none">{openSegments.length}</div>
                  <div className="text-xs text-primary-200 mt-0.5">Zones beschikbaar</div>
                </div>
              </div>

              {totalMinKm && (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="road" className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black leading-none">
                      {totalMinKm === totalMaxKm ? `${totalMinKm}` : `${totalMinKm}–${totalMaxKm}`}
                      <span className="text-base font-semibold ml-1">km</span>
                    </div>
                    <div className="text-xs text-primary-200 mt-0.5">Per zone</div>
                  </div>
                </div>
              )}

              {checkedInCount > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/30 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="check-circle" className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-black leading-none">
                      {checkedInCount}
                      <span className="text-base font-normal text-primary-300">/{openSegments.length}</span>
                    </div>
                    <div className="text-xs text-primary-200 mt-0.5">Ingecheckt</div>
                  </div>
                </div>
              )}
            </div>

            <RallyTourButton />
          </div>
        </div>
      </section>

      {/* Zone Cards */}
      {segments && segments.length > 0 && (
        <section data-tour="rally-segments" className="py-12 flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Rally Zones</h2>
                <p className="text-gray-500">Klik op een zone voor de volledige details, route tips en challenges.</p>
              </div>
              {checkedInCount > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-teal-700 font-semibold bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                  <Icon name="check-circle" className="w-4 h-4" />
                  {checkedInCount} van {openSegments.length} ingecheckt
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {segments.map((segment: any) => {
                const isCheckedIn = checkedInSet.has(segment._id);
                const distances = (segment.routeTips || []).map((t: any) => t.estimatedDistance).filter(Boolean);
                const minDist = distances.length ? Math.min(...distances) : null;
                const maxDist = distances.length ? Math.max(...distances) : null;
                const routeTipCount = (segment.routeTips || []).length;
                const challengeCount = (segment.routeTips || []).reduce(
                  (sum: number, t: any) => sum + (t.challengeCount || 0),
                  0
                );
                const difficulties = [
                  ...new Set(
                    (segment.routeTips || []).map((t: any) => t.difficulty).filter(Boolean)
                  ),
                ] as string[];
                const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
                difficulties.sort((a, b) => (diffOrder[a] ?? 99) - (diffOrder[b] ?? 99));
                const colors = ZONE_COLORS[segment.color] || ZONE_COLORS.green;

                return (
                  <Link
                    key={segment._id}
                    to={`/zone/${segment.order}`}
                    className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 border border-gray-100"
                  >
                    {/* Image banner */}
                    <div className="relative h-52 overflow-hidden">
                      {segment.imageUrl ? (
                        <img
                          src={segment.imageUrl}
                          alt={segment.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${colors.fallback}`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Zone number */}
                      <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
                        <span className="text-sm font-black text-gray-800">{segment.order}</span>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow ${
                          segment.is_open
                            ? 'bg-green-500 text-white'
                            : 'bg-black/50 text-gray-200 backdrop-blur-sm'
                        }`}>
                          {segment.is_open ? 'Open' : 'Gesloten'}
                        </span>
                      </div>

                      {/* Distance overlay bottom-left */}
                      {minDist !== null && (
                        <div className="absolute bottom-3 left-3 text-white drop-shadow-md">
                          <div className="text-xl font-black">
                            {minDist === maxDist ? `${minDist} km` : `${minDist}–${maxDist} km`}
                          </div>
                          <div className="text-xs text-white/80">per route</div>
                        </div>
                      )}

                      {/* Checked-in badge bottom-right */}
                      {isCheckedIn && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-teal-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                          <Icon name="checkSimple" className="w-3 h-3" />
                          Ingecheckt
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors leading-snug">
                        {segment.title}
                      </h3>

                      {segment.location && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                          <Icon name="marker" className="w-4 h-4 shrink-0 text-gray-400" />
                          <span>{segment.location}</span>
                        </div>
                      )}

                      {segment.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                          {segment.description}
                        </p>
                      )}

                      {/* Stats row */}
                      {(routeTipCount > 0 || challengeCount > 0) && (
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          {routeTipCount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="map" className="w-4 h-4" />
                              <span>{routeTipCount} {routeTipCount === 1 ? 'route' : 'routes'}</span>
                            </div>
                          )}
                          {challengeCount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Icon name="star" className="w-4 h-4" />
                              <span>{challengeCount} {challengeCount === 1 ? 'challenge' : 'challenges'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Difficulty pills */}
                      {difficulties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {difficulties.map((d: string) => {
                            const diff = DIFFICULTY_LABELS[d];
                            if (!diff) return null;
                            return (
                              <span key={d} className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff.cls}`}>
                                {diff.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="px-5 pb-4 flex items-center justify-between">
                      <div className={`h-1 w-10 rounded-full ${colors.badge}`} />
                      <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-700 flex items-center gap-1 transition-colors">
                        Ontdekken
                        <Icon name="chevron-right" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How it works (collapsible) */}
      <section data-tour="rally-how-it-works" className="py-10 bg-white border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <details className="rounded-xl overflow-hidden border border-gray-200">
            <summary className="p-5 cursor-pointer flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors select-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon name="info" className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Hoe werkt het?</h2>
                  <p className="text-xs text-gray-500">Korte uitleg over zones, check-ins en challenges</p>
                </div>
              </div>
              <Icon name="chevron-right" className="w-5 h-5 text-gray-400 rotate-90" />
            </summary>
            <div className="p-6 border-t border-gray-200">
              <Carousel
                items={[
                  { title: '1. Kies Je Avontuur', description: 'Kies een rally zone en bekijk de route tips die jou aanspreken.' },
                  { title: '2. Download & Rijd', description: 'Download de GPX en geniet van prachtige wegen, bochten en landschappen.' },
                  { title: '3. Check In (Optioneel)', description: 'Check in bij de zone om je bezoek te registreren en badges te verdienen.' },
                  { title: '4. Doe de Challenges (Optioneel)', description: 'Voltooi highlights bij bijzondere locaties en verdien punten voor de leaderboard.' },
                  { title: '5. Deel Je Verhaal', description: "Upload foto's en deel je beleving met de community." },
                ]}
                renderItem={(item: any) => (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-base mb-1 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                )}
                showControls={true}
                showDots={true}
                showCounter={false}
                className=""
              />
            </div>
          </details>
        </div>
      </section>

      {/* CTA for non-registered users */}
      {!userId && edition?.registrationOpen && (
        <section className="py-16 bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Klaar voor het avontuur?</h2>
            <p className="text-xl mb-8">Schrijf je in en ontdek de mooiste routes en verhalen</p>
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









