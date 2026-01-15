import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import PortableText from '~/components/PortableText';
import { getActiveEdition, getSiteConfig, getStats, getPricingTiers, getSponsors, getPageContent } from '~/lib/sanity.server';
import { urlFor } from '~/lib/sanity';
import { getUserId } from '~/lib/session.server';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.siteConfig?.seoTitle || 'Deur Den Bocht - Den Bochtenkoning Rally 2026' },
    { name: 'description', content: data?.siteConfig?.seoDescription || 'Een unieke 500+ km motordag door België, Noord-Frankrijk en de Ardennen.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  const edition = await getActiveEdition();
  const siteConfig = await getSiteConfig();
  const stats = edition ? await getStats(edition._id) : [];
  const pricing = edition ? await getPricingTiers(edition._id) : [];
  const sponsors = edition ? await getSponsors(edition._id) : [];
  const pageContent = edition ? await getPageContent('homepage', edition._id) : [];

  return {  userId, edition, siteConfig, stats, pricing, sponsors, pageContent };
}

export default function Index() {
  const { userId, edition, siteConfig, stats, pricing, sponsors, pageContent } = useLoaderData<typeof loader>();

  // Get specific sections from page content
  const heroSection = pageContent.find((section: any) => section.section === 'hero-quote');
  const ctaSection = pageContent.find((section: any) => section.section === 'final-cta');
  const whatIsSection = pageContent.find((section: any) => section.section === 'what-is-it');
  const rallyInfoSection = pageContent.find((section: any) => section.section === 'rally-intro');

  return (
    <div className="min-h-screen flex flex-col">
      <Header fixed transparent={true} />
      
      {/* Hero Section */}
      <section 
        className="relative text-white min-h-screen overflow-hidden bg-cover bg-center bg-fixed"
        style={siteConfig?.heroBackgroundImage ? {
          backgroundImage: `url('${urlFor(siteConfig.heroBackgroundImage).width(1920).height(1080).url()}')`,
          backgroundAttachment: 'fixed'
        } : { backgroundColor: '#000000' }}
      >
        {/* Background overlay - lighter to show image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-primary-900/50 to-black/70 z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 h-full flex items-center justify-center py-32 md:py-48">
          <div className="text-center">
            {/* VZW Logo Badge */}
            <div className="inline-flex items-center justify-center mb-8 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-8 sm:p-12 hover:bg-white/20 transition-all duration-300">
              <img src="/logo.svg" alt="Deur Den Bocht Logo" className="w-32 sm:w-40 md:w-48 h-auto" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>

            {heroSection?.title ? (
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tight whitespace-pre-line gradient-text break-words">
                {heroSection.title}
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tight gradient-text break-words">
                DEN BOCHTENKONING<br />RALLY 2026
              </h1>
            )}
            
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-8 font-black tracking-wider text-primary-100 break-words">
              DEUR DEN BOCHT
            </p>
            
            {edition && (
              <div className="inline-block bg-white/10 backdrop-blur-md border-2 border-white/30 px-4 sm:px-8 py-3 sm:py-4 rounded-sm mb-12 hover:bg-white/20 transition-all duration-300">
                <p className="text-lg sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wide break-words">
                  ZONDAG {new Date(edition.eventDate).toLocaleDateString('nl-BE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).split('/').reverse().join('-')}
                </p>
              </div>
            )}
            
            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              {!userId && edition?.registrationOpen && (
                <Link
                  to="/registration"
                  className="bg-white hover:bg-primary-50 text-primary-600 px-10 py-4 rounded-sm text-lg font-black uppercase transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  Nu inschrijven
                </Link>
              )}
              <Link
                to="/about"
                className="bg-white/15 backdrop-blur-md hover:bg-white/25 border-2 border-white/40 text-white px-10 py-4 rounded-sm text-lg font-black uppercase transition-all duration-300 hover:border-white/60"
              >
                Meer info over het event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {ctaSection?.title ? (
            <>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-4 gradient-text tracking-tight break-words">
                {ctaSection.title}
              </h2>
              {ctaSection.content && (
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 break-words">
                  <PortableText value={ctaSection.content} />
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-4 gradient-text tracking-tight break-words">
                GADE MEE?
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 break-words">
                TOT AAN CAFÉ DEN BELAMI, AALTER!
              </p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {edition?.registrationOpen && (
              <Link
                to="/registration"
                className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-sm text-lg font-bold uppercase transition-colors shadow-lg"
              >
                Nu inschrijven
              </Link>
            )}
            <Link
              to="/about"
              className="bg-white border-2 border-gray-300 hover:border-primary-600 text-gray-900 px-10 py-4 rounded-sm text-lg font-bold uppercase transition-colors"
            >
              Meer info
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && stats.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat: any) => (
                <div key={stat._id} className="bg-white rounded-sm border-l-2 border-primary-600 p-8 text-center shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-6xl sm:text-3xl md:text-4xl font-extrabold text-primary-600 mb-2 break-words">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider break-words">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What is it Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {whatIsSection?.title ? (
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-4 gradient-text tracking-tight uppercase break-words">
                {whatIsSection.title}
              </h2>
            ) : (
              <h2 className="text-6xl md:text-7xl font-black text-gray-900 mb-4 gradient-text tracking-tight uppercase">
                Wat is Deur Den Bocht?
              </h2>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {whatIsSection?.content ? (
                <PortableText value={whatIsSection.content} />
              ) : (
                <>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Deur den Bocht – The 500 is een <strong>all-day challenge ride</strong> waar je 500+ kilometer rijdt door België, Noord-Frankrijk en de Ardennen.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <span className="text-primary-600 font-bold text-xl mr-3">✓</span>
                      <span className="text-lg">Je rijdt <strong>500+ km</strong> via de mooiste bochten</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 font-bold text-xl mr-3">✓</span>
                      <span className="text-lg">Je <strong>vertrekt wanneer jij wil</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 font-bold text-xl mr-3">✓</span>
                      <span className="text-lg">Je <strong>stopt wanneer jij wil</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 font-bold text-xl mr-3">✓</span>
                      <span className="text-lg">Iedereen rijdt dezelfde prachtige <strong>bochten-GPX</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 font-bold text-xl mr-3">✓</span>
                      <span className="text-lg">Onderweg kan je <strong>optioneel deelnemen aan 8 Rally Zones</strong></span>
                    </li>
                  </ul>
                  <p className="text-xl text-gray-900 font-semibold mt-8">
                    Aan het einde van de dag kronen we: <strong className="text-primary-600 inline-flex items-center gap-1"><Icon name="trophy" className="w-5 h-5 inline" /> DEN BOCHTENKONING</strong>
                  </p>
                </>
              )}
            </div>
            <div className="bg-gray-100 rounded-2xl aspect-video flex items-center justify-center overflow-hidden shadow-lg">
              {siteConfig?.featureImage1 ? (
                <img
                  src={urlFor(siteConfig.featureImage1).width(800).height(600).url()}
                  alt={whatIsSection?.title || 'Deur Den Bocht'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <img src="/logo.svg" alt="Deur Den Bocht Logo" className="w-48 h-48 mx-auto mb-4" />
                  <p className="text-gray-500">Afbeelding komt hier</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {pricing && pricing.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-6xl md:text-7xl font-black text-gray-900 mb-4 gradient-text tracking-tight uppercase">
                Kies je formule
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {pricing.map((tier: any) => (
                <div
                  key={tier._id}
                  className={`bg-white rounded-sm p-10 ${
                    tier.highlighted 
                      ? 'bg-gradient-to-r from-primary-600 to-primary-400 shadow-2xl text-white' 
                      : 'border border-gray-200 shadow-lg'
                  } `}
                >
                  {tier.icon && <div className="text-5xl mb-6 text-center">{tier.icon}</div>}
                  <h3 className={"text-3xl font-bold mb-4 text-center uppercase " + (tier.highlighted ? "text-white" : "text-gray-900")}>
                    {tier.name}
                  </h3>
                  <div className="text-center mb-8">
                    <span className={"text-5xl font-extrabold " + (tier.highlighted ? "text-white" : "text-primary-600")}>€{tier.price}</span>
                  </div>
                  <hr className="mb-8" />
                  {tier.features && (
                    <ul className="space-y-4">
                      {tier.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className={"text-primary-600 font-bold text-xl mr-3 " + (tier.highlighted ? "text-white" : "")}>✓</span>
                          <span className="text-lg">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {edition?.registrationOpen && (
              <div className="text-center mt-12">
                <Link
                  to="/registration"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-sm text-xl font-bold uppercase transition-colors shadow-lg"
                >
                  Nu inschrijven
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Rally Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            {rallyInfoSection?.title ? (
              <>
                <h2 className="text-4xl md:text-7xl font-black text-gray-900 mb-4 gradient-text tracking-tight uppercase">
                  {rallyInfoSection.title}
                </h2>
                {rallyInfoSection.content && (
                  <div className="text-xl text-gray-700 max-w-3xl mx-auto">
                    <PortableText value={rallyInfoSection.content} />
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl md:text-7xl font-black text-gray-900 mb-4 gradient-text tracking-tight uppercase">
                  Het Bochtenboek & De Rally
                </h2>
                <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                  Onderweg kan je deelnemen aan <strong>8 Rally Zones</strong> – optionele rally-lussen
                  waar je punten verzamelt voor <strong>Den Bochtenkoning</strong>
                </p>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="fancy-card bg-white p-8 rounded-sm shadow-md border-l-2 border-primary-600 text-center hover:bg-gradient-to-b hover:from-white hover:to-primary-50 transition-all duration-300">
              <Icon name="map" className="w-20 h-20 mb-6 mx-auto text-primary-600" />
              <h3 className="text-2xl font-black mb-4">8 Rally Zones</h3>
              <p className="text-gray-600 text-lg">
                Optionele lussen langs de route met unieke uitdagingen en verborgen parels
              </p>
            </div>
            <div className="fancy-card bg-white p-8 rounded-sm shadow-md border-l-2 border-primary-600 text-center hover:bg-gradient-to-b hover:from-white hover:to-primary-50 transition-all duration-300">
              <Icon name="book" className="w-20 h-20 mb-6 mx-auto text-primary-600" />
              <h3 className="text-2xl font-black mb-4">Het Bochtenboek</h3>
              <p className="text-gray-600 text-lg">
                Geschreven aanwijzingen in plaats van GPS-pijlen. Echt navigeren, echt avontuur.
              </p>
            </div>
            <div className="fancy-card bg-white p-8 rounded-sm shadow-md border-l-2 border-primary-600 text-center hover:bg-gradient-to-b hover:from-white hover:to-primary-50 transition-all duration-300">
              <Icon name="trophy" className="w-20 h-20 mb-6 mx-auto text-yellow-500" />
              <h3 className="text-2xl font-black mb-4">165 punten mogelijk</h3>
              <p className="text-gray-600 text-lg">
                Verzamel punten en word gekroond tot Den Bochtenkoning van 2026
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/rally"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-sm text-xl font-bold uppercase transition-colors shadow-lg"
            >
              Ontdek alle Rally Zones
            </Link>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      {sponsors && sponsors.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-12 uppercase">
              Onze sponsors
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {sponsors.map((sponsor: any) => (
                <a
                  key={sponsor._id}
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-6 rounded-sm shadow-md border-l-2 border-primary-600 hover:shadow-lg transition-all grayscale hover:grayscale-0 flex items-center justify-center"
                >
                  {sponsor.logo ? (
                    <img
                      src={urlFor(sponsor.logo).width(200).url()}
                      alt={sponsor.name}
                      className="max-h-16 w-auto"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm text-center">
                      <div className="text-4xl mb-2">🏢</div>
                      <div>{sponsor.name}</div>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer siteConfig={siteConfig} edition={edition} />
    </div>
  );
}
