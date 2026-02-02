import type { ActionFunctionArgs } from 'react-router';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const { requireUserId } = await import('~/lib/session.server');
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);
  
  if (request.method !== 'POST') {
    await requestLogger.warn('push', 'Push subscribe rejected: invalid method');
    return { error: 'Methode niet toegestaan' };
  }

  try {
    const body = await request.json();
    const { action: bodyAction, subscription } = body;

    await requestLogger.info('push', 'Push subscription request received', { 
      action: bodyAction,
      hasSubscription: !!subscription 
    });

    if (bodyAction === 'subscribe') {
      if (!subscription?.endpoint) {
        await requestLogger.warn('push', 'Subscribe failed: missing endpoint');
        return { error: 'Ongeldige abonnement' };
      }
      
      // Validate subscription has required keys
      if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
        await requestLogger.warn('push', 'Subscribe failed: invalid subscription keys', {
          hasp256dh: !!subscription.keys?.p256dh,
          hasAuth: !!subscription.keys?.auth
        });
        return { error: 'Ongeldige abonnementsleutels' };
      }
      
      console.info('[api.push-subscribe] storing subscription', { 
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        userId,
      });

      // Store subscription
      const { error } = await supabaseAdmin.from('push_subscriptions').insert({
        participant_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        is_active: true,
      });

      if (error) {
        // If already exists, update it
        if (error.code === '23505') {
          await requestLogger.info('push', 'Subscription already exists, updating');
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: true, keys: subscription.keys })
            .eq('endpoint', subscription.endpoint);
        } else {
          await requestLogger.error('push', 'Push subscription failed', error as Error);
          return { error: error.message };
        }
      }

      await requestLogger.info('push', 'Push subscription successful');
      return { success: true, message: 'Subscribed to push notifications' };
    }

    if (bodyAction === 'unsubscribe') {
      const { endpoint } = body;
      if (endpoint) {
        // Unsubscribe by endpoint (more reliable)
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', endpoint);
      } else {
        // Fallback: unsubscribe by participant_id
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('participant_id', userId);
      }

      await requestLogger.info('push', 'Push unsubscribe successful', { byEndpoint: !!endpoint });
      return { success: true };
    }

    await requestLogger.warn('push', 'Invalid push action', { action: bodyAction });
    return { error: 'Ongeldige actie' };
  } catch (err) {
    await requestLogger.error('push', 'Push subscribe error', err as Error);
    return { error: 'Interne serverfout' };
  }
}
