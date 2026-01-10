import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string>
) {
  return await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'eur',
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

export async function createCheckoutSession(
  participantId: string,
  email: string,
  formula: 'with_meals' | 'breakfast_only'
) {
  const amount = formula === 'with_meals' ? 20 : 10;
  
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'bancontact', 'ideal'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Deur Den Bocht - Rally Registration',
            description: formula === 'with_meals' 
              ? 'Full package: Breakfast, Lunch & Dinner' 
              : 'Basic package: Breakfast only',
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.APP_URL}/registration/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/registration`,
    customer_email: email,
    metadata: {
      participantId,
      formula,
    },
  });
}

export async function createStripeCheckoutSession(options: {
  participantId: string;
  email: string;
  name: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'bancontact', 'ideal'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Deur Den Bocht - Rally Inschrijving',
            description: `Inschrijving voor ${options.name}`,
          },
          unit_amount: options.amount * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    customer_email: options.email,
    metadata: {
      participantId: options.participantId,
    },
  });

  return session.url || options.cancelUrl;
}
