import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, useFetcher, Link } from 'react-router';
import { useState } from 'react';
import { requireUserId, getUser } from '~/lib/session.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Privacy & Gegevens - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  return { user };
}

export default function Privacy() {
  const { user } = useLoaderData<typeof loader>();
  const deleteFetcher = useFetcher();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    if (confirmText.toLowerCase() === 'verwijder mijn account') {
      deleteFetcher.submit(
        {},
        { method: 'POST', action: '/api/delete-account' }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="shield" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Privacy & Gegevens</h1>
          <p className="text-xl text-primary-100">Beheer je persoonlijke gegevens (GDPR)</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Data Retention Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-sm mb-8">
          <div className="flex items-start gap-3">
            <Icon name="info" className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Bewaarbeleid Gegevens</h3>
              <p className="text-blue-800 mb-2">
                We bewaren je persoonlijke gegevens voor <strong>1 jaar na het evenement</strong> conform onze GDPR-verplichtingen.
              </p>
              <p className="text-sm text-blue-700">
                Na deze periode worden alle gegevens automatisch verwijderd, tenzij wettelijk anders vereist 
                (bijv. betalingsgegevens bij Stripe voor fiscale doeleinden).
              </p>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-sm shadow mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-900">Jouw Rechten (GDPR)</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Recht op toegang (Art. 15)</h4>
                  <p className="text-sm text-gray-600">Je hebt het recht om een kopie van je persoonlijke gegevens op te vragen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Recht op rectificatie (Art. 16)</h4>
                  <p className="text-sm text-gray-600">Je kunt onjuiste of onvolledige gegevens laten corrigeren</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Recht op vergetelheid (Art. 17)</h4>
                  <p className="text-sm text-gray-600">Je hebt het recht om je gegevens te laten verwijderen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Recht op dataportabiliteit (Art. 20)</h4>
                  <p className="text-sm text-gray-600">Je kunt je gegevens in een gangbaar formaat opvragen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Recht van bezwaar (Art. 21)</h4>
                  <p className="text-sm text-gray-600">Je kunt bezwaar maken tegen bepaalde verwerkingen</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Data */}
        <div className="bg-white rounded-sm shadow mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-900">Download Mijn Gegevens</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Download een complete kopie van al je persoonlijke gegevens in JSON-formaat. 
              Dit bestand bevat je registratie, rally inzendingen, achievements, en meer.
            </p>
            <div className="bg-gray-50 p-4 rounded-sm mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Dit export bevat:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Persoonlijke gegevens (naam, email, telefoon)</li>
                <li>✓ Motorgegevens (merk, model, kenteken)</li>
                <li>✓ Rally inzendingen en scores</li>
                <li>✓ GPS-locaties en zone submissions</li>
                <li>✓ Achievements en badges</li>
                <li>✓ Ride stories en foto's</li>
                <li>✓ Beschikbare documenten</li>
              </ul>
            </div>
            <a
              href="/api/download-data"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-sm font-semibold transition-colors"
            >
              <Icon name="download" className="w-5 h-5" />
              Download Mijn Gegevens
            </a>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-sm shadow border-2 border-red-200">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h2 className="text-xl font-bold text-red-900">Verwijder Mijn Account</h2>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
              <div className="flex items-start gap-3">
                <Icon name="alert-triangle" className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Let op: Deze actie kan niet ongedaan gemaakt worden!</h4>
                  <p className="text-sm text-red-800 mb-2">
                    Als je je account verwijdert, worden <strong>alle</strong> gegevens permanent verwijderd:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>• Persoonlijke gegevens en contactinformatie</li>
                    <li>• Rally scores en inzendingen</li>
                    <li>• Achievements en badges</li>
                    <li>• GPS-locaties en zone data</li>
                    <li>• Foto's en ride stories</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>Betalingsgegevens:</strong> Transactiegegevens bij Stripe worden bewaard conform wettelijke verplichtingen (7 jaar voor fiscale doeleinden).
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-sm font-semibold transition-colors"
              >
                Verwijder Mijn Account
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typ "<strong>verwijder mijn account</strong>" om te bevestigen:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="verwijder mijn account"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={
                      confirmText.toLowerCase() !== 'verwijder mijn account' ||
                      deleteFetcher.state === 'submitting'
                    }
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-sm font-semibold transition-colors"
                  >
                    {deleteFetcher.state === 'submitting' ? 'Verwijderen...' : 'Definitief Verwijderen'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmText('');
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-sm font-semibold transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
                {deleteFetcher.data?.success && (
                  <div className="bg-green-50 border border-green-200 rounded-sm p-4">
                    <p className="text-green-800">
                      Je account is succesvol verwijderd. Je wordt automatisch uitgelogd...
                    </p>
                  </div>
                )}
                {deleteFetcher.data?.error && (
                  <div className="bg-red-50 border border-red-200 rounded-sm p-4">
                    <p className="text-red-800">
                      Fout bij verwijderen: {deleteFetcher.data.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 bg-white rounded-sm shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact voor Privacy Vragen</h3>
          <p className="text-gray-700 mb-4">
            Heb je vragen over je gegevens of privacy? Neem contact op:
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:vzwddb@gmail.com" className="text-primary-600 hover:underline">
                vzwddb@gmail.com
              </a>
            </p>
            <p>
              <strong>Klacht indienen:</strong>{' '}
              <a 
                href="https://www.gegevensbeschermingsautoriteit.be" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Gegevensbeschermingsautoriteit (GBA)
              </a>
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-sm font-semibold transition-colors"
          >
            <Icon name="arrow-left" className="w-5 h-5" />
            Terug naar Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
