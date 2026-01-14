import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData } from 'react-router';
import { supabase, supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Check-in - Deur Den Bocht' },
  ];
};

export async function action({ params, request }: ActionFunctionArgs) {
  console.info('[check-in] action start');

  try {
    const { participantId } = params;
    
    if (!participantId) {
      return { error: 'Participant ID is required' };
    }

    const { error: updateError } = await supabaseAdmin
      .from('participants')
      .update({ 
        checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (updateError) {
      console.error('[check-in] action error', updateError);
      return { error: 'Er ging iets mis bij het inchecken' };
    }

    console.info('[check-in] action success', { participantId });
    return { success: true };
  } catch (error) {
    console.error('[check-in] action error', error);
    return { error: 'Onverwachte fout' };
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { participantId } = params;
  
  if (!participantId) {
    throw new Response('Participant ID is required', { status: 400 });
  }

  // Get participant info
  const { data: participant, error } = await supabase
    .from('participants')
    .select('id, first_name, last_name, email, motorcycle_brand, motorcycle_model, license_plate, formula, ride_type, checked_in')
    .eq('id', participantId)
    .single();

  if (error || !participant) {
    return { error: 'Deelnemer niet gevonden', participant: null };
  }

  if (participant.checked_in) {
    return { success: true, alreadyCheckedIn: true, participant };
  }

  return { participant, alreadyCheckedIn: false };
}

export default function CheckIn() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Show success message after check-in
  if (actionData?.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-green-50 border-2 border-green-200 rounded-sm p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-in Geslaagd!</h1>
            <p className="text-gray-700 text-lg mb-6">
              Welkom bij Deur Den Bocht! Geniet van de rit!
            </p>
            <div className="text-primary-600 text-lg font-semibold">
              🏍️ Veel plezier!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error from action
  if (actionData?.error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-red-50 border-2 border-red-200 rounded-sm p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fout</h1>
            <p className="text-gray-700">{actionData.error}</p>
          </div>
        </div>
      </div>
    );
  }

  if ('error' in data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-red-50 border-2 border-red-200 rounded-sm p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Niet Gevonden</h1>
            <p className="text-gray-700">{data.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { participant, alreadyCheckedIn } = data;

  if (alreadyCheckedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-sm p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Al Ingecheckt</h1>
            <p className="text-gray-700 mb-6">
              {participant.first_name} {participant.last_name} is al ingecheckt!
            </p>
            <div className="bg-white rounded-sm p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Deelnemer Gegevens</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Motor:</span>{' '}
                  <span className="font-medium">{participant.motorcycle_brand} {participant.motorcycle_model}</span>
                </div>
                <div>
                  <span className="text-gray-600">Kenteken:</span>{' '}
                  <span className="font-medium">{participant.license_plate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border-2 border-gray-200 rounded-sm p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏍️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-in Bevestiging</h1>
            <p className="text-gray-600">Bevestig de gegevens om in te checken</p>
          </div>

          <div className="bg-gray-50 rounded-sm p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Deelnemer Gegevens</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Naam</label>
                <p className="text-lg font-medium text-gray-900">
                  {participant.first_name} {participant.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{participant.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Motor</label>
                <p className="text-gray-900">
                  {participant.motorcycle_brand} {participant.motorcycle_model}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Kenteken</label>
                <p className="text-gray-900">{participant.license_plate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Formule</label>
                <p className="text-gray-900">
                  {participant.formula === 'with_meals' ? '🍽️ Met maaltijden' : '☕ Alleen ontbijt'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rit Type</label>
                <p className="text-gray-900">
                  {participant.ride_type === 'guided' ? '👥 Begeleide rit' : '🏍️ Vrije rit'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Form method="post">
              <button
                type="submit"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-sm font-bold text-lg transition-colors"
              >
                Bevestig Check-in
              </button>
            </Form>
            <p className="text-sm text-gray-600 mt-4">
              Deze QR code moet gescand worden door een admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
