import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';
import { 
  getSponsors, 
  getSiteConfig, 
  getStats, 
  getPricingTiers, 
  getRallyZones,
  getPageContent
} from '~/lib/sanity.server';
import { PortableText } from '@portabletext/react';
import { sponsors as fallbackSponsors } from '~/content/sponsors';
import { siteConfig as fallbackConfig } from '~/content/config';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const config = data?.siteConfig;
  
  const title = config?.seoTitle || config?.eventName || 'Deur Den Bocht - Den Bochtenkoning Rally 2026';
  const description = config?.seoDescription || 
    'Den Bochtenkoning Rally 2026! Een unieke 500+ km motordag door België, Noord-Frankrijk en de Ardennen. ZONDAG 16 MEI 2026.';
  const image = config?.seoImageUrl || 'https://deurdenbocht.be/og-image.jpg';
  const url = 'https://deurdenbocht.be';
  
  const metaTags = [
    { title },
    { name: 'description', content: description },
    
    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Deur Den Bocht' },
    
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];
  
  // Add noindex/nofollow if enabled
  if (config?.noIndex || config?.noFollow) {
    const robotsDirectives = [];
    if (config?.noIndex) robotsDirectives.push('noindex');
    if (config?.noFollow) robotsDirectives.push('nofollow');
    metaTags.push({ name: 'robots', content: robotsDirectives.join(', ') });
  }
  
  return metaTags;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  // Fetch from Sanity, fallback to static content if unavailable
  const [sponsors, siteConfig, stats, pricingTiers, rallyZones, pageContent] = await Promise.all([
    getSponsors().catch(() => fallbackSponsors),
    getSiteConfig().catch(() => null),
    getStats().catch(() => []),
    getPricingTiers().catch(() => []),
    getRallyZones().catch(() => []),
    getPageContent('homepage').catch(() => []),
  ]);
  
  return json({ 
    user, 
    sponsors, 
    siteConfig, 
    stats, 
    pricingTiers, 
    rallyZones,
    pageContent
  });
}

export default function Index() {
  const { user, sponsors, siteConfig, stats, pricingTiers, rallyZones, pageContent } = useLoaderData<typeof loader>();
  
  // Extract content sections
  const filteredContent = pageContent.filter((c) => c !== null);
  const whatIsItContent = filteredContent.find((content) => content.section === 'what-is-it');
  const rallyIntroContent = filteredContent.find((content) => content.section === 'rally-intro');
  const heroQuoteContent = filteredContent.find((content) => content.section === 'hero-quote');
  const rallyZonesCard = filteredContent.find((content) => content.section === 'rally-zones-card');
  const pointsCard = filteredContent.find((content) => content.section === 'points-card');
  const finalCTAContent = filteredContent.find((content) => content.section === 'final-cta');
  const sponsorsIntro = filteredContent.find((content) => content.section === 'sponsors-intro');
  const sponsorsCTA = filteredContent.find((content) => content.section === 'sponsors-cta');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header user={user} />

      <main className="flex-1">
        {/* MASSIVE Hero Section */}
        <section className="relative bg-primary-600 text-white overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img 
              src={siteConfig?.heroBackgroundImageUrl || "https://picsum.photos/1920/1080?random=1"} 
              alt="Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary-600/50"></div>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 hero-pattern"></div>

          <div className="container-custom relative z-10 py-16 md:py-24 lg:py-32">
            <div className="max-w-5xl mx-auto text-center">
              {/* Logo Badge */}
              <div className="inline-block mb-8">
                <div className="bg-white rounded-full w-36 h-36 p-6 md:p-8 shadow-2xl transform hover:scale-110 transition-transform">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-primary-600 hero-text font-black text-3xl md:text-4xl lg:text-5xl leading-none tracking-tighter">
                        VZW<br/>DdB
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Title */}
              <h1 className="hero-text text-white mb-6 tracking-tighter">
                {siteConfig?.eventName || "Den Bochtenkoning Rally 2026"}
              </h1>

              {/* Subtitle */}
              <p className="text-2xl md:text-3xl lg:text-4xl font-black uppercase text-primary-100 mb-8 tracking-wide">
                Deur den Bocht
              </p>

              {/* Date & Location */}
              <div className="bg-white text-primary-600 inline-block px-8 md:px-12 py-6 md:py-8 mb-12 shadow-2xl">
                <p className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight">
                  ZONDAG<br/>
                  <span className="text-5xl md:text-6xl lg:text-7xl">{siteConfig?.eventDate || "16/05/2026"}</span>
                </p>
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <p className="text-xl md:text-2xl lg:text-3xl font-black uppercase mb-6">
                  Gade mee?<br/>
                  <span className="text-primary-200">Tot aan {siteConfig?.eventLocation || "café Belami, Aalter"}!</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to="/registration" className="btn-primary text-lg md:text-xl w-full sm:w-auto">
                    📝 NU INSCHRIJVEN
                  </Link>
                  <Link to="/about" className="btn-secondary text-lg md:text-xl w-full sm:w-auto">
                    📖 MEER INFO
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Wave Bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 md:h-20">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="#ffffff"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="#ffffff"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#ffffff"></path>
            </svg>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container-custom">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {stats.filter((stat) => stat !== null).map((stat) => (
                <div key={stat._id} className="text-center p-6 bg-white shadow-lg border-t-8 border-primary-600">
                  <div className="text-4xl md:text-5xl font-black text-primary-600 mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base font-bold uppercase text-gray-700">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What is it? */}
        <section className="section bg-white">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="section-title text-primary-600">
                  {whatIsItContent?.title || "WAT IS DEUR DEN BOCHT?"}
                </h2>
                {whatIsItContent ? (
                  <div className="prose prose-lg max-w-none">
                    <PortableText value={whatIsItContent.content} />
                  </div>
                ) : (
                  <div className="space-y-6 text-lg">
                    <p className="text-gray-700">Content wordt binnenkort toegevoegd...</p>
                  </div>
                )}
                <Link to="/about" className="btn-primary mt-8 inline-block">
                  📖 VOLLEDIGE INFO
                </Link>
              </div>

              <div className="relative">
                <div className="relative overflow-hidden shadow-2xl">
                  <img 
                    src={siteConfig?.featureImage1Url || "https://picsum.photos/800/600?random=2"} 
                    alt="Motorrijden" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-600 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                    <div className="text-6xl md:text-7xl mb-6">🏍️</div>
                    <h3 className="text-3xl md:text-4xl font-black uppercase mb-6">
                      {heroQuoteContent?.title || '"Altijd via de omweg."'}
                    </h3>
                    {heroQuoteContent ? (
                      <div className="prose prose-lg prose-invert max-w-none">
                        <PortableText value={heroQuoteContent.content} />
                      </div>
                    ) : (
                      <div className="space-y-4 text-lg font-bold">
                        <p>✓ Geen snelweg</p>
                        <p>✓ Geen GPS-pijltjes</p>
                        <p>✓ Geen stress</p>
                        <p className="text-2xl">= Pure rijvreugde</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="section bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="container-custom">
            <h2 className="section-title text-center text-white mb-12 md:mb-16">
              KIES JE FORMULE
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {pricingTiers.filter((tier) => tier !== null).map((tier) => (
                <div 
                  key={tier._id} 
                  className={`bg-white text-gray-900 p-8 md:p-10 shadow-2xl transform hover:scale-105 transition-transform ${
                    tier.highlighted ? 'ring-4 ring-yellow-400' : ''
                  }`}
                >
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4">{tier.icon || '🏍️'}</div>
                    <h3 className="text-3xl md:text-4xl font-black uppercase mb-2">
                      {tier.name}
                    </h3>
                    <div className="text-5xl md:text-6xl font-black text-primary-600 my-6">
                      €{tier.price}
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {tier.features?.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-2xl mr-3">✓</span>
                        <span className="font-bold text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/registration" className="btn-primary w-full text-center">
                    INSCHRIJVEN
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center mt-12 text-xl font-bold text-primary-100">
              💳 Betaling via Bancontact of creditcard
            </p>
          </div>
        </section>

        {/* Rally Info */}
        <section className="section bg-white">
          <div className="container-custom">
            <h2 className="section-title text-primary-600 text-center mb-12">
              HET BOCHTENBOEK<br/>& DE RALLY
            </h2>

            <div className="max-w-4xl mx-auto">
              {rallyIntroContent ? (
                <div className="bg-primary-50 border-l-8 border-primary-600 p-8 md:p-12 mb-8">
                  <h3 className="text-3xl md:text-4xl font-black uppercase mb-6 text-primary-600">
                    {rallyIntroContent.title}
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <PortableText value={rallyIntroContent.content} />
                  </div>
                </div>
              ) : (
                <div className="bg-primary-50 border-l-8 border-primary-600 p-8 md:p-12 mb-8">
                  <p className="text-gray-600">Content wordt binnenkort toegevoegd...</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="card bg-white relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                    <img 
                      src={siteConfig?.featureImage2Url || "https://picsum.photos/600/400?random=3"} 
                      alt="Rally Zones" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">🗺️</div>
                    <h4 className="text-2xl font-black uppercase mb-3 text-primary-600">
                      {rallyZonesCard?.title || '8 Rally Zones'}
                    </h4>
                    {rallyZonesCard ? (
                      <div className="prose max-w-none">
                        <PortableText value={rallyZonesCard.content} />
                      </div>
                    ) : (
                      <p className="text-gray-700 font-bold">
                        Optionele lusjes van de hoofdroute. Volg de beschrijving, 
                        vind het checkpunt, noteer de code.
                      </p>
                    )}
                  </div>
                </div>

                <div className="card bg-white relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                    <img 
                      src={siteConfig?.featureImage3Url || "https://picsum.photos/600/400?random=4"} 
                      alt="Punten verdienen" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">🏆</div>
                    <h4 className="text-2xl font-black uppercase mb-3 text-primary-600">
                      {pointsCard?.title || 'Punten verdienen'}
                    </h4>
                    {pointsCard ? (
                      <div className="prose max-w-none">
                        <PortableText value={pointsCard.content} />
                      </div>
                    ) : (
                      <p className="text-gray-700 font-bold">
                        Elke zone = 15 punten. Alle 8 = +20 bonus. 
                        Wie het best scoort wordt "Den Bochtenkoning"!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link to="/rally" className="btn-primary text-lg">
                  📖 BEKIJK ALLE RALLY ZONES
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsors Section */}
        <section className="section bg-gray-50">
          <div className="container-custom">
            <h2 className="section-title text-primary-600 text-center mb-12">
              {sponsorsIntro?.title || 'ONZE SPONSORS'}
            </h2>
            
            {sponsorsIntro ? (
              <div className="text-center mb-12 prose prose-xl mx-auto">
                <PortableText value={sponsorsIntro.content} />
              </div>
            ) : (
              <p className="text-center text-xl font-bold text-gray-600 mb-12 max-w-2xl mx-auto">
                Dit evenement wordt mede mogelijk gemaakt door:
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center">
              {sponsors.map((sponsor) => (
                <a
                  key={sponsor._id}
                  href={sponsor.website || '#'}
                  target={sponsor.website ? '_blank' : undefined}
                  rel={sponsor.website ? 'noopener noreferrer' : undefined}
                  className="bg-white p-6 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center h-32"
                >
                  {sponsor.logoUrl ? (
                    <img 
                      src={sponsor.logoUrl}
                      alt={sponsor.name} 
                      className="max-w-full max-h-full object-contain grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="font-bold text-primary-600">{sponsor.name}</span>
                  )}
                </a>
              ))}
            </div>

            <div className="text-center mt-12">
              {sponsorsCTA ? (
                <>
                  <div className="prose prose-lg mx-auto mb-4">
                    <h3 className="font-bold">{sponsorsCTA.title}</h3>
                    <PortableText value={sponsorsCTA.content} />
                  </div>
                  <a 
                    href="mailto:info@deurdenbocht.be?subject=Sponsoring" 
                    className="btn-primary inline-block"
                  >
                    📧 CONTACTEER ONS
                  </a>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-700 mb-4">
                    Interesse om sponsor te worden?
                  </p>
                  <a 
                    href="mailto:info@deurdenbocht.be?subject=Sponsoring" 
                    className="btn-primary inline-block"
                  >
                    📧 CONTACTEER ONS
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="section bg-primary-600 text-white text-center">
          <div className="container-custom">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-6">
              {finalCTAContent?.title || 'KLAAR VOOR HET AVONTUUR?'}
            </h2>
            {finalCTAContent ? (
              <div className="prose prose-xl prose-invert mx-auto mb-8">
                <PortableText value={finalCTAContent.content} />
              </div>
            ) : (
              <p className="text-xl md:text-2xl font-bold mb-8 text-primary-100 max-w-2xl mx-auto">
                Schrijf je nu in en zorg dat je erbij bent op {siteConfig?.eventDate || "16 mei 2026"}!
              </p>
            )}
            <Link to="/registration" className="btn-primary bg-white text-primary-600 hover:bg-primary-50 text-xl md:text-2xl inline-block">
              📝 NU INSCHRIJVEN
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
