import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import MapView from '~/components/MapView';
import { Icon } from '~/components/Icon';
import { getActiveEdition, getScheduleItems, getBenefitItems, getFAQItems, getSiteConfig, sanityClient } from '~/lib/sanity.server';
import { getUserId } from '~/lib/session.server';
import PortableText from '~/components/PortableText';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Over het event - Deur Den Bocht' },
    { name: 'description', content: 'Alles wat je moet weten over het Deur Den Bocht rally event' },
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

// List of available icon names in the Icon component
const availableIcons = [
  'bell', 'check', 'checkSimple', 'x', 'lightning', 'megaphone', 'target', 'chart', 'flag', 'trophy',
  'cloud', 'lightbulb', 'filter', 'refresh', 'clock', 'map', 'marker', 'warning', 'alert-triangle',
  'alert-circle', 'lock', 'users', 'document', 'search', 'settings', 'phone', 'calendar', 'utensils',
  'motorcycle', 'coffee', 'info', 'eye', 'wave', 'crown', 'camera', 'book', 'clipboard', 'mail',
  'award', 'rocket', 'cookie', 'database', 'ban', 'building', 'door', 'star', 'heart', 'diamond',
  'hourglass', 'trash', 'home', 'shield', 'money', 'chevron-left', 'chevron-right', 'book-open',
  'plus', 'send', 'loader', 'message-circle', 'check-circle', 'info-circle', 'arrow-left', 'cog',
  'mountain', 'road', 'tree', 'party', 'user', 'arrow-back', 'alert', 'gift'
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

      {/* Hero with gradient and pattern */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-20 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 break-words">
            Over het Event
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-primary-100">
            Een unieke rally-ervaring door de mooiste wegen van België
          </p>
          {edition && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <Icon name="calendar" className="w-5 h-5" />
              <span className="font-semibold">{new Date(edition.eventDate).toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </section>

      {/* Event Stories */}
      {stories && stories.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
            {stories.map((story: any, index: number) => (
              <div key={story._id} className="relative">
                {/* Decorative elements */}
                {index % 2 === 0 && (
                  <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary-100 rounded-full blur-3xl opacity-30"></div>
                )}
                {index % 2 === 1 && (
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent-100 rounded-full blur-3xl opacity-30"></div>
                )}
                {/* Full-width hero image banner */}
                {story.imageUrl && (
                  <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] mb-12 -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden group">
                    {/* Image with parallax effect */}
                    <div className="absolute inset-0">
                      <img
                        src={story.imageUrl}
                        alt={story.title}
                        className="w-full h-full object-cover transform blur-sm group-hover:blur-none transition-all duration-1000"
                      />
                    </div>
                    
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 to-transparent"></div>
                    
                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
                      <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-2xl">
                          {story.title}
                        </h2>
                        {story.subtitle && (
                          <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 font-medium italic drop-shadow-lg max-w-3xl">
                            {story.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Decorative corner elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-bl-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-600/10 rounded-tr-full blur-2xl"></div>
                  </div>
                )}

                {/* Content section */}
                <div className="max-w-4xl mx-auto px-6">
                  {!story.imageUrl && (
                    <>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                        {story.title}
                      </h2>
                      {story.subtitle && (
                        <p className="text-xl sm:text-2xl text-primary-600 mb-6 font-medium italic">{story.subtitle}</p>
                      )}
                    </>
                  )}
                  
                  <div className="mb-12">
                    <PortableText value={story.content} />
                  </div>
                  
                  {story.highlights && story.highlights.length > 0 && (
                    <div className={`grid grid-cols-2 gap-4 md:grid-cols-${Math.min(story.highlights.length, 4)}`}>
                      {story.highlights.map((highlight: any, idx: number) => {
                        // Rich gradient variations
                        const variants = [
                          {
                            base: "bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600",
                            hover: "hover:from-primary-500 hover:via-primary-600 hover:to-primary-700"
                          },
                          {
                            base: "bg-gradient-to-bl from-primary-500 via-primary-600 to-primary-500",
                            hover: "hover:from-primary-600 hover:via-primary-700 hover:to-primary-600"
                          },
                          {
                            base: "bg-gradient-to-tr from-primary-400 via-primary-600 to-primary-500",
                            hover: "hover:from-primary-500 hover:via-primary-700 hover:to-primary-600"
                          },
                          {
                            base: "bg-gradient-to-tl from-primary-500 via-primary-400 to-primary-600",
                            hover: "hover:from-primary-600 hover:via-primary-500 hover:to-primary-700"
                          }
                        ];
                        const variant = variants[idx % variants.length];
                        
                        return (
                          <div 
                            key={idx} 
                            className={`group relative overflow-hidden cursor-pointer ${variant.base} ${variant.hover} p-6 rounded-xl transition-all duration-500 hover:shadow-2xl text-center`}
                          >
                            {/* Animated gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Subtle glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-300/0 via-primary-200/20 to-primary-300/0 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Content */}
                            <div className="relative z-10">
                              <div className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
                                {highlight.number}
                              </div>
                              <div className="text-xs sm:text-sm text-white/90 font-medium uppercase tracking-wide">
                                {highlight.label}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schedule */}
      {schedule && schedule.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Programma
              </h2>
              <p className="text-lg text-gray-600">Plan je dag met ons gedetailleerde schema</p>
            </div>
            
            {/* Mobile & Desktop: Vertical timeline */}
            <div className="relative px-10 border-l-4 border-accent-500">
              
              <div className="space-y-8">
                {schedule.map((item: any, index: number) => (
                  <div key={item._id} className="relative">
                    {/* Time badge - positioned on the orb */}
                    <div className="mb-2">
                      <span className="inline-block px-3 py-1 bg-primary-100 text-gray-700 text-sm font-bold rounded">
                        {item.time}
                      </span>
                    </div>
                    <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg shadow-md lg:shadow-lg p-4 lg:p-6 border-l-4 border-primary-600 hover:shadow-xl transition-shadow">
                      <h3 className="text-lg lg:text-2xl font-bold text-white mb-2 lg:mb-3">{item.title}</h3>
                      <p className="text-white text-sm lg:text-lg mb-2 lg:mb-4">{item.description}</p>
                      {item.details && item.details.length > 0 && (
                        <ul className="space-y-1 lg:space-y-0 text-sm lg:text-base lg:grid lg:grid-cols-2 lg:gap-3 border-t border-primary-400 pt-2 lg:pt-4">
                          {item.details.map((detail: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <Icon name="check-circle" className="w-4 h-4 lg:w-5 lg:h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-white">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {index === 0 && siteConfig?.startLocation && (
                        <div className="mt-3 lg:mt-4">
                          <MapView
                            startPoint={siteConfig.startLocation}
                            endPoint={siteConfig.startLocation}
                            className="h-48 lg:h-72 rounded lg:rounded-lg"
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
        <section className="py-20 bg-gray-50">
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
