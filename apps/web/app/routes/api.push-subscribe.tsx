import type { ActionFunctionArgs } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  try {
    const body = await request.json();
    const { action: bodyAction, subscription } = body;

    console.info('[api.push-subscribe] received request', { action: bodyAction, userId, hasSubscription: !!subscription });

    if (bodyAction === 'subscribe') {
      if (!subscription?.endpoint) {
        console.error('[api.push-subscribe] missing endpoint', subscription);
        return { error: 'Invalid subscription' };
      }
      
      // Validate subscription has required keys
      if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
        console.error('[api.push-subscribe] Invalid subscription keys:', { 
          hasp256dh: !!subscription.keys?.p256dh,
          hasAuth: !!subscription.keys?.auth,
        });
        return { error: 'Invalid subscription keys' };
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
          console.info('[api.push-subscribe] subscription exists, updating', { userId });
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: true, keys: subscription.keys })
            .eq('endpoint', subscription.endpoint);
        } else {
          console.error('[api.push-subscribe] Subscription error:', error);
          return { error: error.message };
        }
      }

      console.info('[api.push-subscribe] subscription successful', { userId });
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

      return { success: true };
    }

    return { error: 'Invalid action' };
  } catch (err) {
    console.error('Push subscribe error:', err);
    return { error: 'Internal server error' };
  }
}
