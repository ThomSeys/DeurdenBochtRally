import webpush from 'web-push';
import { supabaseAdmin } from './supabase.server';
import type { Database } from './database.types';

// Configure web push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:vzwddb@gmail.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushHistoryOptions extends PushNotificationOptions {
  eventType: string; // 'zone_opened', 'zone_closed', 'event_marker', 'achievement', 'custom', etc.
  eventData?: any; // Metadata about the event
  targetType?: 'broadcast' | 'targeted' | 'single'; // Default: 'broadcast'
  targetCriteria?: any; // For targeted messages: {"zones": [...], "regions": [...], "user_ids": [...]}
  sentBy?: string; // User ID of admin who sent it (null for automatic)
}

export async function sendPushNotification(
  subscription: Database['public']['Tables']['push_subscriptions']['Row'] & { keys: any },
  notification: PushNotificationOptions
) {
  try {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/icon-96.png',
      data: notification.data || {},
      actions: notification.actions || [],
      tag: notification.tag,
      requireInteraction: notification.requireInteraction || false,
    });

    const result = await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payload
    );

    console.info('[push] notification sent', { endpoint: subscription.endpoint });
    return { success: true, result, expired: false };
  } catch (error: any) {
    console.error('[push] failed to send notification', { 
      error: error.message,
      statusCode: error.statusCode,
      endpoint: subscription.endpoint?.substring(0, 50) + '...',
    });
    
    // If subscription is expired/invalid, mark as inactive
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true, statusCode: error.statusCode };
    }
    
    return { success: false, error, expired: false, statusCode: error.statusCode };
  }
}

export async function sendBulkPushNotifications(
  subscriptions: Array<Database['public']['Tables']['push_subscriptions']['Row'] & { keys: any }>,
  notification: PushNotificationOptions
) {
  console.info('[push] bulk send starting', { total: subscriptions.length });
  
  const results = await Promise.allSettled(
    subscriptions.map((sub, index) => {
      console.info('[push] sending to subscription', { 
        index, 
        endpoint: sub.endpoint?.substring(0, 50) + '...',
        hasKeys: !!sub.keys 
      });
      return sendPushNotification(sub, notification);
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
  const expired = results.filter(r => r.status === 'fulfilled' && r.value?.expired).length;
  const failed = results.length - successful;

  console.info('[push] bulk send complete', { total: results.length, successful, failed, expired });

  // Mark expired subscriptions as inactive
  if (expired > 0) {
    const expiredEndpoints = results
      .map((result, idx) => result.status === 'fulfilled' && result.value?.expired ? subscriptions[idx].endpoint : null)
      .filter(Boolean) as string[];
    
    if (expiredEndpoints.length > 0) {
      console.info('[push] marking subscriptions as inactive', { count: expiredEndpoints.length });
      await supabaseAdmin
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('endpoint', expiredEndpoints);
    }
  }

  return { successful, failed, expired, results };
}

/**
 * Send a push notification and log it to history
 */
export async function sendPushNotificationWithHistory(
  subscriptions: Array<Database['public']['Tables']['push_subscriptions']['Row'] & { keys: any }>,
  notification: PushNotificationOptions,
  historyOptions: PushHistoryOptions
) {
  const { eventType, eventData, targetType = 'broadcast', targetCriteria, sentBy } = historyOptions;

  // Create notification history record
  const { data: historyRecord, error: historyError } = await supabaseAdmin
    .from('push_notifications_history')
    .insert({
      title: notification.title,
      body: notification.body,
      event_type: eventType,
      event_data: eventData || null,
      target_type: targetType,
      target_criteria: targetCriteria || null,
      recipient_count: subscriptions.length,
      status: 'sending',
      sent_by: sentBy || null,
    })
    .select()
    .single();

  if (historyError) {
    console.error('[push] failed to create history record', historyError);
    // Continue anyway, don't let history tracking block notification sending
  }

  const notificationHistoryId = historyRecord?.id;

  // Send notifications
  const results = await sendBulkPushNotifications(subscriptions, notification);

  // Update history with results
  if (notificationHistoryId) {
    const successCount = results.successful;
    const failedCount = results.failed;
    const expiredCount = results.expired;

    await supabaseAdmin
      .from('push_notifications_history')
      .update({
        success_count: successCount,
        failed_count: failedCount,
        expired_count: expiredCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', notificationHistoryId);

    // Log individual delivery results
    const deliveryLogs = subscriptions.map((sub, idx) => {
      const result = results.results[idx];
      const resultValue = result.status === 'fulfilled' ? result.value : null;

      return {
        notification_history_id: notificationHistoryId,
        participant_id: sub.participant_id || null,
        subscription_endpoint: sub.endpoint,
        delivery_status: resultValue?.success ? 'sent' : (resultValue?.expired ? 'expired' : 'failed'),
        error_message: resultValue?.error?.message || null,
        status_code: resultValue?.statusCode || null,
      };
    });

    if (deliveryLogs.length > 0) {
      await supabaseAdmin
        .from('push_delivery_log')
        .insert(deliveryLogs);
    }
  }

  return {
    historyId: notificationHistoryId,
    ...results,
  };
}

/**
 * Get recipients matching specific criteria for targeted messaging
 */
export async function getTargetedRecipients(criteria: any) {
  let query = supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('is_active', true);

  // Filter by zones if specified
  if (criteria.zones?.length > 0) {
    query = query
      .in('participant_id', 
        (await supabaseAdmin
          .from('rally_zone_submissions')
          .select('participant_id')
          .in('zone_id', criteria.zones)
          .then(r => r.data?.map(c => c.participant_id).filter(Boolean) || [])
        )
      );
  }

  // Filter by specific user IDs if specified
  if (criteria.user_ids?.length > 0) {
    query = query.in('participant_id', criteria.user_ids);
  }

  // Filter by achievement if specified
  if (criteria.has_achievement) {
    query = query
      .in('participant_id',
        (await supabaseAdmin
          .from('participant_achievements')
          .select('participant_id')
          .eq('id', criteria.has_achievement)
          .then(r => r.data?.map(a => a.participant_id).filter(Boolean) || [])
        )
      );
  }

  const { data: subscriptions, error } = await query;

  if (error) {
    console.error('[push] error fetching targeted recipients', error);
    return [];
  }

  return subscriptions || [];
}

/**
 * Send targeted push notification
 */
export async function sendTargetedPushNotification(
  criteria: any,
  notification: PushNotificationOptions,
  historyOptions: PushHistoryOptions
) {
  const subscriptions = await getTargetedRecipients(criteria);

  console.info('[push] sending targeted notification', { 
    recipientCount: subscriptions.length,
    criteria 
  });

  return sendPushNotificationWithHistory(
    subscriptions,
    notification,
    {
      ...historyOptions,
      targetType: 'targeted',
      targetCriteria: criteria,
    }
  );
}

/**
 * Retry failed notifications from history
 */
export async function retryFailedNotifications(notificationHistoryId: number) {
  // Get failed deliveries
  const { data: failedDeliveries } = await supabaseAdmin
    .from('push_delivery_log')
    .select('participant_id, subscription_endpoint, id')
    .eq('notification_history_id', notificationHistoryId)
    .eq('delivery_status', 'failed')
    .lt('delivery_attempt', 3); // Retry up to 3 times

  if (!failedDeliveries || failedDeliveries.length === 0) {
    console.info('[push] no failed deliveries to retry', { notificationHistoryId });
    return { retried: 0 };
  }

  // Get original notification
  const { data: notification } = await supabaseAdmin
    .from('push_notifications_history')
    .select('title, body')
    .eq('id', notificationHistoryId)
    .single();

  if (!notification) {
    console.error('[push] notification not found for retry', { notificationHistoryId });
    return { retried: 0 };
  }

  // Get current subscriptions for failed deliveries
  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .in('endpoint', failedDeliveries.map(d => d.subscription_endpoint).filter(Boolean) as string[])
    .eq('is_active', true);

  if (!subscriptions || subscriptions.length === 0) {
    console.info('[push] no active subscriptions found for retry', { count: failedDeliveries.length });
    return { retried: 0 };
  }

  // Retry sending
  const results = await sendBulkPushNotifications(subscriptions, notification);

  // Update delivery logs
  for (const delivery of failedDeliveries) {
    await supabaseAdmin
      .from('push_delivery_log')
      .update({
        delivery_attempt: (await supabaseAdmin
          .from('push_delivery_log')
          .select('delivery_attempt')
          .eq('id', delivery.id)
          .single()
          .then(r => (r.data?.delivery_attempt || 0) + 1)
        ),
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', delivery.id);
  }

  return { retried: subscriptions.length, ...results };
}

// Notification templates
export const notificationTemplates = {
  rallyStart: {
    title: 'Rally Gestart!',
    body: 'Het evenement is officieel begonnen. Veel plezier!',
    tag: 'rally-start',
  },

  rallyEnd: {
    title: 'Rally Afgelopen!',
    body: 'Dank je wel voor je deelname! Bekijk je resultaten op de leaderboard.',
    tag: 'rally-end',
  },

  weatherWarning: {
    title: '⛈️ Weerswaarschuwing',
    body: 'Pas op! Er staat slecht weer op komst. Ride safe!',
    tag: 'weather-warning',
    requireInteraction: true,
  },
  
  zoneOpened: (zoneNumber: number, zoneName: string) => ({
    title: `Rally Zone ${zoneNumber} Geopend`,
    body: `${zoneName} is nu beschikbaar!`,
    tag: `zone-${zoneNumber}-open`,
    actions: [
      { action: 'view', title: 'Bekijk', icon: '/icon-map.png' },
    ],
  }),

  zoneClosed: (zoneNumber: number, zoneName: string) => ({
    title: `⛔ Rally Zone ${zoneNumber} Gesloten`,
    body: `${zoneName} is nu gesloten`,
    tag: `zone-${zoneNumber}-closed`,
  }),

  criticalEvent: (eventTitle: string, eventDescription: string, options?: { type?: string; severity?: string; source?: string }) => ({
    title: `${eventTitle}`,
    body: [
      eventDescription,
      options?.type && `Type: ${options.type}`,
      options?.severity && `⚠️ Ernstniveau: ${options.severity === 'critical' ? 'Kritiek' : options.severity === 'high' ? 'Hoog' : 'Normaal'}`,
      options?.source === 'live-map' && '📡 Gemeld via Live Kaart',
    ]
      .filter(Boolean)
      .join('\n'),
    tag: 'critical-event',
    requireInteraction: true,
    data: {
      link: '/live-map',
      source: options?.source || 'admin',
    },
    actions: [
      { action: 'view-map', title: 'Bekijk Map', icon: '/icon-map.png' },
    ],
  }),

  eventResolved: (eventTitle: string, resolutionMessage?: string) => ({
    title: `✅ Incident Opgelost`,
    body: resolutionMessage || `${eventTitle} is nu opgelost.`,
    tag: 'event-resolved',
    data: {
      link: '/live-map',
    },
  }),

  eventCancelled: (eventTitle: string, resolutionMessage?: string) => ({
    title: `🔔 Incident Verwijderd`,
    body: resolutionMessage || `${eventTitle} is verwijderd van de kaart.`,
    tag: 'event-cancelled',
    data: {
      link: '/live-map',
    },
  }),

  leaderboardUpdate: (rank: number) => ({
    title: '🏆 Leaderboard Update',
    body: `Je staat nu op positie #${rank}!`,
    tag: 'leaderboard',
  }),

  achievementUnlocked: (achievementTitle: string, achievementIcon: string) => ({
    title: 'Achievement Unlocked!',
    body: `${achievementIcon} ${achievementTitle}`,
    tag: 'achievement',
  }),

  reminder: (hours: number) => ({
    title: `⏰ ${hours} uur tot het evenement!`,
    body: 'Vergeet niet je QR code en GPS te checken',
    tag: 'reminder',
  }),
};
