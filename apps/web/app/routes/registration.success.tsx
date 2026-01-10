import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { supabase } from '~/lib/supabase.server';
import { stripe } from '~/lib/stripe.server';
import { requireUserId } from '~/lib/session.server';
import type { Database } from '~/lib/database.types';

type Participant = Database['public']['Tables']['participants']['Row'];

export const meta: MetaFunction = () => {
  return [
    { title: 'Inschrijving Succesvol - Deur Den Bocht' },
    { name: 'description', content: 'Je inschrijving voor Deur Den Bocht is succesvol!' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<
  { success: true; participant: Participant; skipped?: boolean } | 
  { success: false; participant: null }
> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const isSkipped = url.searchParams.get('skip') === 'true';

  // Handle skip payment flow
  if (isSkipped) {
    const cookieHeader = request.headers.get('Cookie');
    const userId = cookieHeader ? await requireUserId(request) : null;
    
    if (!userId) {
      return json({ success: false, participant: null });
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('id', userId)
      .single();

    return json({ success: true, participant, skipped: true });
  }

  if (!sessionId) {
    return json({ success: false, participant: null });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Update participant payment status
      const { data: participant } = await supabase
        .from('participants')
        .update({
          payment_status: 'completed',
          stripe_payment_id: session.payment_intent as string,
        })
        .eq('id', session.metadata?.participantId)
        .select()
        .single();

      return json({ success: true, participant });
    }

    return json({ success: false, participant: null });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return json({ success: false, participant: null });
  }
}

export default function RegistrationSuccess() {
  const { success, participant } = useLoaderData<typeof loader>();

  if (!success || !participant) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 section">
          <div className="container-custom">
            <div className="card max-w-2xl mx-auto text-center">
              <span className="text-6xl">❌</span>
              <h1 className="text-3xl font-display font-bold mt-4 mb-4">
                Er ging iets mis
              </h1>
              <p className="text-gray-700 mb-6">
                We konden je betaling niet verifiëren. Neem contact met ons op als je denkt dat dit een fout is.
              </p>
              <Link to="/" className="btn-primary inline-block">
                Terug naar Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="section bg-green-50">
          <div className="container-custom">
            <div className="card max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-7xl">✅</span>
                <h1 className="text-4xl font-display font-bold mt-4 mb-2">
                  Inschrijving Succesvol!
                </h1>
                <p className="text-xl text-gray-700">
                  Welkom bij Deur Den Bocht, {participant.first_name}!
                </p>
              </div>

              <div className="bg-primary-50 border-2 border-primary-600 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Je inschrijvingsdetails</h2>
                <div className="space-y-2">
                  <p><strong>Naam:</strong> {participant.first_name} {participant.last_name}</p>
                  <p><strong>Email:</strong> {participant.email}</p>
                  <p><strong>Motor:</strong> {participant.motorcycle_brand} {participant.motorcycle_model}</p>
                  <p><strong>Formule:</strong> {participant.formula === 'with_meals' ? 'Met alle maaltijden (€20)' : 'Enkel ontbijt (€10)'}</p>
                  <p><strong>Type rit:</strong> {participant.ride_type === 'free' ? 'Vrije rit' : 'Begeleide rit'}</p>
                  <p><strong>QR Code:</strong> {participant.qr_code}</p>
                </div>
              </div>

              <div className="card bg-blue-50 border-l-4 border-blue-600 mb-6">
                <h3 className="font-bold mb-2">📧 Bevestigingsmail</h3>
                <p className="text-gray-700">
                  We hebben een bevestigingsmail gestuurd naar <strong>{participant.email}</strong> met:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  <li>Je QR-code voor check-in</li>
                  <li>Praktische informatie</li>
                  <li>Links naar de GPX-route en documenten</li>
                </ul>
              </div>

              <div className="card bg-yellow-50 border-l-4 border-yellow-600 mb-6">
                <h3 className="font-bold mb-2">📱 Volgende stappen</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Bewaar je bevestigingsmail goed</li>
                  <li>Log in op het dashboard voor toegang tot routes en documenten</li>
                  <li>Toon je QR-code bij aankomst aan de start</li>
                  <li>Geniet van de rit!</li>
                </ol>
              </div>

              <div className="text-center space-x-4">
                <Link to="/login" className="btn-primary inline-block">
                  📱 Naar Dashboard
                </Link>
                <Link to="/" className="btn-secondary inline-block">
                  🏠 Naar Home
                </Link>
              </div>

              <div className="text-center mt-8 pt-6 border-t">
                <p className="text-2xl font-display font-bold mb-2">
                  Zien we je op het event! 🏍
                </p>
                <p className="text-gray-600 italic">
                  "Altijd via de omweg."
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
