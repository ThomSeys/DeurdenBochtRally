import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation, useSearchParams } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { supabase } from '~/lib/supabase.server';
import { createUserSession, getUserId } from '~/lib/session.server';
import bcrypt from 'bcryptjs';

export const meta: MetaFunction = () => {
  return [
    { title: 'Inloggen - Deur Den Bocht' },
    { name: 'description', content: 'Log in op je Deur Den Bocht account' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/dashboard');
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string || '/dashboard';

  if (!email || !password) {
    return json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400 });
  }

  // Find participant by email
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('payment_status', 'completed')
    .single();

  if (error || !participant) {
    return json(
      { error: 'Ongeldige inloggegevens.' },
      { status: 401 }
    );
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, participant.password_hash);

  if (!isValidPassword) {
    return json(
      { error: 'Ongeldige inloggegevens.' },
      { status: 401 }
    );
  }

  return createUserSession(participant.id, redirectTo);
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 section">
        <div className="container-custom">
          <div className="max-w-md mx-auto">
            <div className="card">
              <div className="text-center mb-6">
                <span className="text-5xl">🔐</span>
                <h1 className="text-3xl font-display font-bold mt-4">Inloggen</h1>
                <p className="text-gray-600 mt-2">
                  Log in met je email en wachtwoord
                </p>
              </div>

              {actionData?.error && (
                <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4 mb-6">
                  <p className="text-red-800">❌ {actionData.error}</p>
                </div>
              )}

              <Form method="post">
                <input type="hidden" name="redirectTo" value={redirectTo} />

                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="je@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-semibold mb-2">
                    Wachtwoord *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="Je wachtwoord"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '⏳ Bezig met inloggen...' : '🔓 Inloggen'}
                </button>
              </Form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-600">
                  Nog niet ingeschreven?{' '}
                  <Link to="/registration" className="text-primary-600 font-semibold hover:underline">
                    Schrijf je hier in
                  </Link>
                </p>
              </div>
            </div>

            <div className="card bg-blue-50 border-l-4 border-blue-600 mt-6">
              <h3 className="font-bold mb-2">💡 QR Code kwijt?</h3>
              <p className="text-sm text-gray-700">
                Je QR code staat in de bevestigingsmail die je ontving na je inschrijving. 
                Controleer ook je spam folder. Kan je hem niet vinden? Neem dan contact met ons op.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
