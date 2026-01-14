import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';

import { Form, useActionData, useSearchParams, Link } from 'react-router';
import { supabase } from '~/lib/supabase.server';
import { createUserSession, getUserId } from '~/lib/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/dashboard');
  return { };
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[login] action start');

  try {
    const formData = await request.formData();
    const email = formData.get('email');
    const qrCode = formData.get('qrCode');

    if (typeof email !== 'string' || typeof qrCode !== 'string') {
      return { 
        error: 'Email en QR-code zijn verplicht',
        status: 400
      };
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('qr_code', qrCode)
      .eq('payment_status', 'completed')
      .single();

    if (!participant) {
      return { 
        error: 'Ongeldige login gegevens. Controleer je email en QR-code.',
        status: 400
      };
    }

    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';

    console.info('[login] action success', { participantId: participant.id });
    return createUserSession(participant.id, redirectTo);
  } catch (error) {
    console.error('[login] action error', error);
    return { error: 'Onverwachte fout', status: 500 };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-sm shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏍 Deur Den Bocht
          </h1>
          <p className="text-gray-600">Login met je QR-code</p>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="jouw@email.be"
            />
          </div>

          <div>
            <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">
              QR-code
            </label>
            <input
              id="qrCode"
              name="qrCode"
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="Je hebt deze ontvangen via email"
            />
            <p className="mt-2 text-sm text-gray-500">
              Je kreeg deze code in je bevestigingsmail na inschrijving
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-sm transition-colors"
          >
            Inloggen
          </button>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>QR-code kwijt?</p>
          <p className="mt-1">
            Stuur een email naar{' '}
            <a href="mailto:info@deurdenbocht.be" className="text-primary-600 hover:underline">
              info@deurdenbocht.be
            </a>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-primary-600 hover:underline">
            ← Terug naar homepagina
          </Link>
        </div>
      </div>
    </div>
  );
}
