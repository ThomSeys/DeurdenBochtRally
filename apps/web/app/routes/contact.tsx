import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';
import { getSiteConfig } from '~/lib/sanity.server';
import { sendContactFormEmail } from '~/lib/email.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Contact - Deur Den Bocht' },
    { name: 'description', content: 'Neem contact met ons op voor vragen over de Deur Den Bocht rally.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  const siteConfig = await getSiteConfig();
  
  return json({ 
    user, 
    contactEmail: siteConfig?.contactEmail || '',
    contactWhatsapp: siteConfig?.contactWhatsapp,
    contactLocation: siteConfig?.contactLocation,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const message = formData.get('message');

  // Validation
  if (!name || typeof name !== 'string' || name.length < 2) {
    return json({ error: 'Naam is verplicht (minimaal 2 karakters)' }, { status: 400 });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return json({ error: 'Geldig email adres is verplicht' }, { status: 400 });
  }

  if (!message || typeof message !== 'string' || message.length < 10) {
    return json({ error: 'Bericht is verplicht (minimaal 10 karakters)' }, { status: 400 });
  }

  try {
    const siteConfig = await getSiteConfig();
    const contactEmail = siteConfig?.contactEmail;

    if (!contactEmail) {
      return json({ error: 'Contact email niet geconfigureerd' }, { status: 500 });
    }

    await sendContactFormEmail(name, email, message, contactEmail);

    return json({ success: true, message: 'Je bericht is verzonden!' });
  } catch (error) {
    console.error('Contact form error:', error);
    return json({ error: 'Er is iets misgegaan. Probeer het later opnieuw.' }, { status: 500 });
  }
}

export default function Contact() {
  const { user, contactEmail, contactWhatsapp, contactLocation } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary-600 text-white py-16">
          <div className="container-custom">
            <h1 className="text-5xl font-display font-bold mb-4">Contact</h1>
            <p className="text-xl text-primary-100">
              Heb je vragen? Neem contact met ons op!
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Contact Information */}
              <div>
                <div className="card mb-8">
                  <h2 className="text-2xl font-display font-bold mb-6">📞 Contactgegevens</h2>
                  
                  {contactEmail && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-700 mb-2">Email</h3>
                      <a 
                        href={`mailto:${contactEmail}`}
                        className="text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <span className="mr-2">✉️</span>
                        {contactEmail}
                      </a>
                    </div>
                  )}

                  {contactWhatsapp && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-700 mb-2">WhatsApp</h3>
                      <a 
                        href={`https://wa.me/${contactWhatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <span className="mr-2">💬</span>
                        {contactWhatsapp}
                      </a>
                    </div>
                  )}

                  {contactLocation && (
                    <div>
                      <h3 className="font-bold text-gray-700 mb-2">Locatie</h3>
                      <p className="text-gray-600 flex items-start">
                        <span className="mr-2">📍</span>
                        <span>{contactLocation}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="card bg-blue-50 border-2 border-blue-400">
                  <h3 className="text-xl font-bold mb-4">⏰ Reactietijd</h3>
                  <p className="text-gray-700 mb-3">
                    We proberen alle berichten binnen <strong>24-48 uur</strong> te beantwoorden.
                  </p>
                  <p className="text-sm text-gray-600">
                    Voor dringende vragen kun je ons het beste via WhatsApp bereiken.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="card">
                <h2 className="text-2xl font-display font-bold mb-6">📧 Stuur een bericht</h2>
                
                {actionData && 'success' in actionData && actionData.success ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
                    <span className="text-6xl mb-4 block">✅</span>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">Verzonden!</h3>
                    <p className="text-green-700 mb-4">{actionData.message}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="btn-secondary"
                    >
                      Nog een bericht sturen
                    </button>
                  </div>
                ) : (
                  <>
                    {actionData && 'error' in actionData && actionData.error && (
                      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-700 font-bold">❌ {actionData.error}</p>
                      </div>
                    )}

                    <Form method="post" className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                          Naam *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          defaultValue={user ? `${user.first_name} ${user.last_name}` : ''}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0"
                          placeholder="Jouw naam"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          defaultValue={user?.email || ''}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0"
                          placeholder="jouw@email.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
                          Bericht *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={6}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0"
                          placeholder="Typ hier je vraag of opmerking..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full"
                      >
                        {isSubmitting ? 'Verzenden...' : 'Verstuur bericht'}
                      </button>

                      <p className="text-sm text-gray-600 text-center">
                        * = verplicht veld
                      </p>
                    </Form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
