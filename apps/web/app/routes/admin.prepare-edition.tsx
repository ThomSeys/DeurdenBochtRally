import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, useFetcher } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Nieuwe Editie Voorbereiden - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin prepare edition page loaded');

  // Get admin count
  const { data: admins } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email')
    .eq('is_admin', true);

  // Get current participant count
  const { count: participantCount } = await supabaseAdmin
    .from('participants')
    .select('id', { count: 'exact', head: true });

  return { 
    admins: admins || [],
    participantCount: participantCount || 0,
  };
}

export default function PrepareNewEdition() {
  const { admins, participantCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  const [year, setYear] = useState('');
  const [date, setDate] = useState('');
  const [regOpen, setRegOpen] = useState('');
  const [regClose, setRegClose] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmationCode !== 'PREPARE-NEW-EDITION') {
      alert('Verkeerde bevestigingscode!');
      return;
    }

    fetcher.submit(
      {
        year,
        date,
        regOpen,
        regClose,
        confirmationCode,
      },
      {
        method: 'POST',
        action: '/api/prepare-edition',
        encType: 'application/json',
      }
    );
  };

  const isSubmitting = fetcher.state === 'submitting';
  const result = fetcher.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="alert-triangle" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Nieuwe Editie Voorbereiden</h1>
          <p className="text-xl text-red-100">⚠️ Gevaarlijke Zone - Admin Only</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Warning Banner */}
        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-sm mb-8">
          <div className="flex items-start gap-3">
            <Icon name="alert-triangle" className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ LET OP: Deze actie is ONOMKEERBAAR!</h3>
              <p className="text-red-800 mb-3 font-semibold">
                Deze functie zal:
              </p>
              <ul className="text-sm text-red-800 space-y-2 ml-4">
                <li>✓ Een nieuwe editie aanmaken in Sanity</li>
                <li>✓ <strong>ALLE</strong> niet-admin deelnemers verwijderen ({participantCount - admins.length} deelnemers)</li>
                <li>✓ <strong>ALLE</strong> rally submissions, zone submissions, achievements verwijderen</li>
                <li>✓ <strong>ALLE</strong> check-ins en ride stories verwijderen</li>
                <li>✓ <strong>ALLE</strong> documenten verwijderen</li>
                <li>✓ Admin accounts behouden, maar hun rally data resetten</li>
              </ul>
              <p className="text-sm text-red-700 mt-4 font-bold">
                Maak een database backup voordat je dit uitvoert!
              </p>
            </div>
          </div>
        </div>

        {/* Admins to Preserve */}
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Admin Accounts (worden behouden)
          </h3>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3 text-sm">
                <Icon name="shield" className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{admin.first_name} {admin.last_name}</span>
                <span className="text-gray-600">({admin.email})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        {!result?.success && (
          <div className="bg-white rounded-sm shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nieuwe Editie Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jaar *
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2027"
                  required
                  min="2024"
                  max="2050"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evenement Datum *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registratie Start *
                  </label>
                  <input
                    type="date"
                    value={regOpen}
                    onChange={(e) => setRegOpen(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registratie Einde *
                  </label>
                  <input
                    type="date"
                    value={regClose}
                    onChange={(e) => setRegClose(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="bg-yellow-50 border border-yellow-300 rounded-sm p-4 mb-4">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">
                    Bevestiging vereist!
                  </p>
                  <p className="text-sm text-yellow-700">
                    Typ <code className="bg-yellow-100 px-2 py-1 rounded font-mono">PREPARE-NEW-EDITION</code> om te bevestigen
                  </p>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bevestigingscode *
                </label>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Typ PREPARE-NEW-EDITION"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || confirmationCode !== 'PREPARE-NEW-EDITION'}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-sm font-bold transition-colors"
                >
                  {isSubmitting ? 'Bezig met voorbereiden...' : '🚨 Nieuwe Editie Voorbereiden'}
                </button>
                <a
                  href="/admin"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-sm font-semibold transition-colors"
                >
                  Annuleren
                </a>
              </div>
            </form>
          </div>
        )}

        {/* Success Result */}
        {result?.success && (
          <div className="bg-green-50 border-2 border-green-500 rounded-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <Icon name="check-circle" className="w-12 h-12 text-green-600" />
              <h2 className="text-2xl font-bold text-green-900">Nieuwe Editie Succesvol Voorbereid!</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white p-4 rounded border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2">✅ Nieuwe Editie</h3>
                <p className="text-sm text-gray-700">
                  <strong>{result.results.edition.title}</strong> ({result.results.edition._id})
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Datum: {result.results.edition.date}
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2">🗑️ Verwijderde Data</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• {result.results.deletedParticipants} deelnemers</li>
                  <li>• {result.results.deletedSubmissions} rally submissions</li>
                  <li>• {result.results.deletedZoneSubmissions} zone submissions</li>
                  <li>• {result.results.deletedAchievements} achievements</li>
                  <li>• {result.results.deletedCheckIns} check-ins</li>
                  <li>• {result.results.deletedRideStories} ride stories</li>
                  <li>• {result.results.deletedDocuments} documenten</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">✓ Behouden Admin Accounts</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {result.results.preservedAdmins.map((admin: any) => (
                    <li key={admin.id}>• {admin.first_name} {admin.last_name} ({admin.email})</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📝 Volgende Stappen:</h3>
              <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Review rally zones in Sanity Studio</li>
                <li>Upload nieuwe GPX route</li>
                <li>Upload nieuwe documenten (Bochtenboek, kaarten)</li>
                <li>Test registratieflow</li>
                <li>Update homepage content indien nodig</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <a
                href="/admin"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-sm font-bold text-center transition-colors"
              >
                Terug naar Admin Dashboard
              </a>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-sm font-semibold transition-colors"
              >
                Nog een Editie
              </button>
            </div>
          </div>
        )}

        {/* Error Result */}
        {result?.error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="x-circle" className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-red-900">Fout bij Voorbereiden</h3>
            </div>
            <p className="text-red-800 mb-4">{result.error}</p>
            {result.details && (
              <pre className="bg-red-100 p-4 rounded text-xs overflow-auto">
                {result.details}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-sm font-semibold transition-colors"
            >
              Opnieuw Proberen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
