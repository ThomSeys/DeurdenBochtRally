import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';

import { Form, useActionData, useSearchParams, Link } from 'react-router';
import React from 'react';
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
    const password = formData.get('password');

    if (typeof email !== 'string' || typeof password !== 'string') {
      return { 
        error: 'Email en wachtwoord zijn verplicht',
        status: 400
      };
    }

    // Authenticate with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (authError || !user) {
      console.error('[login] auth error', authError?.message);
      return { 
        error: 'Ongeldige inloggegevens. Controleer je email en wachtwoord.',
        status: 401
      };
    }

    // Verify user is a participant with completed payment
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .single();

    if (!participant) {
      console.error('[login] participant not found or payment not completed');
      return { 
        error: 'Je account is niet actief. Controleer je betaling.',
        status: 403
      };
    }

    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';

    console.info('[login] action success', { userId: user.id, participantId: participant.id });
    return createUserSession(participant.id, redirectTo);
  } catch (error) {
    console.error('[login] action error', error);
    return { error: 'Onverwachte fout', status: 500 };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-sm shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏍 Deur Den Bocht
          </h1>
          <p className="text-gray-600">Inloggen op je account</p>
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Wachtwoord
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-sm transition-colors"
          >
            Inloggen
          </button>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Nog geen account?{' '}
            <Link to="/registration" className="text-primary-600 hover:underline font-medium">
              Inschrijven
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-primary-600 hover:underline">
            ← Terug naar homepagina
          </Link>
        </div>
      </div>
    </div>
  );
}
