import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';

import { redirect } from 'react-router';
import { Form, useActionData, useLoaderData } from 'react-router';
import { useState } from 'react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import { Icon } from '~/components/Icon';
import { getActiveEdition, getPricingTiers, getSiteConfig } from '~/lib/sanity.server';
import { createCheckoutSession } from '~/lib/stripe.server';
import { generateQRCode, generateAndSaveQRCode } from '~/lib/qrcode.server';
import { isFeatureEnabled } from '~/lib/feature-flags.server';
import { createRequestLogger } from '~/lib/logger.server';
import { getCSRFToken, verifyCSRFToken } from '~/lib/csrf.server';
import CSRFInput from '~/components/CSRFInput';

// List of available icon names in the Icon component
const availableIcons = [
  'bell', 'check', 'checkSimple', 'x', 'lightning', 'megaphone', 'target', 'chart', 'flag', 'trophy',
  'cloud', 'lightbulb', 'filter', 'refresh', 'clock', 'map', 'marker', 'warning', 'alert-triangle',
  'alert-circle', 'lock', 'users', 'document', 'search', 'settings', 'phone', 'calendar', 'utensils',
  'motorcycle', 'coffee', 'info', 'eye', 'wave', 'crown', 'camera', 'book', 'clipboard', 'mail',
  'award', 'rocket', 'cookie', 'database', 'ban', 'building', 'door', 'star', 'heart', 'diamond',
  'hourglass', 'trash', 'home', 'shield', 'money', 'chevron-left', 'chevron-right', 'book-open',
  'plus', 'send', 'loader', 'message-circle', 'check-circle', 'info-circle', 'arrow-left', 'cog',
  'mountain', 'road', 'tree', 'party', 'user', 'arrow-back', 'alert'
];

// Check if icon name is valid, return null if not
function getValidIconName(icon: string | null | undefined): string | null {
  if (!icon) return null;
  return availableIcons.includes(icon) ? icon : null;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const siteConfig = data?.siteConfig;
  const seoImage = siteConfig?.seoImage?.asset?.url;
  const seoTitle = siteConfig?.seoTitle || 'Deur Den Bocht - Motorrit Rally 2026';
  const registrationTitle = `Inschrijven voor ${siteConfig?.eventName || 'Deur Den Bocht'}`;
  const registrationDescription = `Schrijf je in voor de spectaculaire motorrit rally - ${siteConfig?.eventTagline || 'Een unieke motordag door België'}`;
  
  return [
    { title: registrationTitle },
    { name: 'description', content: registrationDescription },
    // Open Graph tags for social media sharing
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: registrationTitle },
    { property: 'og:description', content: registrationDescription },
    ...(seoImage ? [{ property: 'og:image', content: seoImage }] : []),
    { property: 'og:url', content: 'https://deurdenbochtmotorrit.be/registration' },
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: registrationTitle },
    { name: 'twitter:description', content: registrationDescription },
    ...(seoImage ? [{ name: 'twitter:image', content: seoImage }] : []),
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const edition = await getActiveEdition();
  const registrationEnabled = await isFeatureEnabled('registration-open');
  
  // Check both edition setting and feature flag
  if (!edition?.registrationOpen || !registrationEnabled) {
    return redirect('/');
  }

  const { supabaseAdmin } = await import('~/lib/supabase.server');

  // Fetch remaining data in parallel
  const [pricing, siteConfig, paperRoadbookEnabled, csrfToken] = await Promise.all([
    getPricingTiers(edition._id),
    getSiteConfig(),
    isFeatureEnabled('paper-roadbook-option'),
    getCSRFToken(request),
  ]);

  // Count current registrations (excluding admins)
  let registeredCount = 0;
  let spotsRemaining = null;
  let spotsPercentage = null;

  try {
    const { count, error } = await supabaseAdmin
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .filter('is_admin', 'eq', false); // Only count non-admin participants

    if (!error && count !== null) {
      registeredCount = count;
      
      if (siteConfig?.maxRegistrations) {
        spotsRemaining = Math.max(0, siteConfig.maxRegistrations - registeredCount);
        spotsPercentage = Math.round((registeredCount / siteConfig.maxRegistrations) * 100);
      }
    }
  } catch (error) {
    console.error('[registration] Error counting registrations:', error);
  }

  return { edition, pricing, siteConfig, paperRoadbookEnabled, csrfToken, registeredCount, spotsRemaining, spotsPercentage };
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('registration', 'Registration attempt initiated');

  try {
    // Verify CSRF token first
    const isValidToken = await verifyCSRFToken(request);
    if (!isValidToken) {
      await requestLogger.warn('registration', 'Registration failed: invalid CSRF token');
      return {
        error: 'Invalid form submission. Please try again.',
        status: 403
      };
    }

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
    const routePreference = formData.get('routePreference');
    const paperRoadbook = formData.get('paperRoadbook') === 'on';

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
      typeof rideType !== 'string' ||
      typeof routePreference !== 'string'
    ) {
      await requestLogger.warn('registration', 'Registration failed: missing required fields');
      return {  error: 'Alle velden zijn verplicht', status: 400 };
    }

    if (password.length < 6) {
      await requestLogger.warn('registration', 'Registration failed: password too short');
      return {  error: 'Wachtwoord moet minstens 6 karakters lang zijn', status: 400 };
    }

    if (!['with_meals', 'breakfast_only'].includes(formula)) {
      await requestLogger.warn('registration', 'Registration failed: invalid formula', { formula });
      return {  error: 'Ongeldige formule geselecteerd', status: 400 };
    }

    if (!['adventure', 'scenic'].includes(routePreference)) {
      await requestLogger.warn('registration', 'Registration failed: invalid route preference', { routePreference });
      return {  error: 'Ongeldige route voorkeur geselecteerd', status: 400 };
    }

    // Ride type is always 'free' - no guided rides offered

    // Check if max registrations limit is reached (excluding admins)
    const siteConfig = await getSiteConfig();
    if (siteConfig?.maxRegistrations) {
      const { count, error: countError } = await supabaseAdmin
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'participant'); // Only count regular participants, not admins

      if (!countError && count !== null && count >= siteConfig.maxRegistrations) {
        await requestLogger.warn('registration', 'Registration failed: max registrations reached', {
          currentCount: count,
          maxRegistrations: siteConfig.maxRegistrations
        });
        return {
          error: `Inschrijvingen zijn helaas vol. Maximum aantal deelnemers (${siteConfig.maxRegistrations}) is bereikt.`,
          status: 429
        };
      }
    }

    const { data: existing } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      await requestLogger.warn('registration', 'Registration failed: email already exists', {
        email: email.toLowerCase()
      });
      return {  error: 'Dit emailadres is al geregistreerd', status: 400 };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      await requestLogger.error('registration', 'Registration failed: auth creation error', authError as Error, {
        email: email.toLowerCase()
      });
      return {  error: 'Er ging iets mis bij het aanmaken van je account. Probeer opnieuw.', status: 500 };
    }

    const qrCode = generateQRCode();
    const participantId = authData.user.id;
    const qrCodeUrl = `${new URL(request.url).origin}/check-in/${participantId}`;
    
    // Get pricing from Sanity in parallel
    const edition = await getActiveEdition();
    const pricing = await getPricingTiers(edition._id);
    const selectedTier = pricing.find((tier: any) => 
      (formula === 'with_meals' && tier.price === 30) || 
      (formula === 'breakfast_only' && tier.price === 20)
    );
    
    if (!selectedTier) {
      await requestLogger.error('registration', 'Registration failed: pricing tier not found', undefined, { 
        formula,
        userId: authData.user.id
      });
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: 'Prijsinformatie niet beschikbaar. Probeer later opnieuw.', status: 500 };
    }
    
    const amount = selectedTier.price; // Price in euros from Sanity

    const { data: participant, error: dbError } = await supabaseAdmin
      .from('participants')
      .insert({
        id: participantId,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone,
        motorcycle_brand: motorcycleBrand,
        motorcycle_model: motorcycleModel,
        license_plate: licensePlate.toUpperCase(),
        formula,
        ride_type: rideType,
        route_preference: routePreference,
        paper_roadbook: paperRoadbook,
        amount_paid: amount,
        qr_code: qrCode,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (dbError || !participant) {
      await requestLogger.error('registration', 'Registration failed: database insert error', dbError as Error, {
        userId: authData.user.id,
        email: email.toLowerCase()
      });
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {  error: 'Er ging iets mis bij het registreren. Probeer opnieuw.', status: 500 };
    }

    try {
      const qrCodeImageUrl = await generateAndSaveQRCode(qrCodeUrl, participant.id);
      
      await supabaseAdmin
        .from('participants')
        .update({ qr_code_image_url: qrCodeImageUrl })
        .eq('id', participant.id);
    } catch (qrError) {
      await requestLogger.error('registration', 'QR code generation failed', qrError as Error, {
        participantId: participant.id
      });
    }

    const bypassPayment = process.env.BYPASS_PAYMENT === 'true';
    
    if (bypassPayment) {
      await supabaseAdmin
        .from('participants')
        .update({ payment_status: 'completed' })
        .eq('id', participant.id);
      
      const { createUserSession } = await import('~/lib/session.server');
      await requestLogger
        .withUser(participant.id)
        .info('registration', 'Registration successful with bypassed payment', {
          participantId,
          email: email.toLowerCase(),
          formula
        });
      return createUserSession(participant.id, '/dashboard');
    }

    try {
      const host = new URL(request.url).host;
      const session = await createCheckoutSession({
        email: email.toLowerCase(),
        amount: amount, // Already in euros from line 132
        host,
        metadata: {
          participantId: participant.id,
          formula,
          rideType,
          qrCode,
        },
      });

      console.info('[registration] action success', { participantId });
      return {  checkoutUrl: session.url };
    } catch (error) {
      console.error('[registration] stripe error', error);
      await supabaseAdmin
        .from('participants')
        .delete()
        .eq('id', participant.id);

      return {  error: 'Er ging iets mis bij het aanmaken van de betaling. Probeer opnieuw.', status: 500 };
    }
  } catch (error) {
    console.error('[registration] action error', error);
    return { error: 'Onverwachte fout', status: 500 };
  }
}

export default function Registration() {
  const { csrfToken, edition, pricing, siteConfig, paperRoadbookEnabled, registeredCount, spotsRemaining, spotsPercentage } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const [selectedFormula, setSelectedFormula] = useState<string>('with_meals');

  // Redirect to Stripe if we have a checkout URL
  if (actionData && 'checkoutUrl' in actionData && actionData.checkoutUrl) {
    window.location.href = actionData.checkoutUrl;
  }

  const isFull = spotsRemaining === 0;
  const isAlmostFull = spotsRemaining !== null && spotsRemaining <= siteConfig?.maxRegistrations * 0.1; // Less than 10% spots remaining

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-grow bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Registration Capacity Banner */}
          {siteConfig?.maxRegistrations && spotsRemaining !== null && (
            <div className={`mb-6 p-4 rounded-sm border-l-4 ${
              isFull 
                ? 'bg-red-50 border-red-500 text-red-900' 
                : isAlmostFull 
                ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
                : 'bg-blue-50 border-blue-500 text-blue-900'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {isFull 
                      ? 'Inschrijvingen vol'
                      : isAlmostFull
                      ? 'Weinig plekken beschikbaar'
                      : 'Plekken beschikbaar'
                    }
                  </p>
                  <p className="text-sm mt-1">
                    {isFull 
                      ? `Helaas zijn alle ${siteConfig.maxRegistrations} plekken bezet.`
                      : `${spotsRemaining} van ${siteConfig.maxRegistrations} plekken beschikbaar`
                    }
                  </p>
                </div>
                <div className="text-right flex flex-col items-center gap-2">
                  <svg className="w-16 h-16" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.2" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      strokeDasharray={`${(spotsPercentage! * 282.7) / 100} 282.7`}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                    <text x="50" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" fill="currentColor">
                      {spotsPercentage}%
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-sm shadow-lg p-8">
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
              <CSRFInput token={csrfToken} />
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                    placeholder="1-ABC-123"
                  />
                </div>
              </div>

              {/* Formula Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Kies je formule *</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {pricing.map((tier: any) => {
                    const iconName = getValidIconName(tier.icon);
                    return (
                      <label
                        key={tier._id}
                        className={`relative flex cursor-pointer rounded-sm border p-4 focus:outline-none ${
                          selectedFormula === (tier.price === 30 ? 'with_meals' : 'breakfast_only')
                            ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="formula"
                          value={tier.price === 30 ? 'with_meals' : 'breakfast_only'}
                          className="sr-only"
                          onChange={(e) => setSelectedFormula(e.target.value)}
                          checked={selectedFormula === (tier.price === 30 ? 'with_meals' : 'breakfast_only')}
                        />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-center justify-between">
                            {iconName && <Icon name={iconName} className="w-8 h-8 mb-2 text-primary-600" />}
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
                    );
                  })}
                </div>
              </div>

              {/* Route Preference Selection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Kies je route voorkeur *</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Kies hoe je de rit wil beleven: met optionele rally zones voor een avontuurlijke ervaring, of de complete route zonder uitdagingen.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer rounded-sm border p-4 focus:outline-none border-primary-600 ring-2 ring-primary-600 bg-primary-50">
                    <input
                      type="radio"
                      name="routePreference"
                      value="adventure"
                      className="sr-only"
                      defaultChecked
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🎯</span>
                        <span className="text-xs font-semibold text-primary-700 bg-primary-100 px-2 py-1 rounded-full">AANBEVOLEN</span>
                      </div>
                      <span className="block text-lg font-semibold text-gray-900 mb-2">Adventure Track</span>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li className="flex items-start">
                          <span className="text-primary-600 mr-1">✓</span>
                          Complete route met 4 optionele rally zones
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-600 mr-1">✓</span>
                          Check-in via QR codes bij elke zone
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-600 mr-1">✓</span>
                          Deel foto's en verhalen met de community
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary-600 mr-1">✓</span>
                          Ontgrendel achievements
                        </li>
                      </ul>
                    </div>
                  </label>

                  <label className="relative flex cursor-pointer rounded-sm border p-4 focus:outline-none border-gray-300 hover:border-gray-400">
                    <input
                      type="radio"
                      name="routePreference"
                      value="scenic"
                      className="sr-only"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🗺️</span>
                      </div>
                      <span className="block text-lg font-semibold text-gray-900 mb-2">Scenic Route</span>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li className="flex items-start">
                          <span className="text-gray-400 mr-1">✓</span>
                          Volledige uitgewerkte route zonder stops
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-400 mr-1">✓</span>
                          Geen check-ins of QR codes
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-400 mr-1">✓</span>
                          Rij in je eigen tempo
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-400 mr-1">✓</span>
                          Focus op de rit zelf
                        </li>
                      </ul>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ride Type - Hidden, always free */}
              <input type="hidden" name="rideType" value="free" />

              {/* Paper Roadbook Option */}
              {paperRoadbookEnabled && (
                <div className="pt-6 border-t">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Extra optie</h2>
                  <div className="flex items-start">
                    <input
                      id="paperRoadbook"
                      name="paperRoadbook"
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="paperRoadbook" className="ml-3 text-sm text-gray-700">
                      <span className="font-semibold">Ik wil een papieren roadbook ontvangen</span>
                      <p className="text-gray-600 mt-1">
                        Naast de digitale versie ontvang je een fysiek roadbook met alle route-informatie en rally zones.
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Consent Checkboxes */}
              <div className="pt-6 border-t space-y-4">
                <div className="flex items-start">
                  <input
                    id="termsConsent"
                    name="termsConsent"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="termsConsent" className="ml-3 text-sm text-gray-700">
                    Ik heb de{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                      Algemene Voorwaarden
                    </a>
                    {' '}gelezen en ga hiermee akkoord *
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="privacyConsent"
                    name="privacyConsent"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="privacyConsent" className="ml-3 text-sm text-gray-700">
                    Ik heb het{' '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                      Privacybeleid
                    </a>
                    {' '}gelezen en ga akkoord met de verwerking van mijn persoonsgegevens *
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="dataProcessingConsent"
                    name="dataProcessingConsent"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="dataProcessingConsent" className="ml-3 text-sm text-gray-700">
                    Ik geef toestemming voor het verzamelen en verwerken van mijn gegevens 
                    (inclusief GPS-locatie, foto's) voor dit evenement en ga akkoord met het 
                    delen van foto's in de galerij *
                  </label>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold py-4 px-6 rounded-sm text-lg transition-colors"
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

      <Footer siteConfig={siteConfig} edition={edition} />
    </div>
  );
}
