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
        <HeroMedia siteConfig={siteConfig} neverShowVideo />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-20">
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
        <section data-tour="rally-segments" className="overflow-hidden">
          {segments.map((segment: any, idx: number) => {
            const isCheckedIn = checkedInSet.has(segment._id);
            const distances = (segment.routeTips || []).map((t: any) => t.estimatedDistance).filter(Boolean);
            const minDist = distances.length ? Math.min(...distances) : null;
            const maxDist = distances.length ? Math.max(...distances) : null;
            const routeTipCount = (segment.routeTips || []).length;
            const challengeCount = (segment.routeTips || []).reduce(
              (sum: number, t: any) => sum + (t.challengeCount || 0), 0
            );
            const difficulties = [
              ...new Set((segment.routeTips || []).map((t: any) => t.difficulty).filter(Boolean)),
            ] as string[];
            const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
            difficulties.sort((a, b) => (diffOrder[a] ?? 99) - (diffOrder[b] ?? 99));
            const colors = ZONE_COLORS[segment.color] || ZONE_COLORS.green;
            const imageRight = idx % 2 === 0;
            const chapterNum = String(segment.order).padStart(2, '0');

            const textHalf = (
              <div className="lg:w-[52%] bg-gray-900 text-white flex flex-col justify-center px-8 py-16 lg:px-16 xl:px-24">
                {/* Zone label row */}
                <div className="flex items-center gap-3 mb-5">
                  <p className="text-primary-400 font-bold uppercase tracking-widest text-xs">
                    Zone {chapterNum}
                  </p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    segment.is_open ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                  }`}>
                    {segment.is_open ? 'Open' : 'Gesloten'}
                  </span>
                  {isCheckedIn && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 flex items-center gap-1">
                      <Icon name="checkSimple" className="w-3 h-3" /> Ingecheckt
                    </span>
                  )}
                </div>

                <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-4 leading-tight">
                  {segment.title}
                </h2>

                {segment.location && (
                  <div className="flex items-center gap-2 text-white/40 text-sm mb-6 border-l-2 border-primary-500 pl-4">
                    <Icon name="marker" className="w-4 h-4 shrink-0" />
                    <span>{segment.location}</span>
                  </div>
                )}

                {segment.description && (
                  <p className="text-white/65 text-base lg:text-lg leading-relaxed mb-10">
                    {segment.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-10">
                  {minDist !== null && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon name="road" className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <div className="text-xl font-black text-white leading-none">
                          {minDist === maxDist ? `${minDist}` : `${minDist}–${maxDist}`}
                          <span className="text-sm font-semibold ml-1">km</span>
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">Per route</div>
                      </div>
                    </div>
                  )}
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
                  {challengeCount > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon name="star" className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <div className="text-xl font-black text-white leading-none">{challengeCount}</div>
                        <div className="text-xs text-white/40 mt-0.5">{challengeCount === 1 ? 'Challenge' : 'Challenges'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Difficulty + CTA */}
                <div className="flex flex-wrap items-center gap-3">
                  {difficulties.map((d: string) => {
                    const diff = DIFFICULTY_LABELS[d];
                    if (!diff) return null;
                    return (
                      <span key={d} className={`text-xs font-semibold px-3 py-1 rounded-full ${diff.cls}`}>
                        {diff.label}
                      </span>
                    );
                  })}
                  <Link
                    to={`/zone/${segment.order}`}
                    className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors group/cta"
                  >
                    Ontdekken
                    <Icon name="chevron-right" className="w-4 h-4 group-hover/cta:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Color bar */}
                <div className={`mt-10 h-0.5 w-16 rounded-full ${colors.badge}`} />
              </div>
            );

            const imageHalf = (
              <div className="lg:w-[48%] h-72 sm:h-[28rem] lg:h-auto relative">
                {segment.imageUrl ? (
                  <img
                    src={segment.imageUrl}
                    alt={segment.title}
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${colors.fallback}`} />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-6 left-6 text-white/[0.12] text-[110px] font-black leading-none select-none">
                  {chapterNum}
                </div>
              </div>
            );

            return (
              <div key={segment._id} className="flex flex-col-reverse lg:flex-row lg:items-stretch">
                {imageRight ? <>{textHalf}{imageHalf}</> : <>{imageHalf}{textHalf}</>}
              </div>
            );
          })}
        </section>
      )}

      {/* How it works */}
      <section data-tour="rally-how-it-works" className="bg-primary-950 relative overflow-hidden py-24 px-8">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden>
          <span className="text-[200px] font-black text-white/[0.03] leading-none">HOE</span>
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />

        <div className="relative max-w-4xl mx-auto text-white">
          <p className="text-primary-400 font-bold uppercase tracking-widest text-xs mb-5 text-center">
            In vijf stappen
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-center mb-20 leading-tight">
            Hoe werkt het?
          </h2>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-accent-500/30 hidden md:block" />
            <div className="space-y-0">
              {[
                { num: '01', title: 'Kies Je Avontuur', desc: 'Kies een rally zone en bekijk de route tips die jou aanspreken.' },
                { num: '02', title: 'Download & Rijd', desc: 'Download de GPX en geniet van prachtige wegen, bochten en landschappen.' },
                { num: '03', title: 'Check In', desc: 'Check in bij de zone om je bezoek te registreren en badges te verdienen. Volledig optioneel.' },
                { num: '04', title: 'Doe de Challenges', desc: 'Voltooi highlights bij bijzondere locaties en verdien punten voor de leaderboard. Ook optioneel.' },
                { num: '05', title: 'Deel Je Verhaal', desc: "Upload foto's en deel je beleving met de community via #Bochtenkoning2026." },
              ].map((step) => (
                <div key={step.num} className="relative md:pl-16 border-b border-white/10 last:border-b-0 py-8">
                  <div className="absolute left-0 top-10 w-2.5 h-2.5 rounded-full bg-accent-500 -translate-x-[5px] hidden md:block" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
                    <span className="text-accent-500 font-black text-lg tabular-nums shrink-0">{step.num}</span>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2">{step.title}</h3>
                      <p className="text-white/55 text-base leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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









