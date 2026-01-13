import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';

import { Form, useActionData, useSearchParams, Link } from 'react-router';
import { supabase, supabaseAdmin } from '~/lib/supabase.server';
import { createUserSession, getUserId } from '~/lib/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/dashboard');
  return { };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { 
      error: 'Email en wachtwoord zijn verplicht',
      status: 400
    };
  }

  // Authenticate with Supabase auth (server-side)
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (authError || !authData.user) {
    return { 
      error: 'Ongeldige login gegevens. Controleer je email en wachtwoord.',
      status: 400
    };
  }

  // Check if participant has completed payment
  const { data: participant } = await supabase
    .from('participants')
    .select('*')
    .eq('id', authData.user.id)
    .eq('payment_status', 'completed')
    .single();

  if (!participant) {
    return { 
      error: 'Je betaling is nog niet voltooid of je account bestaat niet.',
      status: 400
    };
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';

  return createUserSession(participant.id, redirectTo);
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏍 Deur Den Bocht
          </h1>
          <p className="text-gray-600">Login met je email en wachtwoord</p>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="jouw@email.be"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Wachtwoord
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Je wachtwoord"
            />
            <p className="mt-2 text-sm text-gray-500">
              Je hebt dit wachtwoord ingesteld bij je inschrijving
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Inloggen
          </button>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Wachtwoord vergeten?</p>
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
