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

    if (bodyAction === 'subscribe') {
      if (!subscription?.endpoint) {
        return { error: 'Invalid subscription' };
      }
      
      // Validate subscription has required keys
      if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
        console.error('Invalid subscription keys:', { 
          hasp256dh: !!subscription.keys?.p256dh,
          hasAuth: !!subscription.keys?.auth,
        });
        return { error: 'Invalid subscription keys' };
      }
      
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
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: true, keys: subscription.keys })
            .eq('endpoint', subscription.endpoint);
        } else {
          console.error('Subscription error:', error);
          return { error: error.message };
        }
      }

      console.info('Push subscription created/updated for user:', userId);
      return { success: true, message: 'Subscribed to push notifications' };
    }

    if (bodyAction === 'unsubscribe') {
      await supabaseAdmin
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('participant_id', userId);

      return { success: true };
    }

    return { error: 'Invalid action' };
  } catch (err) {
    console.error('Push subscribe error:', err);
    return { error: 'Internal server error' };
  }
}
