import type { ActionFunctionArgs } from 'react-router';

import { verifyWebhookSignature } from '~/lib/stripe.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  console.info('[api.webhook] action start', { method: request.method });

  if (request.method !== 'POST') {
    return {  error: 'Method not allowed',  status: 405 };
  }

  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return {  error: 'No signature', status: 400 };
  }

  const payload = await request.text();

  try {
    const event = await verifyWebhookSignature(payload, signature);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      const participantId = session.metadata?.participantId;
      const stripePaymentId = session.payment_intent;

      if (participantId) {
        // Update participant payment status
        const { error } = await supabaseAdmin
          .from('participants')
          .update({
            payment_status: 'completed',
            stripe_payment_id: stripePaymentId,
          })
          .eq('id', participantId);

        if (error) {
          console.error('Failed to update participant:', error);
          return {  error: 'Database update failed', status: 500 };
        }

        // TODO: Send confirmation email here
        console.info('[api.webhook] payment completed', { participantId });
      }
    }

    return {  received: true };
  } catch (error) {
    console.error('[api.webhook] action error', error);
    return {  error: 'Webhook signature verification failed', status: 400 };
  }
}
