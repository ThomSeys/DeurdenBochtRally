import type { ActionFunctionArgs } from 'react-router';
import { supabaseAdmin } from '~/lib/supabase.server';
import type { Database } from '~/lib/database.types';

export async function action({ request }: ActionFunctionArgs) {
  const { requireAdmin, requireUserId } = await import('~/lib/session.server');
  const { sendPushNotificationWithHistory, sendTargetedPushNotification } = await import('~/lib/push-notifications-enhanced.server');
  
  await requireAdmin(request);
  const userId = await requireUserId(request);

  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  try {
    const body = await request.json();
    const { action: bodyAction, ...payload } = body;

    console.info('[api.push-send] received request', { action: bodyAction, userId });

    // ACTION: broadcast - send to all active subscribers
    if (bodyAction === 'broadcast') {
      const { title, body: messageBody, eventType, eventData } = payload;

      // Get all active subscriptions
      const { data: subscriptions, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('[api.push-send] Error fetching subscriptions:', error);
        return { error: error.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        return { error: 'No active subscriptions found' };
      }

      const result = await sendPushNotificationWithHistory(
        subscriptions,
        {
          title,
          body: messageBody,
        },
        {
          title,
          body: messageBody,
          eventType: eventType || 'custom',
          eventData,
          sentBy: userId,
        }
      );

      return {
        success: true,
        historyId: result.historyId,
        sent: result.successful,
        failed: result.failed,
        expired: result.expired,
      };
    }

    // ACTION: targeted - send to specific criteria
    if (bodyAction === 'targeted') {
      const { title, body: messageBody, eventType, eventData, criteria } = payload;

      if (!criteria) {
        return { error: 'Missing target criteria' };
      }

      const result = await sendTargetedPushNotification(
        criteria,
        {
          title,
          body: messageBody,
        },
        {
          title,
          body: messageBody,
          eventType: eventType || 'custom',
          eventData,
          sentBy: userId,
        }
      );

      return {
        success: true,
        historyId: result.historyId,
        sent: result.successful,
        failed: result.failed,
        expired: result.expired,
      };
    }

    // ACTION: to-users - send to specific user IDs
    if (bodyAction === 'to-users') {
      const { title, body: messageBody, eventType, eventData, userIds } = payload;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return { error: 'Missing or invalid userIds' };
      }

      const { data: subscriptions, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .in('participant_id', userIds)
        .eq('is_active', true);

      if (error) {
        console.error('[api.push-send] Error fetching subscriptions:', error);
        return { error: error.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        return { error: `No active subscriptions found for specified users` };
      }

      const result = await sendPushNotificationWithHistory(
        subscriptions,
        {
          title,
          body: messageBody,
        },
        {
          title,
          body: messageBody,
          eventType: eventType || 'custom',
          eventData,
          targetType: 'targeted',
          targetCriteria: { user_ids: userIds },
          sentBy: userId,
        }
      );

      return {
        success: true,
        historyId: result.historyId,
        sent: result.successful,
        failed: result.failed,
        expired: result.expired,
      };
    }

    // ACTION: get-history - retrieve notification history
    if (bodyAction === 'get-history') {
      const { limit = 50, offset = 0, eventType: filterEventType } = payload;

      let query = supabaseAdmin
        .from('push_notifications_history')
        .select('*', { count: 'exact' })
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filterEventType) {
        query = query.eq('event_type', filterEventType);
      }

      const { data: history, count, error } = await query;

      if (error) {
        console.error('[api.push-send] Error fetching history:', error);
        return { error: error.message };
      }

      return {
        success: true,
        history,
        total: count,
        limit,
        offset,
      };
    }

    // ACTION: get-history-details - get detailed info for a specific notification
    if (bodyAction === 'get-history-details') {
      const { historyId } = payload;

      if (!historyId) {
        return { error: 'Missing historyId' };
      }

      const { data: notification, error: notifError } = await supabaseAdmin
        .from('push_notifications_history')
        .select('*')
        .eq('id', historyId)
        .single();

      if (notifError) {
        return { error: notifError.message };
      }

      const { data: deliveries } = await supabaseAdmin
        .from('push_delivery_log')
        .select('*')
        .eq('notification_history_id', historyId);

      const { data: failedDeliveries } = await supabaseAdmin
        .from('push_delivery_log')
        .select('*')
        .eq('notification_history_id', historyId)
        .eq('delivery_status', 'failed');

      return {
        success: true,
        notification,
        totalDeliveries: deliveries?.length || 0,
        failedDeliveries: failedDeliveries || [],
      };
    }

    // ACTION: retry-failed - retry failed notifications
    if (bodyAction === 'retry-failed') {
      const { historyId } = payload;

      if (!historyId) {
        return { error: 'Missing historyId' };
      }

      const { data: notification } = await supabaseAdmin
        .from('push_notifications_history')
        .select('*')
        .eq('id', historyId)
        .single();

      if (!notification) {
        return { error: 'Notification not found' };
      }

      // Get failed deliveries
      const { data: failedDeliveries } = await supabaseAdmin
        .from('push_delivery_log')
        .select('subscription_endpoint, participant_id')
        .eq('notification_history_id', historyId)
        .eq('delivery_status', 'failed')
        .lt('delivery_attempt', 3);

      if (!failedDeliveries || failedDeliveries.length === 0) {
        return { error: 'No failed deliveries to retry' };
      }

      // Get current subscriptions
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .in('endpoint', failedDeliveries.map(d => d.subscription_endpoint).filter(Boolean) as string[])
        .eq('is_active', true);

      if (!subscriptions || subscriptions.length === 0) {
        return { error: 'No active subscriptions found for retry' };
      }

      const { sendBulkPushNotifications } = await import('~/lib/push-notifications-enhanced.server');
      const results = await sendBulkPushNotifications(subscriptions, {
        title: notification.title,
        body: notification.body,
      });

      // Update delivery logs
      for (const failed of failedDeliveries) {
        if (!failed.subscription_endpoint) continue;
        const sub = subscriptions.find(s => s.endpoint === failed.subscription_endpoint);
        if (sub) {
          await supabaseAdmin
            .from('push_delivery_log')
            .update({
              delivery_attempt: (await supabaseAdmin
                .from('push_delivery_log')
                .select('delivery_attempt')
                .eq('notification_history_id', historyId)
                .eq('subscription_endpoint', failed.subscription_endpoint)
                .single()
                .then(r => (r.data?.delivery_attempt || 1) + 1)
              ),
              last_attempt_at: new Date().toISOString(),
            })
            .eq('notification_history_id', historyId)
            .eq('subscription_endpoint', failed.subscription_endpoint);
        }
      }

      return {
        success: true,
        retried: subscriptions.length,
        sent: results.successful,
        failed: results.failed,
        expired: results.expired,
      };
    }

    return { error: 'Unknown action' };
  } catch (error: any) {
    console.error('[api.push-send] Error:', error);
    return { error: error.message || 'Internal server error' };
  }
}
