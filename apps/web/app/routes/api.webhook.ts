import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import Stripe from 'stripe';
import { supabase } from '~/lib/supabase.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function action({ request }: ActionFunctionArgs) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      const participantId = session.metadata?.participantId;

      if (!participantId) {
        console.error('No participantId in session metadata');
        return json({ error: 'Missing participant ID' }, { status: 400 });
      }

      // Update participant payment status
      const { error } = await supabase
        .from('participants')
        .update({
          payment_status: 'completed',
          stripe_payment_id: session.payment_intent as string,
        })
        .eq('id', participantId);

      if (error) {
        console.error('Error updating participant:', error);
        return json({ error: 'Failed to update participant' }, { status: 500 });
      }

      console.log(`✅ Payment completed for participant ${participantId}`);
    }
  }

  return json({ received: true });
}
