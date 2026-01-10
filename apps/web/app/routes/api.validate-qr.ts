import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { supabase } from '~/lib/supabase.server';

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

    // Look up participant in database
    const { data: participant, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error || !participant) {
      return json({ 
        valid: false, 
        error: 'Participant niet gevonden',
        details: 'Deze QR code is niet gekoppeld aan een registratie.'
      }, { status: 404 });
    }

    // Verify email matches (additional security check)
    if (email && participant.email !== email) {
      return json({ 
        valid: false, 
        error: 'QR code verificatie mislukt',
        details: 'De gegevens komen niet overeen.'
      }, { status: 400 });
    }

    // Check payment status
    const isPaid = participant.payment_status === 'completed' || 
                   participant.payment_status === 'paid';

    return json({
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
    });

  } catch (error) {
    console.error('QR validation error:', error);
    return json({ 
      valid: false,
      error: 'Server fout',
      details: 'Er is een fout opgetreden bij het valideren van de QR code.'
    }, { status: 500 });
  }
}

// Also allow GET for testing
export async function loader() {
  return json({ 
    message: 'QR Validation API',
    usage: 'POST JSON with { qrData: "..." } to validate a QR code'
  });
}
