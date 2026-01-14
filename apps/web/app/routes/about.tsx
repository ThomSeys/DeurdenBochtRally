import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import MapView from '~/components/MapView';
import { getActiveEdition, getScheduleItems, getBenefitItems, getFAQItems, getSiteConfig } from '~/lib/sanity.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Over het event - Deur Den Bocht' },
    { name: 'description', content: 'Alles wat je moet weten over het Deur Den Bocht rally event' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const edition = await getActiveEdition();
  const siteConfig = await getSiteConfig();
  const schedule = edition ? await getScheduleItems(edition._id) : [];
  const benefits = edition ? await getBenefitItems(edition._id) : [];
  const faq = edition ? await getFAQItems(edition._id) : [];

  return { edition, siteConfig, schedule, benefits, faq };
}

export default function About() {
  const { edition, siteConfig, schedule, benefits, faq } = useLoaderData<typeof loader>();

  const everyoneBenefits = benefits.filter((b: any) => b.category === 'everyone');
  const winnerBenefits = benefits.filter((b: any) => b.category === 'winner');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 break-words">Over het Event</h1>
          <p className="text-lg sm:text-xl break-words">Alles wat je moet weten over Deur Den Bocht</p>
        </div>
      </section>

      {/* Schedule */}
      {schedule && schedule.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 break-words">
              Programma
            </h2>
            <div className="space-y-6">
              {schedule.map((item: any, index: number) => (
                <div key={item._id} className={`bg-white rounded-sm shadow-lg p-6 border-l-4 border-${item.color || 'primary'}-600`}>
                  <div className="flex items-start">
                    {item.icon && <span className="text-4xl mr-4">{item.icon}</span>}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{item.title}</h3>
                        <span className="text-base sm:text-lg font-semibold text-primary-600 whitespace-nowrap">{item.time}</span>
                      </div>
                      <p className="text-gray-700 mb-4">{item.description}</p>
                      {item.details && item.details.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {item.details.map((detail: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-primary-600 mr-2">•</span>
                              <span className="text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {/* Show map for first schedule item (start location) */}
                      {index === 0 && siteConfig?.startLocation && (
                        <div className="mt-4">
                          <MapView
                            startPoint={siteConfig.startLocation}
                            endPoint={siteConfig.startLocation}
                            className="h-64 rounded-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What you receive */}
      {benefits && benefits.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4 break-words">
              Wat krijg je?
            </h2>
            
            {everyoneBenefits.length > 0 && (
              <>
                <h3 className="text-2xl font-semibold text-center text-gray-700 mb-8">
                  Iedere deelnemer krijgt
                </h3>
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {everyoneBenefits.map((benefit: any) => (
                    <div key={benefit._id} className="bg-white p-6 rounded-sm shadow text-center">
                      <div className="text-4xl mb-3">{benefit.icon}</div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h4>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {winnerBenefits.length > 0 && (
              <>
                <h3 className="text-2xl font-semibold text-center text-gray-700 mb-8">
                  De winnaar krijgt
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {winnerBenefits.map((benefit: any) => (
                    <div key={benefit._id} className="bg-primary-50 p-6 rounded-sm shadow-lg border-2 border-primary-600 text-center">
                      <div className="text-4xl mb-3">{benefit.icon}</div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h4>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 break-words">
              Veelgestelde Vragen
            </h2>
            <div className="space-y-4">
              {faq.map((item: any) => (
                <details key={item._id} className="bg-white rounded-sm shadow p-6">
                  <summary className="font-semibold text-base sm:text-lg text-gray-900 cursor-pointer flex items-start gap-2 break-words">
                    {item.icon && <span className="mr-2 flex-shrink-0 mt-1">{item.icon}</span>}
                    <span>{item.question}</span>
                  </summary>
                  <p className="mt-4 text-gray-700 pl-6">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {edition?.registrationOpen && (
        <section className="py-16 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 break-words">Klaar voor het avontuur?</h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 break-words">
              Schrijf je nu in en zeker je plaats voor Deur Den Bocht
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
