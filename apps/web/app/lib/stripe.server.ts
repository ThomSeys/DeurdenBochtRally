import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover' as any,
});

export async function createCheckoutSession({
  email,
  amount,
  metadata,
  host,
}: {
  email: string;
  amount: number;
  metadata: Record<string, string>;
  host: string;
}) {
  const baseUrl = `https://${host}`;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'bancontact', 'ideal'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Deur Den Bocht - Rally Registration',
            description: metadata.formula === 'with_meals' 
              ? 'Registration with all meals included' 
              : 'Registration with breakfast only',
          },
          unit_amount: amount * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/registration/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/registration`,
    customer_email: email,
    metadata,
  });

  return session;
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
