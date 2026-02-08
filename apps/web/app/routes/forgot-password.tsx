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
  return { csrfToken };
}

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  await requestLogger.info('auth', 'Password reset requested');

  try {
    const isValidToken = await verifyCSRFToken(request);
    if (!isValidToken) {
      await requestLogger.warn('auth', 'Password reset failed: invalid CSRF token');
      return { error: 'Invalid form submission. Please try again.', status: 403 };
    }

    const formData = await request.formData();
    const email = formData.get('email');

    if (typeof email !== 'string') {
      await requestLogger.warn('auth', 'Password reset failed: missing email');
      return { error: 'Email is verplicht', status: 400 };
    }

    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo,
    });

    if (error) {
      await requestLogger.warn('auth', 'Password reset failed: supabase error', { error: error.message });
      return { error: 'Er ging iets mis bij het versturen van de reset e-mail.', status: 500 };
    }

    await requestLogger.info('auth', 'Password reset email sent', { email: email.toLowerCase() });
    return { success: true };
  } catch (error) {
    await requestLogger.error('auth', 'Password reset failed: unexpected error', error as Error);
    return { error: 'Onverwachte fout', status: 500 };
  }
}

export default function ForgotPassword() {
  const { csrfToken } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-sm shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wachtwoord vergeten</h1>
          <p className="text-gray-600">We sturen je een link om je wachtwoord te resetten.</p>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {actionData?.success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Als het e-mailadres bestaat, hebben we een reset link gestuurd.
          </div>
        )}

        <Form method="post" className="space-y-6">
          <CSRFInput token={csrfToken} />
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

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-sm transition-colors"
          >
            Reset link versturen
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
