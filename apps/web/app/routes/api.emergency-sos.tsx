import type { ActionFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  console.log('Emergency SOS endpoint called');
  
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const userId = await requireUserId(request);
    console.log('User ID:', userId);
    
    const body = await request.json();
    console.log('Request body:', body);
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      console.log('Missing coordinates');
      return new Response(JSON.stringify({ error: 'Latitude and longitude are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Inserting emergency SOS for participant:', userId, 'at', latitude, longitude);

    // Insert emergency SOS alert
    const { data: alert, error } = await supabaseAdmin
      .from('emergency_sos')
      .insert({
        participant_id: userId,
        location_lat: latitude,
        location_lng: longitude,
        status: 'active',
        message: 'Noodoproep via app',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating emergency SOS:', error);
      return new Response(JSON.stringify({ error: 'Failed to create emergency alert', details: error }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Emergency SOS created successfully:', alert);

    // TODO: Send push notifications to admins
    // TODO: Send SMS to emergency contacts

    return new Response(JSON.stringify({ success: true, alert }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Emergency SOS error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
