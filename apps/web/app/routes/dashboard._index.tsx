import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { QRCodeSVG } from 'qrcode.react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { requireUserId } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Dashboard - Deur Den Bocht' },
    { name: 'description', content: 'Je persoonlijke Deur Den Bocht dashboard' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: rallySubmission } = await supabase
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', userId)
    .single();

  // Check if documents are available (2 days before event OR early access granted)
  const eventDate = new Date(process.env.EVENT_DATE || '2026-05-16');
  const twoDaysBeforeEvent = new Date(eventDate);
  twoDaysBeforeEvent.setDate(twoDaysBeforeEvent.getDate() - 2);
  const now = new Date();
  const hasEarlyAccess = participant?.allow_early_access || false;
  const areDocumentsAvailable = hasEarlyAccess || now >= twoDaysBeforeEvent;

  return json({ 
    participant, 
    documents: documents || [], 
    rallySubmission,
    areDocumentsAvailable,
    availableDate: twoDaysBeforeEvent.toISOString()
  });
}

export default function Dashboard() {
  const { participant, documents, rallySubmission, areDocumentsAvailable, availableDate } = useLoaderData<typeof loader>();

  if (!participant) {
    return null;
  }

  const gpxFiles = documents.filter(doc => doc.file_type === 'gpx');
  const rallyBooks = documents.filter(doc => doc.category === 'rally_book');
  const maps = documents.filter(doc => doc.category === 'map');
  const instructions = documents.filter(doc => doc.category === 'instruction');

  const formattedDate = new Date(availableDate).toLocaleDateString('nl-BE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={participant} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary-600 text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-display font-bold mb-2">
              Welkom terug, {participant.first_name}! 🏍
            </h1>
            <p className="text-xl text-primary-100">
              Alles wat je nodig hebt voor Den Bochtenkoning Rally!
            </p>
          </div>
        </section>

        {/* Quick Info Cards */}
        <section className="section">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card bg-green-50 border-l-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Inschrijving</p>
                    <p className="text-2xl font-bold text-green-600">✅ Bevestigd</p>
                  </div>
                  <span className="text-4xl">✓</span>
                </div>
              </div>

              <div className="card bg-blue-50 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Je formule</p>
                    <p className="text-lg font-bold">
                      {participant.formula === 'with_meals' ? '🍽 Met maaltijden' : '☕ Enkel ontbijt'}
                    </p>
                  </div>
                  <span className="text-4xl">{participant.formula === 'with_meals' ? '🍽' : '☕'}</span>
                </div>
              </div>

              <div className="card bg-purple-50 border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Type rit</p>
                    <p className="text-lg font-bold">
                      {participant.ride_type === 'free' ? '🔵 Vrije rit' : '🟢 Begeleide rit'}
                    </p>
                  </div>
                  <span className="text-4xl">{participant.ride_type === 'free' ? '🔵' : '🟢'}</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="card bg-yellow-50 border-2 border-yellow-600 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-bold mb-2">📱 Je QR Code voor Check-in</h3>
                  <p className="text-gray-700 mb-2">
                    Toon deze code bij aankomst aan de start in Café Den Belami
                  </p>
                  <p className="font-mono bg-white px-4 py-2 rounded border-2 border-gray-300 inline-block">
                    {participant.qr_code}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                  <QRCodeSVG 
                    value={`DEUR DEN BOCHT 2026\nDeelnemer: ${participant.first_name} ${participant.last_name}\nEmail: ${participant.email}\nID: ${participant.qr_code}\nStatus: ${participant.paid ? 'Betaald' : 'Nog te betalen'}`}
                    size={128}
                    level="H"
                    includeMargin
                  />
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* GPX Routes */}
              <div className="card">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center">
                  <span className="text-3xl mr-2">🗺</span>
                  GPX Routes
                </h3>
                {!areDocumentsAvailable ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
                    <p className="font-semibold mb-2">🔒 Beschikbaar vanaf {formattedDate}</p>
                    <p className="text-sm text-gray-700">
                      De GPX bestanden worden 2 dagen voor het event vrijgegeven.
                    </p>
                  </div>
                ) : gpxFiles.length > 0 ? (
                  <div className="space-y-3">
                    {gpxFiles.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-200"
                      >
                        <p className="font-semibold">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-primary-600 mt-1">↓ Download GPX</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">GPX bestanden komen binnenkort beschikbaar</p>
                )}
              </div>

              {/* Rally Book */}
              <div className="card">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center">
                  <span className="text-3xl mr-2">📕</span>
                  Bochtenboek
                </h3>
                {!areDocumentsAvailable ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
                    <p className="font-semibold mb-2">🔒 Beschikbaar vanaf {formattedDate}</p>
                    <p className="text-sm text-gray-700">
                      Het digitale Bochtenboek wordt 2 dagen voor het event vrijgegeven. 
                      Je ontvangt ook een fysieke versie bij de start.
                    </p>
                  </div>
                ) : rallyBooks.length > 0 ? (
                  <div className="space-y-3">
                    {rallyBooks.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-200"
                      >
                        <p className="font-semibold">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-primary-600 mt-1">→ Open</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Je ontvangt het fysieke Bochtenboek bij de start. 
                    Een digitale versie komt hier ook beschikbaar.
                  </p>
                )}
              </div>

              {/* Maps */}
              <div className="card">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center">
                  <span className="text-3xl mr-2">🗾</span>
                  Kaarten
                </h3>
                {maps.length > 0 ? (
                  <div className="space-y-3">
                    {maps.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-200"
                      >
                        <p className="font-semibold">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-primary-600 mt-1">→ Bekijk</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Kaarten komen binnenkort beschikbaar</p>
                )}
              </div>

              {/* Instructions */}
              <div className="card">
                <h3 className="text-2xl font-display font-bold mb-4 flex items-center">
                  <span className="text-3xl mr-2">📋</span>
                  Instructies & Info
                </h3>
                {instructions.length > 0 ? (
                  <div className="space-y-3">
                    {instructions.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-200"
                      >
                        <p className="font-semibold">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                        <p className="text-xs text-primary-600 mt-1">→ Lees meer</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Belangrijke informatie en instructies worden hier geplaatst
                  </p>
                )}
              </div>
            </div>

            {/* Rally Submission */}
            <div className="card">
              <h3 className="text-2xl font-display font-bold mb-4 flex items-center">
                <span className="text-3xl mr-2">🏆</span>
                Je Rally Deelname
              </h3>
              {rallySubmission ? (
                <div>
                  <p className="text-green-600 font-semibold mb-4">✅ Rally ingediend!</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Totaal punten</p>
                      <p className="text-2xl font-bold text-primary-600">{rallySubmission.total_points}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Zones voltooid</p>
                      <p className="text-2xl font-bold">
                        {[
                          rallySubmission.rz1_code,
                          rallySubmission.rz2_code,
                          rallySubmission.rz3_code,
                          rallySubmission.rz4_code,
                          rallySubmission.rz5_code,
                          rallySubmission.rz6_code,
                          rallySubmission.rz7_code,
                          rallySubmission.rz8_code,
                        ].filter(Boolean).length}
                        /8
                      </p>
                    </div>
                    {rallySubmission.total_distance && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Totaal km</p>
                        <p className="text-2xl font-bold">{rallySubmission.total_distance}</p>
                      </div>
                    )}
                  </div>
                  <Link to="/dashboard/rally-submission" className="btn-primary inline-block">
                    ✏️ Codes Beheren / Bijwerken
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-4">
                    Nadat je de rally hebt gereden, kan je hier je codes indienen en je punten bekijken.
                  </p>
                  <Link to="/dashboard/rally-submission" className="btn-primary inline-block">
                    📝 Rally Codes Indienen
                  </Link>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="card bg-blue-50 border-l-4 border-blue-600 mt-8">
              <h3 className="text-xl font-bold mb-2">📞 Hulp nodig?</h3>
              <p className="text-gray-700">
                Bij vragen of problemen kan je contact opnemen via:
              </p>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>📧 <strong>Email:</strong> info@deurdenbocht.be</li>
                <li>📱 <strong>WhatsApp:</strong> Link ontvang je bij de start</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
