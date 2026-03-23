import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { redirect } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { FORMULA_LABELS, RIDE_TYPE_LABELS } from '~/lib/utils';
import { createUserSession, getUserId } from '~/lib/session.server';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Inschrijving Geslaagd - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('page-view', 'Registration success page loaded');
  
  // Import server-only modules in parallel
  const [{ supabaseAdmin }, { stripe }] = await Promise.all([
    import('~/lib/supabase.server'),
    import('~/lib/stripe.server'),
  ]);
  
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId) {
    return redirect('/');
  }

  // Check if already logged in
  const existingUserId = await getUserId(request);
  
  // Verify Stripe session
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session.metadata?.participantId) {
    return redirect('/');
  }

  // Get participant details
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', session.metadata.participantId)
    .single();

  if (!participant) {
    return redirect('/');
  }

  // Update payment status if not already completed (fallback for when webhook hasn't fired yet)
  if (participant.payment_status !== 'completed' && session.payment_status === 'paid') {
    await supabaseAdmin
      .from('participants')
      .update({
        payment_status: 'completed',
        stripe_payment_id: session.payment_intent as string,
      })
      .eq('id', session.metadata.participantId);
    
    participant.payment_status = 'completed';
  }

  // Auto-login user if not already logged in
  if (!existingUserId && participant.payment_status === 'completed') {
    return createUserSession(participant.id, '/registration/success?session_id=' + sessionId);
  }

  return {  participant, session };
}

export default function RegistrationSuccess() {
  const { participant } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-sm shadow-xl p-8">
        <div className="text-center mb-8">
          <Icon name="check" className="w-24 h-24 text-green-600 mb-4" />
          <h1 className="text-3xl font-black text-gray-900 mb-2 gradient-text">
            Inschrijving geslaagd!
          </h1>
          <p className="text-xl text-gray-600">
            Welkom bij Deur Den Bocht, {participant.first_name}!
          </p>
        </div>

        <div className="bg-gray-50 rounded-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Je gegevens</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Naam:</dt>
              <dd className="font-medium">{participant.first_name} {participant.last_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Email:</dt>
              <dd className="font-medium">{participant.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Motor:</dt>
              <dd className="font-medium">{participant.motorcycle_brand} {participant.motorcycle_model}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Formule:</dt>
              <dd className="font-medium">{FORMULA_LABELS[participant.formula as keyof typeof FORMULA_LABELS]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Rittype:</dt>
              <dd className="font-medium">{RIDE_TYPE_LABELS[participant.ride_type as keyof typeof RIDE_TYPE_LABELS]}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-primary-50 border border-primary-200 rounded-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Je QR-code</h2>
          <div className="bg-white p-4 rounded-sm text-center mb-4">
            <p className="font-mono text-2xl font-bold text-primary-600 mb-2">
              {participant.qr_code}
            </p>
            <p className="text-sm text-gray-600">
              Bewaar deze code goed - je hebt hem nodig om in te loggen!
            </p>
          </div>
          <p className="text-sm text-gray-700">
            Deze code is ook verstuurd naar je emailadres. Toon deze code aan de start
            om je materiaal te ontvangen.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">📧 Check je email</h3>
          <p className="text-sm text-green-800">
            Je ontvangt binnenkort een bevestigingsmail met alle informatie en je QR-code.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Volgende stappen:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 font-bold mr-2">1.</span>
              <span>Log in op je dashboard met je email en QR-code</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 font-bold mr-2">2.</span>
              <span>Download de GPX route en het Bochtenboek</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 font-bold mr-2">3.</span>
              <span>Kom op de dag zelf naar Café Den Belami tussen 06:30 en 08:00</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex gap-4">
          <Link to="/dashboard" className="btn-primary flex-1 text-center">
            Ga naar Dashboard
          </Link>
          <Link
            to="/"
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 text-center font-semibold py-3 px-4 rounded-sm transition-colors"
          >
            Terug naar Home
          </Link>
        </div>
      </div>
    </div>
  );
}
