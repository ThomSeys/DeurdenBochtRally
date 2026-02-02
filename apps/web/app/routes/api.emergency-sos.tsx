import type { ActionFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const requestLogger = createRequestLogger(request);
  await requestLogger.critical('emergency', 'Emergency SOS endpoint called');
  
  if (request.method !== 'POST') {
    await requestLogger.warn('emergency', 'SOS rejected: invalid method', { method: request.method });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const userId = await requireUserId(request);
    const userLogger = requestLogger.withUser(userId);
    
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      await userLogger.error('emergency', 'SOS failed: missing coordinates', undefined, { body });
      return new Response(JSON.stringify({ error: 'Latitude and longitude are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await userLogger.critical('emergency', `Creating emergency SOS alert ${ 
      latitude }, ${
      longitude 
    }`);

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
      await userLogger.critical('emergency', 'Failed to create emergency SOS', error as Error, {
        latitude,
        longitude
      });
      return new Response(JSON.stringify({ error: 'Failed to create emergency alert', details: error }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await userLogger.critical('emergency', `Emergency SOS alert created successfully ${ 
      alert.id }, ${
      latitude }, ${
      longitude 
    }`);

    // TODO: Send push notifications to admins
    // TODO: Send SMS to emergency contacts

    return new Response(JSON.stringify({ success: true, alert }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    await requestLogger.critical('emergency', 'Emergency SOS failed with exception', error as Error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
