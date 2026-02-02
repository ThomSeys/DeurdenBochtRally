/**
 * Achievement Notification Helper
 * Sends push notifications when achievements are unlocked
 */

import { supabaseAdmin } from '~/lib/supabase.server';
import { sendTargetedPushNotification, notificationTemplates } from '~/lib/push-notifications-enhanced.server';

export async function notifyAchievementUnlocked(participantId: string, achievementTitle: string, achievementIcon: string) {
  try {
    // Get participant's active push subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('participant_id', participantId)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      console.info('[achievement-notifications] no active subscriptions for participant', { participantId });
      return;
    }

    const notification = notificationTemplates.achievementUnlocked(achievementTitle, achievementIcon);
    
    await sendTargetedPushNotification(
      subscriptions,
      notification,
      {
        title: notification.title,
        body: notification.body,
        eventType: 'achievementUnlocked',
        eventData: { achievementTitle, achievementIcon },
        targetCriteria: { participantId },
      }
    );

    console.info('[achievement-notifications] achievement notification sent', { 
      participantId, 
      achievementTitle 
    });
  } catch (error) {
    console.error('[achievement-notifications] error sending achievement notification', error);
  }
}

export async function notifyBuddyAchievementUnlocked(
  participantIds: string[], 
  achievementTitle: string, 
  achievementIcon: string
) {
  try {
    // Get all participants' active push subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('participant_id', participantIds)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      console.info('[achievement-notifications] no active subscriptions for buddy group');
      return;
    }

    const notification = notificationTemplates.achievementUnlocked(achievementTitle, achievementIcon);
    
    await sendTargetedPushNotification(
      subscriptions,
      notification,
      {
        title: notification.title,
        body: notification.body,
        eventType: 'achievementUnlocked',
        eventData: { achievementTitle, achievementIcon, buddyGroup: true },
        targetCriteria: { participantIds },
      }
    );

    console.info('[achievement-notifications] buddy achievement notification sent', { 
      participantCount: participantIds.length,
      achievementTitle 
    });
  } catch (error) {
    console.error('[achievement-notifications] error sending buddy achievement notification', error);
  }
}
