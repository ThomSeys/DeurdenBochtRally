import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { supabase } from '~/lib/supabase.server';

// Handle GET requests (from QR code scans with URL)
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const participantId = url.searchParams.get('id');
  const email = url.searchParams.get('email');

  if (!participantId) {
    return redirect('/scanner?error=invalid-qr');
  }

  const result = await validateAndCheckIn(participantId, email);
  
  if (result.valid) {
    // Redirect to success page with participant data
    const params = new URLSearchParams({
      name: result.participant?.name || '',
      email: result.participant?.email || '',
      status: result.participant?.isPaid ? 'paid' : 'unpaid',
      checkedIn: 'true'
    });
    return redirect(`/check-in-success?${params.toString()}`);
  }
  
  return redirect(`/scanner?error=${encodeURIComponent(result.error || 'validation-failed')}`);
}

// Handle POST requests (from manual input)
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { qrData } = await request.json();

    if (!qrData || typeof qrData !== 'string') {
      return json({ error: 'Invalid QR data' }, { status: 400 });
    }

    // Parse QR data - format: "Naam: X Y\nEmail: x@y.com\nID: uuid\nBetaald: Ja/Nee"
    const lines = qrData.split('\n');
    const dataMap: Record<string, string> = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        dataMap[key.trim()] = valueParts.join(':').trim();
      }
    });

    const participantId = dataMap['ID'];
    const email = dataMap['Email'];

    if (!participantId) {
      return json({ 
        valid: false, 
        error: 'Ongeldig QR code formaat' 
      }, { status: 400 });
    }

    return await validateAndCheckIn(participantId, email);

  } catch (error) {
    console.error('QR validation error:', error);
    return json({ 
      valid: false,
      error: 'Server fout',
      details: 'Er is een fout opgetreden bij het valideren van de QR code.'
    }, { status: 500 });
  }
}

// Shared validation and check-in logic
async function validateAndCheckIn(participantId: string, email: string | null) {
  try {
    // Look up participant in database
    const { data: participant, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error || !participant) {
      return { 
        valid: false, 
        error: 'Participant niet gevonden',
        details: 'Deze QR code is niet gekoppeld aan een registratie.'
      };
    }

    // Verify email matches (additional security check)
    if (email && participant.email !== email) {
      return { 
        valid: false, 
        error: 'QR code verificatie mislukt',
        details: 'De gegevens komen niet overeen.'
      };
    }

    // Update checked_in flag
    const { error: updateError } = await supabase
      .from('participants')
      .update({ 
        checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', participantId);

    if (updateError) {
      console.error('Error updating check-in status:', updateError);
    }

    // Check payment status
    const isPaid = participant.payment_status === 'completed' || 
                   participant.payment_status === 'paid';

    return {
      valid: true,
      participant: {
        id: participant.id,
        name: `${participant.first_name} ${participant.last_name}`,
        email: participant.email,
        phone: participant.phone,
        motorcycle_brand: participant.motorcycle_brand,
        motorcycle_model: participant.motorcycle_model,
        isPaid,
        paymentStatus: participant.payment_status,
        allowEarlyAccess: participant.allow_early_access,
      },
      message: isPaid 
        ? '✅ Deelnemer geverifieerd en betaald' 
        : '⚠️ Deelnemer geregistreerd maar niet betaald',
    };
  } catch (error) {
    console.error('Validation error:', error);
    return { 
      valid: false,
      error: 'Server fout',
      details: 'Er is een fout opgetreden bij het valideren.'
    };
  }
}
