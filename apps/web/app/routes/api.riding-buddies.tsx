import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { data } from 'react-router';
import { createRequestLogger } from '~/lib/logger.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireUserId } = await import('~/lib/session.server');
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    await requestLogger.warn('buddies', 'Buddy search failed: missing email parameter');
    return data({ error: 'Email parameter required' }, { status: 400 });
  }

  await requestLogger.info('buddies', 'Searching for buddy by email', { searchEmail: email });

  // Search for participant by email (excluding self)
  const { data: participant, error } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, motorcycle_brand, motorcycle_model, profile_photo_url')
    .eq('email', email.toLowerCase().trim())
    .neq('id', userId)
    .single();

  if (error || !participant) {
    await requestLogger.info('buddies', 'Buddy search: no participant found', { searchEmail: email });
    return data({ error: 'Geen deelnemer gevonden met dit e-mailadres' }, { status: 404 });
  }

  await requestLogger.info('buddies', 'Buddy search successful', {
    searchEmail: email,
    foundParticipantId: participant.id
  });

  // Check if already buddies or pending request
  const { data: existingBuddy } = await supabaseAdmin
    .from('riding_buddies')
    .select('id, status')
    .or(`and(participant_id.eq.${userId},buddy_id.eq.${participant.id}),and(participant_id.eq.${participant.id},buddy_id.eq.${userId})`)
    .single();

  return data({ 
    participant,
    alreadyBuddy: existingBuddy?.status === 'accepted',
    isPending: existingBuddy?.status === 'pending',
    status: existingBuddy?.status 
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireUserId } = await import('~/lib/session.server');
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  const formData = await request.formData();
  const action = formData.get('action');
  const buddyId = formData.get('buddyId');

  if (!buddyId || typeof buddyId !== 'string') {
    await requestLogger.warn('buddies', 'Buddy action failed: missing buddy ID', { action });
    return data({ error: 'Buddy ID is verplicht' }, { status: 400 });
  }

  if (action === 'add') {
    await requestLogger.info('buddies', 'Sending buddy request', { buddyId });
    
    // Send buddy request (pending status)
    const { error } = await supabaseAdmin
      .from('riding_buddies')
      .insert({
        participant_id: userId,
        buddy_id: buddyId,
        status: 'pending',
      });

    if (error) {
      await requestLogger.error('buddies', 'Buddy request failed', error as Error, { buddyId });
      return data({ error: 'Kon verzoek niet versturen' }, { status: 500 });
    }

    await requestLogger.info('buddies', 'Buddy request sent successfully', { buddyId });

    // Send push notification to buddy
    try {
      const { data: requester } = await supabaseAdmin
        .from('participants')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('participant_id', buddyId)
        .eq('is_active', true);

      if (subscriptions && subscriptions.length > 0) {
        const { sendPushNotificationWithHistory } = await import('~/lib/push-notifications-enhanced.server');
        
        await sendPushNotificationWithHistory(
          subscriptions,
          {
            title: 'Nieuw Naftgenoot Verzoek 🏍️',
            body: `${requester?.first_name} ${requester?.last_name} wil je naftgenoot worden!`,
            tag: 'buddy-request',
          },
          {
            title: 'Nieuw Naftgenoot Verzoek 🏍️',
            body: `${requester?.first_name} ${requester?.last_name} wil je naftgenoot worden!`,
            eventType: 'buddy_request',
            targetType: 'single',
            sentBy: userId,
            eventData: { requester_id: userId },
          }
        );
      }
    } catch (notifError) {
      console.error('[riding-buddies] Failed to send request notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    return data({ success: true, message: 'Verzoek verstuurd!' });
  } else if (action === 'accept') {
    // Accept buddy request
    const { error } = await supabaseAdmin
      .from('riding_buddies')
      .update({ status: 'accepted' })
      .eq('participant_id', buddyId)
      .eq('buddy_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error accepting buddy request:', error);
      return data({ error: 'Kon verzoek niet accepteren' }, { status: 500 });
    }

    // Send push notification to requester
    try {
      const { data: accepter } = await supabaseAdmin
        .from('participants')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('participant_id', buddyId)
        .eq('is_active', true);

      if (subscriptions && subscriptions.length > 0) {
        const { sendPushNotificationWithHistory } = await import('~/lib/push-notifications-enhanced.server');
        
        await sendPushNotificationWithHistory(
          subscriptions,
          {
            title: 'Naftgenoot Geaccepteerd! 🎉',
            body: `${accepter?.first_name} ${accepter?.last_name} heeft je verzoek geaccepteerd!`,
            tag: 'buddy-accepted',
          },
          {
            title: 'Naftgenoot Geaccepteerd! 🎉',
            body: `${accepter?.first_name} ${accepter?.last_name} heeft je verzoek geaccepteerd!`,
            eventType: 'buddy_accepted',
            targetType: 'single',
            sentBy: userId,
            eventData: { accepter_id: userId },
          }
        );
      }
    } catch (notifError) {
      console.error('[riding-buddies] Failed to send acceptance notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    return data({ success: true, message: 'Rijdmaatje toegevoegd!' });
  } else if (action === 'reject') {
    // Reject buddy request
    const { error } = await supabaseAdmin
      .from('riding_buddies')
      .delete()
      .eq('participant_id', buddyId)
      .eq('buddy_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error rejecting buddy request:', error);
      return data({ error: 'Kon verzoek niet afwijzen' }, { status: 500 });
    }

    return data({ success: true, message: 'Verzoek afgewezen' });
  } else if (action === 'remove') {
    // Remove buddy (works in both directions)
    const { error } = await supabaseAdmin
      .from('riding_buddies')
      .delete()
      .or(`and(participant_id.eq.${userId},buddy_id.eq.${buddyId}),and(participant_id.eq.${buddyId},buddy_id.eq.${userId})`);

    if (error) {
      console.error('Error removing buddy:', error);
      return data({ error: 'Kon buddy niet verwijderen' }, { status: 500 });
    }

    return data({ success: true, message: 'Buddy verwijderd' });
  }

  return data({ error: 'Ongeldige actie' }, { status: 400 });
}
