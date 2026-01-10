import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser, createUserSession } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { getActiveEdition, getSiteConfig } from '~/lib/sanity.server';
import { createStripeCheckoutSession } from '~/lib/stripe.server';
import { sendRegistrationConfirmationEmail } from '~/lib/email.server';
import bcrypt from 'bcryptjs';

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
  const pricingTiers = activeEdition?.pricingTiers ?? [];

  return json({ 
    registrationOpen,
    pricingTiers,
    editionId: activeEdition?._id
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const phone = formData.get('phone');
  const motorcycleBrand = formData.get('motorcycleBrand');
  const motorcycleModel = formData.get('motorcycleModel');
  const licensePlate = formData.get('licensePlate');
  const formula = formData.get('formula');
  const rideType = formData.get('rideType');
  const skipPayment = formData.get('skipPayment') === 'true';

  // Validate required fields
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof phone !== 'string' ||
    typeof motorcycleBrand !== 'string' ||
    typeof motorcycleModel !== 'string' ||
    typeof licensePlate !== 'string' ||
    typeof formula !== 'string' ||
    typeof rideType !== 'string'
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

  if (formula !== 'with_meals' && formula !== 'breakfast_only') {
    return json(
      { error: 'Ongeldige formule geselecteerd' },
      { status: 400 }
    );
  }

  if (rideType !== 'free' && rideType !== 'guided') {
    return json(
      { error: 'Ongeldig rit type geselecteerd' },
      { status: 400 }
    );
  }

  try {
    // Get active edition with pricing
    const activeEdition = await getActiveEdition();
    if (!activeEdition) {
      return json(
        { error: 'Er is momenteel geen actieve editie' },
        { status: 400 }
      );
    }

    // Calculate price based on formula
    const pricingTier = activeEdition.pricingTiers?.find((tier: any) => 
      (formula === 'with_meals' && tier.name.toLowerCase().includes('maaltijd')) ||
      (formula === 'breakfast_only' && tier.name.toLowerCase().includes('ontbijt'))
    );
    
    const amountPaid = pricingTier?.price || (formula === 'with_meals' ? 75 : 50);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('participants')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return json(
        { error: 'Er bestaat al een account met dit e-mailadres' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate a unique user ID
    const userId = crypto.randomUUID();

    // Create participant record
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        motorcycle_brand: motorcycleBrand,
        motorcycle_model: motorcycleModel,
        license_plate: licensePlate,
        formula: formula as 'with_meals' | 'breakfast_only',
        ride_type: rideType as 'free' | 'guided',
        amount_paid: amountPaid,
        payment_status: skipPayment ? 'completed' : 'pending',
        password_hash: passwordHash,
        qr_code: `${userId}-${Date.now()}`,
      })
      .select()
      .single();

    if (participantError || !participant) {
      console.error('Participant creation error:', participantError);
      return json(
        { error: 'Fout bij het aanmaken van je profiel. Probeer het opnieuw.' },
        { status: 400 }
      );
    }

    // If skipPayment is true (development/testing), send email and redirect to success
    if (skipPayment) {
      // Send confirmation email with QR code
      try {
        const siteConfig = await getSiteConfig();
        const baseUrl = new URL(request.url).origin;
        await sendRegistrationConfirmationEmail(
          participant,
          siteConfig?.eventName || 'Deur Den Bocht Rally',
          baseUrl
        );
        console.log(`📧 Confirmation email sent to ${participant.email}`);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail registration if email fails
      }
      return createUserSession(participant.id, '/registration/success');
    }

    // Create Stripe checkout session
    const baseUrl = new URL(request.url).origin;
    const checkoutUrl = await createStripeCheckoutSession({
      participantId: participant.id,
      email: participant.email,
      name: `${participant.first_name} ${participant.last_name}`,
      amount: amountPaid,
      successUrl: `${baseUrl}/registration/success`,
      cancelUrl: `${baseUrl}/registration`,
    });

    // Redirect to Stripe checkout
    return redirect(checkoutUrl);
  } catch (error) {
    console.error('Registration error:', error);
    return json(
      { error: 'Er is iets misgegaan. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}

export default function Registration() {
  const { registrationOpen, pricingTiers } = useLoaderData<typeof loader>();
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
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-display font-bold mb-4">Schrijf je in!</h1>
              <p className="text-xl text-gray-700">
                Klaar voor de ultieme rally ervaring? Vul je gegevens in en maak je betaling af.
              </p>
            </div>

            <div className="card">
              {actionData?.error && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                  <p className="text-red-700 font-bold">❌ {actionData.error}</p>
                </div>
              )}

              <Form method="post" className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h2 className="text-2xl font-display font-bold mb-4 text-primary-600">
                    👤 Persoonlijke Gegevens
                  </h2>
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
                        placeholder="Janssens"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
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

                  <div className="mt-6">
                    <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">
                      Telefoonnummer *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                      placeholder="+32 123 45 67 89"
                    />
                  </div>

                  <div className="mt-6">
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
                </div>

                {/* Motorcycle Information */}
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-display font-bold mb-4 text-primary-600">
                    🏍️ Motorfiets Gegevens
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="motorcycleBrand" className="block text-sm font-bold text-gray-700 mb-2">
                        Merk *
                      </label>
                      <input
                        type="text"
                        id="motorcycleBrand"
                        name="motorcycleBrand"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                        placeholder="BMW, Honda, Yamaha, ..."
                      />
                    </div>

                    <div>
                      <label htmlFor="motorcycleModel" className="block text-sm font-bold text-gray-700 mb-2">
                        Model *
                      </label>
                      <input
                        type="text"
                        id="motorcycleModel"
                        name="motorcycleModel"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                        placeholder="GS 1250, CB 500, ..."
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="licensePlate" className="block text-sm font-bold text-gray-700 mb-2">
                      Nummerplaat *
                    </label>
                    <input
                      type="text"
                      id="licensePlate"
                      name="licensePlate"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors uppercase"
                      placeholder="1-ABC-123"
                    />
                  </div>
                </div>

                {/* Formula Selection */}
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-display font-bold mb-4 text-primary-600">
                    🍽️ Kies je formule
                  </h2>
                  
                  {pricingTiers && pricingTiers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pricingTiers.map((tier: any) => (
                        <label
                          key={tier._id}
                          className={`relative cursor-pointer border-4 rounded-lg p-6 transition-all hover:scale-105 ${
                            tier.highlighted 
                              ? 'border-primary-600 bg-primary-50' 
                              : 'border-gray-300 hover:border-primary-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="formula"
                            value={tier.name.toLowerCase().includes('maaltijd') ? 'with_meals' : 'breakfast_only'}
                            required
                            className="sr-only peer"
                          />
                          <div className="peer-checked:ring-4 peer-checked:ring-primary-600 rounded-lg -m-1 p-1">
                            <div className="text-center">
                              <div className="text-4xl mb-2">{tier.icon || '🍽️'}</div>
                              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                              <p className="text-3xl font-black text-primary-600 mb-4">€{tier.price}</p>
                              {tier.features && tier.features.length > 0 && (
                                <ul className="text-sm text-left space-y-1">
                                  {tier.features.map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="mr-2">✓</span>
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="relative cursor-pointer border-4 border-gray-300 rounded-lg p-6 block hover:border-primary-400 transition-all">
                        <input
                          type="radio"
                          name="formula"
                          value="with_meals"
                          required
                          className="mr-3"
                        />
                        <span className="font-bold">🍽️ Met maaltijden (€75)</span>
                        <p className="text-sm text-gray-600 ml-7">Ontbijt, lunch en avondmaal inbegrepen</p>
                      </label>

                      <label className="relative cursor-pointer border-4 border-gray-300 rounded-lg p-6 block hover:border-primary-400 transition-all">
                        <input
                          type="radio"
                          name="formula"
                          value="breakfast_only"
                          required
                          className="mr-3"
                        />
                        <span className="font-bold">☕ Enkel ontbijt (€50)</span>
                        <p className="text-sm text-gray-600 ml-7">Alleen ontbijt inbegrepen</p>
                      </label>
                    </div>
                  )}
                </div>

                {/* Ride Type Selection */}
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-display font-bold mb-4 text-primary-600">
                    🏁 Type rit
                  </h2>
                  <div className="space-y-4">
                    <label className="relative cursor-pointer border-4 border-gray-300 rounded-lg p-6 block hover:border-primary-400 transition-all">
                      <input
                        type="radio"
                        name="rideType"
                        value="free"
                        required
                        className="mr-3"
                      />
                      <span className="font-bold">🔵 Vrije rit</span>
                      <p className="text-sm text-gray-600 ml-7">Rijd op je eigen tempo, volg de route met je GPS</p>
                    </label>

                    <label className="relative cursor-pointer border-4 border-gray-300 rounded-lg p-6 block hover:border-primary-400 transition-all">
                      <input
                        type="radio"
                        name="rideType"
                        value="guided"
                        required
                        className="mr-3"
                      />
                      <span className="font-bold">🟢 Begeleide rit</span>
                      <p className="text-sm text-gray-600 ml-7">Rijd mee in een groep met een gids</p>
                    </label>
                  </div>
                </div>

                {/* Development: Skip Payment */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="border-t-2 border-yellow-300 bg-yellow-50 pt-6 pb-6 px-6 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="skipPayment"
                        value="true"
                        className="mr-3 w-5 h-5"
                      />
                      <span className="font-bold text-yellow-800">
                        ⚠️ DEV: Skip betaling (mark as paid)
                      </span>
                    </label>
                  </div>
                )}

                <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-2">📋 Belangrijk om te weten:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Je moet 18 jaar of ouder zijn</li>
                    <li>• Je hebt een geldig rijbewijs nodig</li>
                    <li>• Deelname is op eigen risico</li>
                    <li>• Na het invullen word je doorgestuurd naar de betaalpagina</li>
                    <li>• Je ontvangt een bevestigingsmail na succesvolle betaling</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Bezig met inschrijven...' : 'Naar Betaling 💳'}
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
