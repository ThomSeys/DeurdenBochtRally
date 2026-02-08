import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';
import { Form, useActionData, useLoaderData, Link } from 'react-router';
import { supabase } from '~/lib/supabase.server';
import { getUserId } from '~/lib/session.server';
import { createRequestLogger } from '~/lib/logger.server';
import { getCSRFToken, verifyCSRFToken } from '~/lib/csrf.server';
import CSRFInput from '~/components/CSRFInput';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/dashboard');

  const csrfToken = await getCSRFToken(request);
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';

  return { csrfToken, code };
}

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  await requestLogger.info('auth', 'Password reset submission');

  try {
    const isValidToken = await verifyCSRFToken(request);
    if (!isValidToken) {
      await requestLogger.warn('auth', 'Password reset failed: invalid CSRF token');
      return { error: 'Invalid form submission. Please try again.', status: 403 };
    }

    const formData = await request.formData();
    const code = formData.get('code');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (typeof code !== 'string' || !code) {
      return { error: 'Reset link is ongeldig of verlopen.', status: 400 };
    }

    if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
      return { error: 'Wachtwoord is verplicht', status: 400 };
    }

    if (password.length < 6) {
      return { error: 'Wachtwoord moet minstens 6 karakters lang zijn', status: 400 };
    }

    if (password !== confirmPassword) {
      return { error: 'Wachtwoorden komen niet overeen', status: 400 };
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      await requestLogger.warn('auth', 'Password reset failed: invalid code', { error: exchangeError.message });
      return { error: 'Reset link is ongeldig of verlopen.', status: 400 };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      await requestLogger.warn('auth', 'Password reset failed: update error', { error: updateError.message });
      return { error: 'Wachtwoord kon niet worden bijgewerkt.', status: 500 };
    }

    await requestLogger.info('auth', 'Password reset successful');
    return redirect('/login?reset=success');
  } catch (error) {
    await requestLogger.error('auth', 'Password reset failed: unexpected error', error as Error);
    return { error: 'Onverwachte fout', status: 500 };
  }
}

export default function ResetPassword() {
  const { csrfToken, code } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-sm shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nieuw wachtwoord</h1>
          <p className="text-gray-600">Kies een nieuw wachtwoord voor je account.</p>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="space-y-6">
          <CSRFInput token={csrfToken} />
          <input type="hidden" name="code" value={code} />

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nieuw wachtwoord
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Bevestig wachtwoord
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-sm transition-colors"
          >
            Wachtwoord opslaan
          </button>
        </Form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-primary-600 hover:underline">
            Terug naar login
          </Link>
        </div>
      </div>
    </div>
  );
}
