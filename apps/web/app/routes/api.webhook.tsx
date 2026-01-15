import type { ActionFunctionArgs } from 'react-router';

import { verifyWebhookSignature } from '~/lib/stripe.server';
import { sendEmail, paymentConfirmationEmail, registrationConfirmationEmail } from '~/lib/email.server';

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  
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
        // Get participant details
        const { data: participant, error: fetchError } = await supabaseAdmin
          .from('participants')
          .select('*')
          .eq('id', participantId)
          .single();

        if (fetchError || !participant) {
          console.error('Failed to fetch participant:', fetchError);
          return {  error: 'Participant not found', status: 404 };
        }

        // Update participant payment status
        const { error } = await supabaseAdmin
          .from('participants')
          .update({
            payment_status: 'completed',
            stripe_payment_id: stripePaymentId,
            amount_paid: session.amount_total / 100, // Convert cents to euros
          })
          .eq('id', participantId);

        if (error) {
          console.error('Failed to update participant:', error);
          return {  error: 'Database update failed', status: 500 };
        }

        // Send payment confirmation email
        const paymentEmail = paymentConfirmationEmail({
          ...participant,
          amount_paid: session.amount_total / 100,
          payment_intent_id: stripePaymentId,
        });
        
        await sendEmail({
          to: participant.email,
          ...paymentEmail,
        });

        // Log email
        await supabaseAdmin.from('email_logs').insert({
          participant_id: participantId,
          email_type: 'payment',
          recipient_email: participant.email,
          subject: paymentEmail.subject,
        });

        // Send registration confirmation with QR code
        const regEmail = registrationConfirmationEmail({
          ...participant,
          qr_code_image_url: participant.qr_code_image_url || undefined,
        });
        await sendEmail({
          to: participant.email,
          ...regEmail,
        });

        // Log email
        await supabaseAdmin.from('email_logs').insert({
          participant_id: participantId,
          email_type: 'registration',
          recipient_email: participant.email,
          subject: regEmail.subject,
        });

        console.info('[api.webhook] payment completed & emails sent', { participantId });
      }
    }

    return {  received: true };
  } catch (error) {
    console.error('[api.webhook] action error', error);
    return {  error: 'Webhook signature verification failed', status: 400 };
  }
}
