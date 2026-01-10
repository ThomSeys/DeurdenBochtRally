import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Check-in Succesvol - Deur Den Bocht' },
    { name: 'description', content: 'Je bent succesvol ingecheckt!' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const url = new URL(request.url);
  
  const name = url.searchParams.get('name');
  const email = url.searchParams.get('email');
  const status = url.searchParams.get('status');
  const checkedIn = url.searchParams.get('checkedIn');

  return json({ user, name, email, status, checkedIn });
}

export default function CheckInSuccess() {
  const { user, name, email, status, checkedIn } = useLoaderData<typeof loader>();
  
  const isPaid = status === 'paid';

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-16 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            {/* Success Card */}
            <div className={`card ${isPaid ? 'bg-green-50 border-l-8 border-green-500' : 'bg-yellow-50 border-l-8 border-yellow-500'}`}>
              <div className="text-center mb-8">
                <span className="text-8xl mb-4 block animate-bounce">
                  {isPaid ? '✅' : '⚠️'}
                </span>
                <h1 className="text-4xl font-display font-bold mb-4">
                  {checkedIn === 'true' ? 'Ingecheckt!' : 'Geverifieerd!'}
                </h1>
                <p className={`text-2xl font-bold ${isPaid ? 'text-green-700' : 'text-yellow-700'}`}>
                  {isPaid 
                    ? 'Deelnemer geverifieerd en betaald' 
                    : 'Deelnemer geregistreerd maar niet betaald'}
                </p>
              </div>

              {/* Participant Details */}
              <div className="space-y-4 mb-8">
                <div className="bg-white rounded-lg p-6 shadow">
                  <p className="text-sm text-gray-600 mb-1">Naam</p>
                  <p className="text-2xl font-black text-brand-600">{name}</p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-lg font-bold">{email}</p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className={`text-lg font-black ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isPaid ? '✓ BETAALD' : '⚠ NIET BETAALD'}
                  </p>
                </div>
              </div>

              {/* Payment Warning */}
              {!isPaid && (
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-6 mb-6">
                  <p className="font-bold text-yellow-800 text-lg mb-2">
                    ⚠️ Betaling vereist
                  </p>
                  <p className="text-yellow-700">
                    Deze deelnemer moet nog betalen voordat ze mogen deelnemen aan het evenement.
                  </p>
                </div>
              )}

              {/* Success Message */}
              {isPaid && checkedIn === 'true' && (
                <div className="bg-green-100 border-2 border-green-400 rounded-lg p-6 mb-6">
                  <p className="font-bold text-green-800 text-lg mb-2">
                    🎉 Welkom bij Deur Den Bocht!
                  </p>
                  <p className="text-green-700">
                    Deze deelnemer is succesvol ingecheckt en klaar om te rijden!
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/" className="btn-primary flex-1 text-center">
                  🏠 Naar Homepage
                </Link>
                {user && (
                  <Link to="/dashboard" className="btn-secondary flex-1 text-center">
                    📊 Mijn Dashboard
                  </Link>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="card mt-6 bg-blue-50">
              <h3 className="text-xl font-bold mb-4">ℹ️ Info</h3>
              <p className="text-gray-700">
                De deelnemer is nu geregistreerd als ingecheckt in het systeem. 
                {isPaid 
                  ? ' Ze kunnen nu deelnemen aan het evenement.' 
                  : ' Let op: betaling is nog steeds vereist.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
