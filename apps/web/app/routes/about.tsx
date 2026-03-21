import { useRef, useEffect, useState } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import MapView from '~/components/MapView';
import HeroMedia from '~/components/HeroMedia';
import { Icon } from '~/components/Icon';
import { getActiveEdition, getScheduleItems, getBenefitItems, getFAQItems, getSiteConfig, sanityClient } from '~/lib/sanity.server';
import { useHaptics } from '~/lib/haptics';
import { getUserId } from '~/lib/session.server';
import PortableText from '~/components/PortableText';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const siteConfig = data?.siteConfig;
  const seoImage = siteConfig?.seoImage?.asset?.url;
  const aboutTitle = `Over - ${siteConfig?.eventName || 'Deur Den Bocht'}`;
  const aboutDescription = `Leer alles over het ${siteConfig?.eventName || 'Deur Den Bocht'} rally event, het programma, de route en veel meer.`;
  
  return [
    { title: aboutTitle },
    { name: 'description', content: aboutDescription },
    // Open Graph tags for social media sharing
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: aboutTitle },
    { property: 'og:description', content: aboutDescription },
    ...(seoImage ? [{ property: 'og:image', content: seoImage }] : []),
    { property: 'og:url', content: 'https://deurdenbochtmotorrit.be/about' },
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: aboutTitle },
    { name: 'twitter:description', content: aboutDescription },
    ...(seoImage ? [{ name: 'twitter:image', content: seoImage }] : []),
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'About page loaded');
  
  // Fetch edition and config in parallel
  const [edition, siteConfig] = await Promise.all([
    getActiveEdition(),
    getSiteConfig(),
  ]);

  // Fetch edition-dependent data in parallel
  const editionId = edition._id;
  const [schedule, benefits, faq, stories] = await Promise.all([
    getScheduleItems(editionId),
    getBenefitItems(editionId),
    getFAQItems(editionId),
    sanityClient.fetch(
      `*[_type == "eventStory" && references($editionId)] | order(order asc) {
        _id,
        title,
        subtitle,
        content,
        highlights,
        "imageUrl": image.asset->url
      }`,
      { editionId }
    ),
  ]);

  return { userId, edition, siteConfig, schedule, benefits, faq, stories };
}

function ParallaxImage({ src, alt, watermark }: { src: string; alt: string; watermark: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;
    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      const progress = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight;
      img.style.transform = `translateY(${progress * 80}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={containerRef} className="lg:w-[48%] h-72 sm:h-[28rem] lg:h-auto relative overflow-hidden">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full h-[125%] object-cover block will-change-transform -mt-[12.5%]"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-6 left-6 text-white/[0.12] text-[110px] font-black leading-none select-none">
        {watermark}
      </div>
    </div>
  );
}

type NavItem = { id: string; label: string; tag?: string };

function ChapterNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const { tap } = useHaptics();

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [items]);

  const scrollTo = (id: string) => {
    tap();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[1200]">
      {/* Panel */}
      <div
        className={`mb-3 origin-bottom-left transition-all duration-200 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-gray-900 border border-white/10 shadow-2xl rounded-xl overflow-hidden min-w-[210px]">
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Navigatie</p>
          </div>
          <ul>
            {items.map((item, i) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    activeId === item.id ? 'text-white' : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  <span className={`text-[10px] font-black tabular-nums shrink-0 ${
                    activeId === item.id ? 'text-primary-400' : 'text-white/20'
                  }`}>
                    {item.tag ?? String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold leading-snug">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => { tap(); setOpen(v => !v); }}
        className="w-10 h-10 rounded-full bg-gray-900 border border-white/15 shadow-xl flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
        aria-label={open ? 'Sluit hoofdstukken' : 'Open hoofdstukken'}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="2" y1="12" x2="14" y2="12" />
        </svg>
      </button>
    </div>
  );
}

// List of available icon names in the Icon component
const availableIcons = [
  'bell', 'check', 'checkSimple', 'x', 'lightning', 'megaphone', 'target', 'chart', 'flag', 'trophy',
  'cloud', 'lightbulb', 'filter', 'refresh', 'clock', 'map', 'marker', 'warning', 'alert-triangle',
  'alert-circle', 'lock', 'users', 'document', 'search', 'settings', 'phone', 'calendar', 'utensils',
  'motorcycle', 'coffee', 'info', 'eye', 'wave', 'crown', 'camera', 'book', 'clipboard', 'mail',
  'award', 'rocket', 'cookie', 'database', 'ban', 'building', 'door', 'star', 'heart', 'diamond',
  'hourglass', 'trash', 'home', 'shield', 'money', 'chevron-left', 'chevron-right', 'book-open',
  'plus', 'send', 'loader', 'message-circle', 'check-circle', 'info-circle', 'arrow-left', 'cog',
  'mountain', 'road', 'tree', 'party', 'user', 'arrow-back', 'alert', 'gift', 'bed'
];

// Check if icon name is valid, return null if not
function getValidIconName(icon: string | null | undefined): string | null {
  if (!icon) return null;
  return availableIcons.includes(icon) ? icon : null;
}

export default function About() {
  const { userId, edition, siteConfig, schedule, benefits, faq, stories } = useLoaderData<typeof loader>();

  const everyoneBenefits = benefits.filter((b: any) => b.category === 'everyone');
  const winnerBenefits = benefits.filter((b: any) => b.category === 'winner');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative text-white overflow-hidden">
        <HeroMedia siteConfig={siteConfig} neverShowVideo />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-20">
          <div className="max-w-3xl">
            <p className="text-primary-200 font-semibold text-sm uppercase tracking-widest mb-3">
              {siteConfig?.eventName || 'Deur Den Bocht'} · {edition ? new Date(edition.eventDate).getFullYear() : new Date().getFullYear()}
            </p>
            <h1 className="text-5xl lg:text-6xl font-black mb-4 leading-tight">
              Over het Event
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed mb-8 max-w-2xl">
              Een unieke rally-ervaring door de mooiste wegen van België. Geen race, geen tijdsdruk — puur rijplezier.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {edition && (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="calendar" className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black leading-none">
                      {new Date(edition.eventDate).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}
                    </div>
                    <div className="text-xs text-primary-200 mt-0.5">
                      {new Date(edition.eventDate).getFullYear()}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon name="road" className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black leading-none">500+<span className="text-base font-semibold ml-1">km</span></div>
                  <div className="text-xs text-primary-200 mt-0.5">Puur rijplezier</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon name="flag" className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black leading-none">4</div>
                  <div className="text-xs text-primary-200 mt-0.5">Rally zones</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Icon name="motorcycle" className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black leading-none">2</div>
                  <div className="text-xs text-primary-200 mt-0.5">Rijformules</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter navigation */}
      {stories && stories.length > 0 && (
        <ChapterNav
          items={[
            ...stories.map((s: any, i: number) => ({
              id: `chapter-${i + 1}`,
              label: s.title,
            })),
            ...(schedule && schedule.length > 0 ? [{ id: 'nav-programma', label: 'Programma', tag: '—' }] : []),
            ...(faq && faq.length > 0 ? [{ id: 'nav-faq', label: 'FAQ', tag: '—' }] : []),
            { id: 'nav-overnachtingen', label: 'Overnachtingen', tag: '—' },
          ]}
        />
      )}

      {/* Event Stories */}
      {stories && stories.length > 0 && (
        <section className="overflow-hidden">
          {stories.map((story: any, index: number) => {
            const hasImage = !!story.imageUrl;
            const chapterNum = String(index + 1).padStart(2, '0');

            // Stories with image: split layout (dark panel + parallax image)
            if (hasImage) {
              const imageRight = index % 2 === 0;
              const textHalf = (
                <div className="lg:w-[52%] bg-gray-900 text-white flex flex-col justify-center px-8 py-16 lg:px-16 xl:px-24">
                  <p className="text-primary-400 font-bold uppercase tracking-widest text-xs mb-5">
                    Hoofdstuk {chapterNum}
                  </p>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-4 leading-tight">
                    {story.title}
                  </h2>
                  {story.subtitle && (
                    <p className="text-white/55 text-lg mb-10 font-medium border-l-2 border-primary-500 pl-4">
                      {story.subtitle}
                    </p>
                  )}
                  <PortableText value={story.content} variant="dark" />
                  {story.highlights && story.highlights.length > 0 && (
                    <div className={`mt-10 pt-8 border-t border-white/10 grid gap-6 ${story.highlights.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                      {story.highlights.map((highlight: any) => (
                        <div key={highlight._key} className="text-center">
                          <div className="text-3xl font-black text-primary-400 mb-1">
                            {highlight.number}
                          </div>
                          <div className="text-xs text-white/40 uppercase tracking-widest leading-snug">
                            {highlight.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
              // index 2 = hoofdstuk 3: sticky parallax — foto blijft steken terwijl tekst scrollt
              const imageHalf = (
                <ParallaxImage src={story.imageUrl} alt={story.title} watermark={chapterNum} />
              );
              return (
                <div key={story._id} id={`chapter-${index + 1}`} className="flex flex-col-reverse lg:flex-row lg:items-stretch">
                  {imageRight ? <>{textHalf}{imageHalf}</> : <>{imageHalf}{textHalf}</>}
                </div>
              );
            }

            // No image: dramatic dark full-width section
            const darkBgs = ['bg-gray-900', 'bg-primary-950', 'bg-gray-800'];
            const bgClass = darkBgs[index % darkBgs.length];
            const highlightCols = story.highlights?.length >= 3 ? 'grid-cols-3' : 'grid-cols-2';
            return (
              <div key={story._id} id={`chapter-${index + 1}`} className={`${bgClass} relative overflow-hidden py-28 px-8`}>
                {/* Decorative watermark number */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden>
                  <span className="text-[260px] font-black text-white/[0.03] leading-none">
                    {chapterNum}
                  </span>
                </div>
                {/* Accent lines decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />

                <div className="relative max-w-4xl mx-auto text-white">
                  <p className="text-primary-400 font-bold uppercase tracking-widest text-xs mb-5 text-center">
                    Hoofdstuk {chapterNum}
                  </p>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-center mb-4 leading-tight">
                    {story.title}
                  </h2>
                  {story.subtitle && (
                    <p className="text-white/55 text-xl text-center mb-14 font-medium max-w-xl mx-auto">
                      {story.subtitle}
                    </p>
                  )}
                  <div className="max-w-2xl mx-auto">
                    <PortableText value={story.content} variant="dark" />
                  </div>
                  {story.highlights && story.highlights.length > 0 && (
                    <div className={`mt-16 grid ${highlightCols} gap-px bg-white/10 max-w-2xl mx-auto`}>
                      {story.highlights.map((highlight: any) => (
                        <div key={highlight._key} className="bg-gray-900 py-8 px-6 text-center">
                          <div className="text-4xl font-black text-primary-400 mb-2">
                            {highlight.number}
                          </div>
                          <div className="text-xs text-white/50 uppercase tracking-widest">
                            {highlight.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Schedule */}
      {schedule && schedule.length > 0 && (
        <section id="nav-programma" className="bg-gray-900 relative overflow-hidden py-28 px-8">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden>
            <span className="text-[220px] font-black text-white/[0.03] leading-none">DAG</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-40" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-40" />

          <div className="relative max-w-4xl mx-auto">
            <p className="text-primary-400 font-bold uppercase tracking-widest text-xs mb-5 text-center">
              Jouw dag op een rij
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white text-center mb-20 leading-tight">
              Programma
            </h2>

            <div className="relative">
              {/* Vertical accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-accent-500/30 hidden md:block" />

              <div className="space-y-0">
                {schedule.map((item: any, index: number) => (
                  <div key={item._id} className="relative md:pl-16 group">
                    {/* Dot on the line */}
                    <div className="absolute left-0 top-8 w-2.5 h-2.5 rounded-full bg-accent-500 -translate-x-[5px] hidden md:block" />

                    <div className="border-b border-white/10 last:border-b-0 py-10">
                      {/* Time + title row */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 mb-4">
                        <span className="text-accent-500 font-black text-lg tabular-nums shrink-0">
                          {item.time}
                        </span>
                        <h3 className="text-2xl lg:text-3xl font-black text-white leading-tight">
                          {item.title}
                        </h3>
                      </div>

                      <p className="text-white/55 text-base lg:text-lg leading-relaxed mb-6">
                        {item.description}
                      </p>

                      {item.details && item.details.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-3 border-l-2 border-accent-500/40 pl-5">
                          {item.details.map((detail: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <Icon name="check" className="w-4 h-4 text-accent-500 shrink-0 mt-1" />
                              <span className="text-white/65 text-sm">{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {index === 0 && siteConfig?.startLocation && (
                        <div className="mt-8">
                          <MapView
                            startPoint={siteConfig.startLocation}
                            endPoint={siteConfig.startLocation}
                            className="h-56 lg:h-80"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* What you receive */}
      {benefits && benefits.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Wat krijg je?
              </h2>
              <p className="text-lg text-gray-600">Meer dan alleen een rit</p>
            </div>
            
            {everyoneBenefits.length > 0 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-gray-800 inline-flex items-center gap-2 px-6 py-2 bg-primary-50 rounded-full">
                    <Icon name="gift" className="w-6 h-6 text-primary-600" /> Iedere deelnemer krijgt
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {everyoneBenefits.map((benefit: any) => {
                    const iconName = getValidIconName(benefit.icon);
                    return (
                      <div key={benefit._id} className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-lg shadow-md hover:shadow-xl transition-all border border-gray-100 hover:border-primary-200">
                        <div className="flex flex-col items-center text-center">
                          {iconName && (
                            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Icon name={iconName} className="w-10 h-10 text-primary-600" />
                            </div>
                          )}
                          <h4 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h4>
                          <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {winnerBenefits.length > 0 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-primary-900 inline-block px-6 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                    🏆 De winnaar krijgt
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {winnerBenefits.map((benefit: any) => {
                    const iconName = getValidIconName(benefit.icon);
                    return (
                      <div key={benefit._id} className="group relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700 p-8 rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative flex flex-col items-center text-center">
                          {iconName && (
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Icon name={iconName} className="w-10 h-10 text-white" />
                            </div>
                          )}
                          <h4 className="text-xl font-bold text-white mb-3">{benefit.title}</h4>
                          <p className="text-primary-50 leading-relaxed">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section id="nav-faq" className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Veelgestelde Vragen
              </h2>
              <p className="text-lg text-gray-600">We beantwoorden je vragen</p>
            </div>
            <div className="space-y-4">
              {faq.map((item: any) => {
                const iconName = getValidIconName(item.icon);
                return (
                  <details key={item._id} className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <summary className="font-semibold text-lg text-gray-900 cursor-pointer p-6 flex items-start justify-between gap-4">
                      <span className="flex items-start gap-3">
                        {iconName && (
                          <Icon name={iconName} className="w-6 h-6 flex-shrink-0 text-primary-600" />
                        )}
                        <span>{item.question}</span>
                      </span>
                      <Icon name="chevron-down" className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-6 pb-6 pt-2">
                      <div className="pl-11 text-gray-700 leading-relaxed border-l-4 border-primary-200 pl-4">
                        {item.answer}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Accommodation */}
      <section id="nav-overnachtingen" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Overnachting in de Buurt
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Het event eindigt rond 21:00 bij Baraque de Fraiture. Na 13+ uur motorrijden raden we sterk aan om in de buurt te blijven.
            </p>
          </div>

          {/* BELANGRIJKE DISCLAIMER */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Icon name="alert-triangle" className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belangrijk: Op Eigen Kosten</h3>
                <p className="text-gray-800 leading-relaxed mb-2">
                  <strong>De organisatie regelt GEEN overnachting en dit is NIET inbegrepen in je inschrijving.</strong>
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Alle onderstaande accommodaties zijn suggesties ter informatie. Je boekt zelf rechtstreeks bij het hotel/camping. 
                  VZW Deur Den Bocht heeft geen overeenkomsten met deze accommodaties en ontvangt hier geen vergoeding voor. 
                  Dit is louter service-informatie voor jouw gemak.
                </p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Ligging Eindpunt & Accommodaties</h3>
            <div className="rounded-lg overflow-hidden relative">
              <MapView
                startPoint={{ lat: 50.25, lng: 5.7345567, name: "Baraque de Fraiture (Finish)" }}
                endPoint={{ lat: 50.25, lng: 5.7345567, name: "Baraque de Fraiture (Finish)" }}
                markers={[
                  { lat: 50.2833, lng: 5.9167, name: "Vielsalm (~10km)", color: "#059669", icon: "🏨" },
                  { lat: 50.1842, lng: 5.5772, name: "La Roche-en-Ardenne (~20km)", color: "#0284c7", icon: "🏨" },
                  { lat: 50.1333, lng: 5.7833, name: "Houffalize (~15km)", color: "#059669", icon: "🏨" },
                  { lat: 50.4264, lng: 6.0261, name: "Malmedy (~25km)", color: "#d97706", icon: "🏍️" },
                  { lat: 50.3500, lng: 5.8500, name: "Campings regio", color: "#16a34a", icon: "🏕️" },
                ]}
                className="h-[80vh]"
              />
              <div className="md:absolute md:top-4 md:left-4 z-[1000] lg:w-1/3 h-[calc(100%-2rem)] overflow-y-auto backdrop-blur-sm lg:rounded-lg py-4 lg:py-0">
                {/* Accommodation Options */}
                <div className="space-y-6">
                  {/* Vielsalm */}
                  <div className="bg-white rounded-lg shadow-lg border-2 border-primary-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Icon name="building" className="w-10 h-10 text-primary-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Vielsalm</h3>
                          <p className="text-primary-600 font-medium flex items-center gap-1 mt-1">
                            <Icon name="road" className="w-4 h-4" />
                            ~10 km van finish (15 min rijden)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          DICHTSBIJ
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Centraal gelegen stadje met goede voorzieningen. Perfecte uitvalsbasis voor motorrijders.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏨 Hotel Des Ardennes</h4>
                        <p className="text-sm text-gray-600 mb-2">Centrum Vielsalm, klassiek hotel met restaurant</p>
                        <p className="text-xs text-gray-500">±€60-80/nacht • Tel: +32 80 21 50 88</p>
                      </div>
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏡 B&B La Fermette</h4>
                        <p className="text-sm text-gray-600 mb-2">Gezellige B&B in landelijke omgeving</p>
                        <p className="text-xs text-gray-500">±€70-90/nacht • booking.com</p>
                      </div>
                    </div>
                  </div>

                  {/* La Roche-en-Ardenne */}
                  <div className="bg-white rounded-lg shadow-lg border-2 border-primary-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Icon name="building" className="w-10 h-10 text-primary-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">La Roche-en-Ardenne</h3>
                          <p className="text-primary-600 font-medium flex items-center gap-1 mt-1">
                            <Icon name="road" className="w-4 h-4" />
                            ~20 km van finish (25 min rijden)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                          POPULAIR
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Pittoresk toeristisch stadje met kasteel. Veel restaurants en gezellige uitstraling. Ideaal voor een avondje ontspannen.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏨 Hotel Le Chalet</h4>
                        <p className="text-sm text-gray-600 mb-2">Modern hotel met zwembad en wellness</p>
                        <p className="text-xs text-gray-500">±€90-120/nacht • www.lechalet.be</p>
                      </div>
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏨 Hotel Le Grillon</h4>
                        <p className="text-sm text-gray-600 mb-2">Charmant familiehotel in centrum</p>
                        <p className="text-xs text-gray-500">±€70-95/nacht • Tel: +32 84 41 18 27</p>
                      </div>
                    </div>
                  </div>

                  {/* Houffalize */}
                  <div className="bg-white rounded-lg shadow-lg border-2 border-primary-200 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Icon name="building" className="w-10 h-10 text-primary-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Houffalize</h3>
                          <p className="text-primary-600 font-medium flex items-center gap-1 mt-1">
                            <Icon name="road" className="w-4 h-4" />
                            ~15 km van finish (20 min rijden)
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Sportief dorp, bekend bij mountainbikers en motorrijders. Goede middenweg qua afstand en prijs.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏨 Hotel de la Cascade</h4>
                        <p className="text-sm text-gray-600 mb-2">Comfortabel hotel met restaurant</p>
                        <p className="text-xs text-gray-500">±€65-85/nacht • booking.com</p>
                      </div>
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏡 B&B's & Gîtes</h4>
                        <p className="text-sm text-gray-600 mb-2">Verschillende kleinschalige B&B's beschikbaar</p>
                        <p className="text-xs text-gray-500">±€50-75/nacht • Airbnb/booking.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Motorherbergen */}
                  <div className="bg-white rounded-lg shadow-lg border-2 border-accent-300 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Icon name="motorcycle" className="w-10 h-10 text-accent-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Motorvriendelijke Accommodaties</h3>
                          <p className="text-accent-600 font-medium flex items-center gap-1 mt-1">
                            <Icon name="heart" className="w-4 h-4" />
                            Speciale voorzieningen voor motorrijders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-accent-100 text-accent-800 text-xs font-bold rounded-full">
                          🏍️ BIKER
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Deze locaties zijn speciaal ingericht voor motorrijders: overdekte/beveiligde parking, droograuimte voor kledij, werkplaats, wasstraat.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏍️ Gîte du Biker (Malmedy)</h4>
                        <p className="text-sm text-gray-600 mb-2">Motorherberg met alle voorzieningen, 25km van finish</p>
                        <p className="text-xs text-gray-500">±€60-80/nacht • www.gitedubiker.be</p>
                      </div>
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏍️ Hotel Sport (Houffalize)</h4>
                        <p className="text-sm text-gray-600 mb-2">Bekend bij motorclubs, beveiligde parking</p>
                        <p className="text-xs text-gray-500">±€70-90/nacht • Tel: +32 61 28 80 35</p>
                      </div>
                    </div>
                  </div>

                  {/* Campings */}
                  <div className="bg-white rounded-lg shadow-lg border-2 border-green-300 p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Icon name="tree" className="w-10 h-10 text-green-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Campings</h3>
                          <p className="text-green-600 font-medium flex items-center gap-1 mt-1">
                            <Icon name="money" className="w-4 h-4" />
                            Budget-vriendelijk €15-30/nacht
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          VOORDELIG
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">
                      Diverse campings in de Ardennen. Ideaal voor avonturiers of groepen die samen willen blijven.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏕️ Camping Petite Suisse</h4>
                        <p className="text-sm text-gray-600 mb-2">Grote camping nabij Dochamps, ~12km van finish</p>
                        <p className="text-xs text-gray-500">±€20-30/nacht plaatsje • www.petitesuisse.be</p>
                      </div>
                      <div className="bg-gray-50 rounded p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">🏕️ Camping Les Myrtilles</h4>
                        <p className="text-sm text-gray-600 mb-2">Nabij Vielsalm, kleinschalig en rustig</p>
                        <p className="text-xs text-gray-500">±€15-25/nacht plaatsje • booking.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              📍 Baraque de Fraiture (hoogste punt van België) - Eindpunt van de rally
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                Dichtbij (&lt;15km)
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                Normaal (15-20km)
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                <span className="w-3 h-3 bg-orange-600 rounded-full"></span>
                Ver (&gt;20km)
              </span>
            </div>
          </div>

          

          {/* Bottom Tips */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
              <div className="flex items-start gap-3">
                <Icon name="lightbulb" className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">💡 Boekingstips</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Boek vroeg - augustus is hoogseizoen in Ardennen</li>
                    <li>• Vraag naar groepskortingen bij 5+ personen</li>
                    <li>• Vermeld "motorrijder" voor beveiligde parking</li>
                    <li>• Check annuleringsvoorwaarden (weer kan roet in eten gooien)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-6 border-l-4 border-primary-600">
              <div className="flex items-start gap-3">
                <Icon name="message-circle" className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📧 Deel je Ervaring</h4>
                  <p className="text-gray-700 text-sm mb-2">
                    Ken je een goed (motor)hotel in de buurt? Deel je tip met andere deelnemers!
                  </p>
                  <a 
                    href="mailto:info@deurdenbochtmotorrit.be?subject=Accommodatie tip" 
                    className="text-primary-600 hover:text-primary-700 underline text-sm font-medium"
                  >
                    info@deurdenbochtmotorrit.be
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!userId && edition?.registrationOpen && (
        <section className="relative py-20 bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Icon name="flag" className="w-16 h-16 mx-auto mb-6 text-white" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Klaar voor het avontuur?</h2>
            <p className="text-xl sm:text-2xl mb-8 text-primary-100">
              Schrijf je nu in en zeker je plaats voor Deur Den Bocht
            </p>
            <Link
              to="/registration"
              className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Icon name="user-plus" className="w-5 h-5" />
              Inschrijven
            </Link>
          </div>
        </section>
      )}

      <Footer siteConfig={siteConfig} edition={edition} />
    </div>
  );
}
