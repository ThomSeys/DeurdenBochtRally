import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import PortableText from '~/components/PortableText';
import { getActiveEdition, getSiteConfig, getStats, getPricingTiers, getSponsors, getPageContent } from '~/lib/sanity.server';
import { urlFor } from '~/lib/sanity';
import { getUserId } from '~/lib/session.server';

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
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-32 md:py-48 overflow-hidden">
        {/* Background image if exists */}
        {siteConfig?.heroBackgroundImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={urlFor(siteConfig.heroBackgroundImage).width(1920).height(1080).url()}
              alt="Hero background"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* VZW Logo Badge */}
            <div className="inline-flex items-center justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-full p-6">
                <div className="text-6xl">🏍</div>
              </div>
            </div>

            {heroSection?.title ? (
              <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight whitespace-pre-line">
                {heroSection.title}
              </h1>
            ) : (
              <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight">
                DEN BOCHTENKONING<br />RALLY 2026
              </h1>
            )}
            
            <p className="text-3xl md:text-4xl mb-8 font-bold tracking-wider">
              DEUR DEN BOCHT
            </p>
            
            {edition && (
              <div className="inline-block bg-primary-600 px-8 py-3 rounded-lg mb-12">
                <p className="text-xl font-bold">
                  ZONDAG {new Date(edition.eventDate).toLocaleDateString('nl-BE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).split('/').reverse().join('-')}
                </p>
              </div>
            )}
            
            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {!userId && edition?.registrationOpen && (
                <Link
                  to="/registration"
                  className="bg-white hover:bg-gray-100 text-gray-900 px-10 py-4 rounded-lg text-lg font-bold uppercase transition-colors shadow-lg"
                >
                  Nu inschrijven
                </Link>
              )}
              <Link
                to="/about"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 text-white px-10 py-4 rounded-lg text-lg font-bold uppercase transition-colors"
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {ctaSection.title}
              </h2>
              {ctaSection.content && (
                <div className="text-xl md:text-2xl text-gray-700 mb-8">
                  <PortableText value={ctaSection.content} />
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                GADE MEE?
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 mb-8">
                TOT AAN CAFÉ DEN BELAMI, AALTER!
              </p>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {edition?.registrationOpen && (
              <Link
                to="/registration"
                className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-lg text-lg font-bold uppercase transition-colors shadow-lg"
              >
                Nu inschrijven
              </Link>
            )}
            <Link
              to="/about"
              className="bg-white border-2 border-gray-300 hover:border-primary-600 text-gray-900 px-10 py-4 rounded-lg text-lg font-bold uppercase transition-colors"
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
                <div key={stat._id} className="bg-white rounded-lg p-8 text-center shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-5xl mb-4">{stat.icon}</div>
                  <div className="text-4xl font-extrabold text-primary-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase">
                {whatIsSection.title}
              </h2>
            ) : (
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase">
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
                    Aan het einde van de dag kronen we: <strong className="text-primary-600">🏆 DEN BOCHTENKONING</strong>
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
                  <span className="text-8xl">🏍️</span>
                  <p className="text-gray-500 mt-4">Afbeelding komt hier</p>
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase">
                Kies je formule
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {pricing.map((tier: any) => (
                <div
                  key={tier._id}
                  className={`bg-white rounded-2xl p-10 ${
                    tier.highlighted 
                      ? 'border-4 border-yellow-400 shadow-2xl transform scale-105' 
                      : 'border border-gray-200 shadow-lg'
                  } transition-transform hover:scale-105`}
                >
                  {tier.icon && <div className="text-5xl mb-6 text-center">{tier.icon}</div>}
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center uppercase">
                    {tier.name}
                  </h3>
                  <div className="text-center mb-8">
                    <span className="text-5xl font-extrabold text-primary-600">€{tier.price}</span>
                  </div>
                  {tier.features && (
                    <ul className="space-y-4">
                      {tier.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-primary-600 font-bold text-xl mr-3">✓</span>
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
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-lg text-xl font-bold uppercase transition-colors shadow-lg"
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
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase">
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
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase">
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
            <div className="bg-gray-50 p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition-shadow">
              <div className="text-6xl mb-6">🗺️</div>
              <h3 className="text-2xl font-bold mb-4">8 Rally Zones</h3>
              <p className="text-gray-600 text-lg">
                Optionele lussen langs de route met unieke uitdagingen en verborgen parels
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition-shadow">
              <div className="text-6xl mb-6">📕</div>
              <h3 className="text-2xl font-bold mb-4">Het Bochtenboek</h3>
              <p className="text-gray-600 text-lg">
                Geschreven aanwijzingen in plaats van GPS-pijlen. Echt navigeren, echt avontuur.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl shadow-md text-center hover:shadow-xl transition-shadow">
              <div className="text-6xl mb-6">🏆</div>
              <h3 className="text-2xl font-bold mb-4">165 punten mogelijk</h3>
              <p className="text-gray-600 text-lg">
                Verzamel punten en word gekroond tot Den Bochtenkoning van 2026
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/rally"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-lg text-xl font-bold uppercase transition-colors shadow-lg"
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
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all grayscale hover:grayscale-0 flex items-center justify-center"
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

      <Footer />
    </div>
  );
}
