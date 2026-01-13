import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';

import { redirect } from 'react-router';
import { Form, useActionData, useLoaderData } from 'react-router';
import { useState } from 'react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import { getActiveEdition, getPricingTiers } from '~/lib/sanity.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { createCheckoutSession } from '~/lib/stripe.server';
import { generateQRCode } from '~/lib/qrcode.server';
import { FORMULA_PRICES } from '~/lib/utils';

export const meta: MetaFunction = () => {
  return [
    { title: 'Inschrijven - Deur Den Bocht' },
    { name: 'description', content: 'Schrijf je in voor Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const edition = await getActiveEdition();
  
  if (!edition?.registrationOpen) {
    return redirect('/');
  }

  const pricing = await getPricingTiers(edition._id);

  return {  edition, pricing };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const password = formData.get('password');
  const motorcycleBrand = formData.get('motorcycleBrand');
  const motorcycleModel = formData.get('motorcycleModel');
  const licensePlate = formData.get('licensePlate');
  const formula = formData.get('formula');
  const rideType = formData.get('rideType');

  // Validation
  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof email !== 'string' ||
    typeof phone !== 'string' ||
    typeof password !== 'string' ||
    typeof motorcycleBrand !== 'string' ||
    typeof motorcycleModel !== 'string' ||
    typeof licensePlate !== 'string' ||
    typeof formula !== 'string' ||
    typeof rideType !== 'string'
  ) {
    return {  error: 'Alle velden zijn verplicht', status: 400 };
  }

  if (password.length < 6) {
    return {  error: 'Wachtwoord moet minstens 6 karakters lang zijn', status: 400 };
  }

  if (!['with_meals', 'breakfast_only'].includes(formula)) {
    return {  error: 'Ongeldige formule geselecteerd', status: 400 };
  }

  if (!['free', 'guided'].includes(rideType)) {
    return {  error: 'Ongeldig rittype geselecteerd', status: 400 };
  }

  // Check if email already registered
  const { data: existing } = await supabaseAdmin
    .from('participants')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existing) {
    return {  error: 'Dit emailadres is al geregistreerd', status: 400 };
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error('Auth error:', authError);
    return {  error: 'Er ging iets mis bij het aanmaken van je account. Probeer opnieuw.', status: 500 };
  }

  // Generate QR code
  const qrCode = generateQRCode();

  // Get price
  const amount = FORMULA_PRICES[formula as keyof typeof FORMULA_PRICES];

  // Create participant record linked to auth user
  const { data: participant, error: dbError } = await supabaseAdmin
    .from('participants')
    .insert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone,
      motorcycle_brand: motorcycleBrand,
      motorcycle_model: motorcycleModel,
      license_plate: licensePlate.toUpperCase(),
      formula,
      ride_type: rideType,
      amount_paid: amount,
      qr_code: qrCode,
      payment_status: 'pending',
    })
    .select()
    .single();

  if (dbError || !participant) {
    console.error('Database error:', dbError);
    // Clean up auth user if participant creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return {  error: 'Er ging iets mis bij het registreren. Probeer opnieuw.', status: 500 };
  }

  // Check if payment bypass is enabled (for development)
  const bypassPayment = process.env.BYPASS_PAYMENT === 'true';
  
  if (bypassPayment) {
    // Mark as completed without payment
    await supabaseAdmin
      .from('participants')
      .update({ payment_status: 'completed' })
      .eq('id', participant.id);
    
    const { createUserSession } = await import('~/lib/session.server');
    return createUserSession(participant.id, '/dashboard');
  }

  // Create Stripe checkout session
  try {
    const session = await createCheckoutSession({
      email: email.toLowerCase(),
      amount: amount / 100, // Convert cents to euros
      metadata: {
        participantId: participant.id,
        formula,
        rideType,
        qrCode,
      },
    });

    return {  checkoutUrl: session.url };
  } catch (error) {
    console.error('Stripe error:', error);
    // Clean up participant record
    await supabaseAdmin
      .from('participants')
      .delete()
      .eq('id', participant.id);

    return {  error: 'Er ging iets mis bij het aanmaken van de betaling. Probeer opnieuw.', status: 500 };
  }
}

export default function Registration() {
  const { edition, pricing } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedFormula, setSelectedFormula] = useState<string>('with_meals');
  const [selectedRideType, setSelectedRideType] = useState<string>('free');

  // Redirect to Stripe if we have a checkout URL
  if (actionData && 'checkoutUrl' in actionData && actionData.checkoutUrl) {
    window.location.href = actionData.checkoutUrl;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-grow bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inschrijven</h1>
            <p className="text-gray-600 mb-8">
              Vul je gegevens in om je in te schrijven voor Deur Den Bocht {edition.year}
            </p>

            {actionData?.error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {actionData.error}
              </div>
            )}

            <Form method="post" className="space-y-6">
              {/* Personal Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Persoonlijke gegevens</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Voornaam *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Achternaam *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefoon *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  
                <div className="mt-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Wachtwoord *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Minstens 6 karakters"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Dit wachtwoord gebruik je om in te loggen op je dashboard
                  </p>
                </div>
                </div>
                </div>
              </div>

              {/* Motorcycle Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Motorgegevens</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="motorcycleBrand" className="block text-sm font-medium text-gray-700 mb-1">
                      Merk *
                    </label>
                    <input
                      id="motorcycleBrand"
                      name="motorcycleBrand"
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="bv. BMW, Honda, Yamaha..."
                    />
                  </div>
                  <div>
                    <label htmlFor="motorcycleModel" className="block text-sm font-medium text-gray-700 mb-1">
                      Model *
                    </label>
                    <input
                      id="motorcycleModel"
                      name="motorcycleModel"
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="bv. R1250GS, CB500X..."
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                    Nummerplaat *
                  </label>
                  <input
                    id="licensePlate"
                    name="licensePlate"
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                    placeholder="1-ABC-123"
                  />
                </div>
              </div>

              {/* Formula Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Kies je formule *</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {pricing.map((tier: any) => (
                    <label
                      key={tier._id}
                      className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                        selectedFormula === (tier.price === 20 ? 'with_meals' : 'breakfast_only')
                          ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="formula"
                        value={tier.price === 20 ? 'with_meals' : 'breakfast_only'}
                        className="sr-only"
                        onChange={(e) => setSelectedFormula(e.target.value)}
                        checked={selectedFormula === (tier.price === 20 ? 'with_meals' : 'breakfast_only')}
                      />
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl mb-2">{tier.icon}</span>
                          <span className="text-2xl font-bold text-primary-600">€{tier.price}</span>
                        </div>
                        <span className="block text-lg font-semibold text-gray-900">{tier.name}</span>
                        {tier.features && (
                          <ul className="mt-2 space-y-1">
                            {tier.features.map((feature: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start">
                                <span className="text-primary-600 mr-1">✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ride Type Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Kies je rittype *</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <label
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      selectedRideType === 'free'
                        ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rideType"
                      value="free"
                      className="sr-only"
                      onChange={(e) => setSelectedRideType(e.target.value)}
                      checked={selectedRideType === 'free'}
                    />
                    <div className="flex flex-1 flex-col">
                      <span className="text-2xl mb-2">🔵</span>
                      <span className="block text-lg font-semibold text-gray-900">Vrije rit</span>
                      <span className="mt-2 text-sm text-gray-600">
                        Rijd op eigen tempo, alleen of met vrienden. Je kiest zelf je pauzes.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      selectedRideType === 'guided'
                        ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rideType"
                      value="guided"
                      className="sr-only"
                      onChange={(e) => setSelectedRideType(e.target.value)}
                      checked={selectedRideType === 'guided'}
                    />
                    <div className="flex flex-1 flex-col">
                      <span className="text-2xl mb-2">🟢</span>
                      <span className="block text-lg font-semibold text-gray-900">Begeleide rit</span>
                      <span className="mt-2 text-sm text-gray-600">
                        Vertrek 08:00 stipt in een groep van ±5 motoren met voor- en achterrijder.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t">
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors"
                >
                  Doorgaan naar betaling
                </button>
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Je wordt doorverwezen naar een beveiligde betalingspagina van Stripe
                </p>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
