import type { ActionFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sendEmail } from '~/lib/email.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.warn('gdpr', 'Account deletion initiated');

  try {
    // Get participant info for confirmation email
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (!participant) {
      await requestLogger.error('gdpr', 'Account deletion failed: participant not found');
      return Response.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Step 1: Delete from dependent tables first (foreign key constraints)
    
    // Delete achievements
    await supabaseAdmin
      .from('participant_achievements')
      .delete()
      .eq('participant_id', userId);

    // Delete zone submissions
    await supabaseAdmin
      .from('rally_zone_submissions')
      .delete()
      .eq('participant_id', userId);

    // Delete rally submission
    await supabaseAdmin
      .from('rally_submissions')
      .delete()
      .eq('participant_id', userId);

    // Step 2: Delete the participant record
    const { error: deleteError } = await supabaseAdmin
      .from('participants')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      await requestLogger.error('gdpr', 'Account deletion failed: database error', deleteError as Error, {
        email: participant.email
      });
      return Response.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    await requestLogger.warn('gdpr', 'Account successfully deleted', {
      email: participant.email,
      firstName: participant.first_name,
      lastName: participant.last_name
    });

    // Step 3: Send confirmation email
    try {
      await sendEmail({
        to: participant.email,
        subject: 'Je Deur Den Bocht account is verwijderd',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Account Verwijderd</h1>
                </div>
                <div class="content">
                  <p>Beste ${participant.first_name} ${participant.last_name},</p>
                  
                  <p>Je account bij Deur Den Bocht is succesvol verwijderd conform jouw verzoek (GDPR Art. 17 - Recht op vergetelheid).</p>
                  
                  <h3>Wat is verwijderd:</h3>
                  <ul>
                    <li>Persoonlijke gegevens (naam, email, telefoon, adres)</li>
                    <li>Motorgegevens (merk, model, kenteken)</li>
                    <li>Rally inzendingen en scores</li>
                    <li>GPS-locaties en zone submissions</li>
                    <li>Achievements en foto's</li>
                    <li>Ride stories en reacties</li>
                  </ul>
                  
                  <h3>Financiële gegevens:</h3>
                  <p>Betalingsgegevens worden bewaard door Stripe (onze betalingsprovider) conform wettelijke verplichtingen voor 7 jaar. Deze gegevens bevatten geen persoonlijk identificeerbare informatie meer na verwijdering van je account.</p>
                  
                  <h3>Toekomstige deelname:</h3>
                  <p>Je kunt je in de toekomst opnieuw registreren voor Deur Den Bocht evenementen. Je eerdere gegevens zijn dan niet meer beschikbaar.</p>
                  
                  <p>Heb je vragen over deze verwijdering? Neem contact op via <a href="mailto:vzwddb@gmail.com">vzwddb@gmail.com</a></p>
                  
                  <p>Bedankt voor je deelname aan Deur Den Bocht!</p>
                </div>
                <div class="footer">
                  <p>Deur Den Bocht Rally Event<br>
                  Privacy vragen? <a href="mailto:vzwddb@gmail.com">vzwddb@gmail.com</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('[delete-account] Failed to send confirmation email:', emailError);
      // Continue anyway - account is deleted
    }

    console.info('[delete-account] Account deleted successfully:', userId);

    return Response.json({ 
      success: true, 
      message: 'Account successfully deleted' 
    });

  } catch (error) {
    console.error('[delete-account] Error:', error);
    return Response.json({ 
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
