import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { useLoaderData, Link } from 'react-router';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import MapView from '~/components/MapView';
import { getActiveEdition, getRallyZones, getSiteConfig } from '~/lib/sanity.server';
import { urlFor } from '~/lib/sanity';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Zones - Deur Den Bocht' },
    { name: 'description', content: 'Ontdek alle 8 rally zones van Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const edition = await getActiveEdition();
  const rallyZones = edition ? await getRallyZones(edition._id) : [];
  const siteConfig = await getSiteConfig();

  return { edition, rallyZones, siteConfig };
}

export default function Rally() {
  const { edition, rallyZones, siteConfig } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">De Rally Zones</h1>
          <p className="text-xl max-w-3xl mx-auto">
            8 optionele rally-lussen waar je punten verzamelt voor Den Bochtenkoning
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
              <h3 className="font-bold text-lg mb-2">Je ziet een RZ-bordje</h3>
              <p className="text-gray-700">Tijdens de rit zie je borden langs de route met "RZ" erop</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">Verlaat de hoofdroute</h3>
              <p className="text-gray-700">Kies ervoor om de rally zone te doen of door te rijden</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">Volg het Bochtenboek</h3>
              <p className="text-gray-700">Geschreven aanwijzingen leiden je naar een checkpunt</p>
            </div>
            <div className="bg-white p-6 rounded-sm shadow">
              <h3 className="font-bold text-lg mb-2">Noteer de code</h3>
              <p className="text-gray-700">Op het checkpunt vind je een codewoord dat je noteert</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rally Zones */}
      {rallyZones && rallyZones.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
              De 8 Rally Zones
            </h2>
            <div className="space-y-8">
              {rallyZones.map((zone: any) => (
                <div
                  key={zone._id}
                  className={`border-l-4 rounded-sm shadow-lg overflow-hidden bg-gradient-to-r from-gray-100 to-primary-200 border-primary-600`}
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                            RZ{zone.zoneNumber} – {zone.title}
                          </h3>
                          {zone.zoneType && (
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              zone.zoneType === 'short' ? 'bg-green-100 text-green-800' :
                              zone.zoneType === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {zone.zoneType === 'short' ? 'Type A - Kort' : 
                               zone.zoneType === 'medium' ? 'Type B - Medium' : 
                               'Type C - Lang'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 font-semibold">{zone.location}</p>
                        {zone.estimatedDistance && (
                          <p className="text-sm text-gray-600 mt-1">
                            ~{zone.estimatedDistance} km
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="inline-block bg-white px-4 py-2 rounded-sm shadow">
                          <span className="text-sm text-gray-600">Punten</span>
                          <div className="text-2xl font-bold text-primary-600">{zone.points}</div>
                        </div>
                      </div>
                    </div>

                    {zone.description && (
                      <p className="text-gray-700 mb-6 text-lg">{zone.description}</p>
                    )}

                    {/* Map View */}
                    {zone.startLocation && (
                      <div className="rounded-sm overflow-hidden shadow-md border border-gray-300 mb-6">
                        <MapView
                          startPoint={zone.startLocation}
                          className="h-80 w-full"
                        />
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">🚪 EXIT</h4>
                        <p className="text-gray-700">{zone.exit}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">🔄 LUS</h4>
                        <p className="text-gray-700">{zone.lus}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Icon name="marker" className="w-5 h-5" /> 
                          {zone.checkpoints && zone.checkpoints.length > 1 ? 'CHECKPUNTEN' : 'CHECKPUNT'}
                          {zone.checkpoints && zone.checkpoints.length > 1 && (
                            <span className="text-sm font-normal text-gray-600">
                              ({zone.checkpoints.length} stops)
                            </span>
                          )}
                        </h4>
                        {zone.checkpoints && zone.checkpoints.length > 0 ? (
                          <div className="space-y-4">
                            {zone.checkpoints.map((checkpoint: any, idx: number) => (
                              <div key={idx} className="bg-primary-600 p-4 rounded-sm border border-gray-200">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-white text-primary-600 rounded-full flex items-center justify-center font-bold">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-white mb-1">{checkpoint.name}</p>
                                    <p className="text-white text-sm mb-2">{checkpoint.description}</p>
                                    <p className="text-sm text-gray-300">
                                      Code hint: <em>{checkpoint.codeHint}</em>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-700">{zone.checkpoint}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Code: <em>{zone.codeHint}</em>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-bold text-gray-900 mb-2">↩️ REJOIN</h4>
                        <p className="text-gray-700">{zone.rejoin}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Points System */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Puntensysteem
          </h2>
          <div className="bg-white rounded-sm shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Prestatie</th>
                  <th className="px-6 py-4 text-right">Punten</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      Type A - Kort (5-8 km, 1 checkpoint)
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">A</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">12</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      Type B - Medium (15-25 km, 2 checkpoints)
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">B</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">20</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      Type C - Lang (30-45 km, 3 checkpoints)
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">C</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">35</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4">Minstens 4 zones <em className="text-sm text-gray-600">(voor kwalificatie)</em></td>
                  <td className="px-6 py-4 text-right font-bold">+10</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Alle 8 zones <em className="text-sm text-primary-600">(bonus!)</em></td>
                  <td className="px-6 py-4 text-right font-bold text-primary-600">+30</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4">Meer dan 500 km</td>
                  <td className="px-6 py-4 text-right font-bold">+10</td>
                </tr>
                <tr className="bg-primary-50">
                  <td className="px-6 py-4 font-bold">Maximum totaal</td>
                  <td className="px-6 py-4 text-right font-bold text-2xl text-primary-600">206</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-gray-600 mt-6">
            <strong>Let op:</strong> Minimum 4 zones vereist om te kwalificeren als Bochtenkoning
          </p>
        </div>
      </section>

      {/* CTA */}
      {edition?.registrationOpen && (
        <section className="py-16 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Klaar voor de uitdaging?</h2>
            <p className="text-xl mb-8">
              Schrijf je in en verzamel punten om Den Bochtenkoning te worden
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
