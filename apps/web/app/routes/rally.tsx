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

  return {  edition, rallyZones, siteConfig };
}

const colorClasses = {
  green: 'bg-green-50 border-green-500',
  yellow: 'bg-yellow-50 border-yellow-500',
  orange: 'bg-orange-50 border-orange-500',
  red: 'bg-red-50 border-red-500',
};

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
                  className={`border-l-4 rounded-sm shadow-lg overflow-hidden ${
                    colorClasses[zone.color as keyof typeof colorClasses] || colorClasses.green
                  }`}
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                          RZ{zone.zoneNumber} – {zone.title}
                        </h3>
                        <p className="text-gray-700 font-semibold">{zone.location}</p>
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
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Icon name="marker" className="w-5 h-5" /> CHECKPUNT
                        </h4>
                        <p className="text-gray-700">{zone.checkpoint}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Code: <em>{zone.codeHint}</em>
                        </p>
                      </div>
                      <div>
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
                  <td className="px-6 py-4">Elke Rally Zone</td>
                  <td className="px-6 py-4 text-right font-bold">15</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4">Minstens 4 zones <em className="text-sm text-gray-600">(voor kwalificatie)</em></td>
                  <td className="px-6 py-4 text-right font-bold">-</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Alle 8 zones <em className="text-sm text-primary-600">(bonus!)</em></td>
                  <td className="px-6 py-4 text-right font-bold text-primary-600">+20</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4">Meer dan 500 km</td>
                  <td className="px-6 py-4 text-right font-bold">+10</td>
                </tr>
                <tr className="bg-primary-50">
                  <td className="px-6 py-4 font-bold">Maximum totaal</td>
                  <td className="px-6 py-4 text-right font-bold text-2xl text-primary-600">150</td>
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
