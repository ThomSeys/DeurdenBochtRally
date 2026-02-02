import type { ActionFunctionArgs } from 'react-router';

import { verifyWebhookSignature } from '~/lib/stripe.server';
import { sendEmail, paymentConfirmationEmail, registrationConfirmationEmail } from '~/lib/email.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  const requestLogger = createRequestLogger(request);
  
  await requestLogger.info('payment', 'Webhook received', { method: request.method });

  if (request.method !== 'POST') {
    await requestLogger.warn('payment', 'Webhook rejected: invalid method', { method: request.method });
    return {  error: 'Methode niet toegestaan',  status: 405 };
  }

  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    await requestLogger.warn('payment', 'Webhook rejected: missing signature');
    return {  error: 'Geen handtekening', status: 400 };
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
          await requestLogger.error('payment', 'Webhook failed: participant not found', fetchError as Error, {
            participantId,
            eventType: event.type
          });
          return {  error: 'Deelnemer niet gevonden', status: 404 };
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
          await requestLogger.error('payment', 'Webhook failed: database update error', error as Error, {
            participantId,
            stripePaymentId
          });
          return {  error: 'Databaseupdate mislukt', status: 500 };
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

        await requestLogger
          .withUser(participantId)
          .info('payment', 'Payment completed and confirmation emails sent', {
            participantId,
            stripePaymentId,
            amount: session.amount_total / 100,
            eventType: event.type
          });
      }
    }

    return {  received: true };
  } catch (error) {
    await requestLogger.error('payment', 'Webhook signature verification failed', error as Error);
    return {  error: 'Webhookhandtekeningverificatie mislukt', status: 400 };
  }
}
