import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { commitSession, getSession } from '~/lib/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  
  if (session.get('siteAccessGranted')) {
    return redirect('/');
  }
  
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = formData.get('password');
  const correctPassword = process.env.SITE_PASSWORD || 'deurdenbocht2026';
  
  if (password !== correctPassword) {
    return json(
      { error: 'Incorrect password' },
      { status: 401 }
    );
  }
  
  const session = await getSession(request.headers.get('Cookie'));
  session.set('siteAccessGranted', true);
  
  return redirect('/', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}

export default function SitePassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-primary-100 rounded-full p-4 mb-4">
              <span className="text-5xl">🔒</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Privé Toegang
            </h1>
            <p className="text-gray-600">
              Deze site is privé. Voer het wachtwoord in om toegang te krijgen.
            </p>
          </div>

          {actionData?.error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-bold text-center">❌ {actionData.error}</p>
            </div>
          )}

          <Form method="post" className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Wachtwoord
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                placeholder="Voer wachtwoord in"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Controleren...' : 'Toegang verkrijgen'}
            </button>
          </Form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Deur Den Bocht - Den Bochtenkoning Rally 2026
          </p>
        </div>
      </div>
    </div>
  );
}
