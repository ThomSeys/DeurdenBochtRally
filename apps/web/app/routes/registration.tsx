import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser, createUserSession } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { getActiveEdition } from '~/lib/sanity.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Inschrijven - Deur Den Bocht' },
    { name: 'description', content: 'Schrijf je in voor de Deur Den Bocht rally!' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (user) {
    return redirect('/dashboard');
  }

  const activeEdition = await getActiveEdition().catch(() => null);
  const registrationOpen = activeEdition?.registrationOpen ?? false;

  return json({ registrationOpen });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');

  // Validate
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string'
  ) {
    return json(
      { error: 'Alle velden zijn verplicht' },
      { status: 400 }
    );
  }

  if (!email.includes('@')) {
    return json(
      { error: 'Ongeldig e-mailadres' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      { error: 'Wachtwoord moet minimaal 8 tekens bevatten' },
      { status: 400 }
    );
  }

  try {
    // Get active edition
    const activeEdition = await getActiveEdition();
    if (!activeEdition) {
      return json(
        { error: 'Er is momenteel geen actieve editie' },
        { status: 400 }
      );
    }

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !authData.user) {
      console.error('Sign up error:', signUpError);
      return json(
        { error: signUpError?.message || 'Registratie mislukt. Probeer het opnieuw.' },
        { status: 400 }
      );
    }

    // Create participant record
    const { error: participantError } = await supabase
      .from('participants')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        edition_id: activeEdition._id,
      });

    if (participantError) {
      console.error('Participant creation error:', participantError);
      // Try to delete the auth user if participant creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return json(
        { error: 'Fout bij het aanmaken van je profiel. Probeer het opnieuw.' },
        { status: 400 }
      );
    }

    // Create session
    return createUserSession(authData.user.id, '/registration/success');
  } catch (error) {
    console.error('Registration error:', error);
    return json(
      { error: 'Er is iets misgegaan. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}

export default function Registration() {
  const { registrationOpen } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  if (!registrationOpen) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="container-custom text-center py-16">
            <div className="card max-w-2xl mx-auto">
              <span className="text-6xl mb-4 block">🔒</span>
              <h1 className="text-4xl font-display font-bold mb-4">Inschrijvingen Gesloten</h1>
              <p className="text-xl text-gray-700 mb-6">
                De inschrijvingen voor deze editie zijn momenteel gesloten.
              </p>
              <p className="text-gray-600">
                Houd onze website en social media in de gaten voor updates!
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-display font-bold mb-4">Schrijf je in!</h1>
              <p className="text-xl text-gray-700">
                Klaar voor de ultieme rally ervaring? Maak je account aan.
              </p>
            </div>

            <div className="card">
              {actionData?.error && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                  <p className="text-red-700 font-bold">❌ {actionData.error}</p>
                </div>
              )}

              <Form method="post" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-bold text-gray-700 mb-2">
                      Voornaam *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                      placeholder="Jan"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-bold text-gray-700 mb-2">
                      Achternaam *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                      placeholder="Jansen"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    E-mailadres *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                    placeholder="jan@voorbeeld.nl"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                    Wachtwoord *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                    placeholder="Minimaal 8 tekens"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Gebruik minimaal 8 tekens met letters en cijfers
                  </p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-2">📋 Belangrijk om te weten:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Je moet 18 jaar of ouder zijn</li>
                    <li>• Je hebt een geldig rijbewijs nodig</li>
                    <li>• Deelname is op eigen risico</li>
                    <li>• Betaling gebeurt via online betaling na inschrijving</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Bezig met inschrijven...' : 'Schrijf me in! 🏍'}
                </button>

                <p className="text-center text-gray-600">
                  Al een account?{' '}
                  <a href="/login" className="text-primary-600 font-bold hover:text-primary-700">
                    Log hier in
                  </a>
                </p>
              </Form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
