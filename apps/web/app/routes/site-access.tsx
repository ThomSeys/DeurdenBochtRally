import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useSearchParams, useActionData } from 'react-router';
import { getSiteAccessSession, verifySitePassword, createSiteAccessSession } from '~/lib/site-password.server';
import { redirect } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('page-view', 'Site access page loaded');
  
  const session = await getSiteAccessSession(request);
  const hasAccess = session.get('hasAccess');
  
  // If already has access, redirect to home or intended page
  if (hasAccess) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirect') || '/';
    return redirect(redirectTo);
  }
  
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('authentication', 'Site access password attempt');

  try {
    const formData = await request.formData();
    const password = formData.get('password') as string;
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirect') || '/';

    if (!password) {
      return { error: 'Wachtwoord is verplicht' };
    }

    const isValid = await verifySitePassword(password);

    if (!isValid) {
      return { error: 'Onjuist wachtwoord' };
    }

    console.info('[site-access] action success');
    return createSiteAccessSession(request, redirectTo);
  } catch (error) {
    console.error('[site-access] action error', error);
    return { error: 'Onverwachte fout. Probeer opnieuw.' };
  }
}

export default function SiteAccessPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-sm shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Deur Den Bocht 2026
            </h1>
            <p className="text-gray-600">
              Voer het wachtwoord in om toegang te krijgen
            </p>
          </div>

          <Form method="post" className="space-y-6">
            <input
              type="hidden"
              name="redirect"
              value={searchParams.get('redirect') || '/'}
            />

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoFocus
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Voer wachtwoord in..."
              />
            </div>

            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {actionData.error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-sm font-bold transition-colors"
            >
              Toegang verkrijgen
            </button>
          </Form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Neem contact op met de organisatie als je het wachtwoord niet hebt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
