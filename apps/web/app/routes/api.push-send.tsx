import type { ActionFunctionArgs } from 'react-router';
import type { Database } from '~/lib/database.types';
import { createRequestLogger } from '~/lib/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseAdmin } = await import('~/lib/supabase.server');
  const { requireAdmin, requireUserId } = await import('~/lib/session.server');
  const { sendPushNotificationWithHistory, sendTargetedPushNotification } = await import('~/lib/push-notifications-enhanced.server');
  
  await requireAdmin(request);
  const userId = await requireUserId(request);
  const requestLogger = createRequestLogger(request, userId);

  if (request.method !== 'POST') {
    await requestLogger.warn('push', 'Push send rejected: invalid method');
    return { error: 'Methode niet toegestaan' };
  }

  try {
    const body = await request.json();
    const { action: bodyAction, ...payload } = body;

    await requestLogger.info('push', 'Push notification send request received', { 
      action: bodyAction,
      hasTitle: !!payload.title,
      hasBody: !!payload.body
    });

    // ACTION: broadcast - send to all active subscribers
    if (bodyAction === 'broadcast') {
      const { title, body: messageBody, eventType, eventData } = payload;

      // Get all active subscriptions
      const { data: subscriptions, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        await requestLogger.error('push', 'Failed to fetch push subscriptions', error as Error);
        return { error: error.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        await requestLogger.warn('push', 'No active subscriptions found for broadcast');
        return { error: 'Geen actieve abonnementen gevonden' };
      }

      // Special handling for leaderboard update - personalize with each participant's rank
      if (eventType === 'leaderboard') {
        console.info('[api.push-send] Personalizing leaderboard updates for broadcast');
        
        // Lazy load leaderboard functions only when needed
        const { getParticipantRanks } = await import('~/lib/leaderboard.server');
        
        // Get participant IDs and their ranks
        const participantIds = subscriptions.map(s => s.participant_id).filter(Boolean) as string[];
        const rankMap = await getParticipantRanks(participantIds);

        // Send individual personalized notifications
        const { sendPushNotification } = await import('~/lib/push-notifications-enhanced.server');
        const results = await Promise.allSettled(
          subscriptions.map(sub => {
            const rank = sub.participant_id ? rankMap.get(sub.participant_id) : null;
            const personalizedBody = rank ? `Je staat nu op positie #${rank}!` : messageBody;
            
            return sendPushNotification(sub, {
              title,
              body: personalizedBody,
              tag: 'leaderboard',
            });
          })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const expired = results.filter(r => r.status === 'fulfilled' && r.value?.expired).length;
        const failed = results.length - successful;

        // Mark expired subscriptions as inactive
        if (expired > 0) {
          const expiredEndpoints = results
            .map((result, idx) => result.status === 'fulfilled' && result.value?.expired ? subscriptions[idx].endpoint : null)
            .filter(Boolean) as string[];
          
          if (expiredEndpoints.length > 0) {
            await supabaseAdmin
              .from('push_subscriptions')
              .update({ is_active: false })
              .in('endpoint', expiredEndpoints);
          }
        }

        // Create history record
        const { data: historyRecord } = await supabaseAdmin
          .from('push_notifications_history')
          .insert({
            title,
            body: 'Personalized leaderboard update sent to each participant with their rank',
            event_type: eventType || 'custom',
            event_data: eventData,
            target_type: 'broadcast',
            sent_by: userId,
            sent_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        return {
          success: true,
          historyId: historyRecord?.id,
          sent: successful,
          failed,
          expired,
          personalized: true,
        };
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
        return { error: 'Doelcriteria ontbreekt' };
      }

      // Special handling for leaderboard update - personalize with each participant's rank
      if (eventType === 'leaderboard') {
        console.info('[api.push-send] Personalizing leaderboard updates for targeted message');
        
        // Lazy load leaderboard functions only when needed
        const { getParticipantRanks } = await import('~/lib/leaderboard.server');
        
        // Get targeted subscriptions with participant data
        const { data: subscriptions, error } = await supabaseAdmin
          .from('push_subscriptions')
          .select(`
            *,
            participants!inner (
              formula,
              ride_type
            )
          `)
          .eq('is_active', true);

        if (error || !subscriptions) {
          return { error: 'Kon abonnementen niet ophalen' };
        }

        // Filter subscriptions based on criteria
        let filtered = subscriptions;

        if (criteria.participant_ids && Array.isArray(criteria.participant_ids)) {
          filtered = filtered.filter(s => 
            criteria.participant_ids.includes(s.participant_id)
          );
        }
        if (criteria.rally_packages && Array.isArray(criteria.rally_packages)) {
          filtered = filtered.filter(s => 
            s.participants && criteria.rally_packages.includes(s.participants.formula)
          );
        }
        if (criteria.ride_types && Array.isArray(criteria.ride_types)) {
          filtered = filtered.filter(s => 
            s.participants && criteria.ride_types.includes(s.participants.ride_type)
          );
        }

        if (filtered.length === 0) {
          return { error: 'Geen abonnementen voldoen aan de doelcriteria' };
        }

        // Get ranks for targeted participants
        const participantIds = filtered.map(s => s.participant_id).filter(Boolean) as string[];
        const rankMap = await getParticipantRanks(participantIds);

        // Send individual personalized notifications
        const { sendPushNotification } = await import('~/lib/push-notifications-enhanced.server');
        const results = await Promise.allSettled(
          filtered.map(sub => {
            const rank = sub.participant_id ? rankMap.get(sub.participant_id) : null;
            const personalizedBody = rank ? `Je staat nu op positie #${rank}!` : messageBody;
            
            return sendPushNotification(sub, {
              title,
              body: personalizedBody,
              tag: 'leaderboard',
            });
          })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const expired = results.filter(r => r.status === 'fulfilled' && r.value?.expired).length;
        const failed = results.length - successful;

        // Mark expired subscriptions as inactive
        if (expired > 0) {
          const expiredEndpoints = results
            .map((result, idx) => result.status === 'fulfilled' && result.value?.expired ? filtered[idx].endpoint : null)
            .filter(Boolean) as string[];
          
          if (expiredEndpoints.length > 0) {
            await supabaseAdmin
              .from('push_subscriptions')
              .update({ is_active: false })
              .in('endpoint', expiredEndpoints);
          }
        }

        // Create history record
        const { data: historyRecord } = await supabaseAdmin
          .from('push_notifications_history')
          .insert({
            title,
            body: 'Personalized leaderboard update sent to targeted participants with their rank',
            event_type: eventType || 'custom',
            event_data: eventData,
            target_type: 'targeted',
            target_criteria: criteria,
            sent_by: userId,
            sent_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        return {
          success: true,
          historyId: historyRecord?.id,
          sent: successful,
          failed,
          expired,
          personalized: true,
        };
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
        return { error: 'Gebruiker-ID\'s ontbreken of zijn ongeldig' };
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
        return { error: `Geen actieve abonnementen gevonden voor opgegeven gebruikers` };
      }

      // Special handling for leaderboard update - personalize with each participant's rank
      if (eventType === 'leaderboard') {
        console.info('[api.push-send] Personalizing leaderboard updates for to-users');
        
        // Lazy load leaderboard functions only when needed
        const { getParticipantRanks } = await import('~/lib/leaderboard.server');
        const rankMap = await getParticipantRanks(userIds);

        // Send individual personalized notifications
        const { sendPushNotification } = await import('~/lib/push-notifications-enhanced.server');
        const results = await Promise.allSettled(
          subscriptions.map(sub => {
            const rank = sub.participant_id ? rankMap.get(sub.participant_id) : null;
            const personalizedBody = rank ? `Je staat nu op positie #${rank}!` : messageBody;
            
            return sendPushNotification(sub, {
              title,
              body: personalizedBody,
              tag: 'leaderboard',
            });
          })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
        const expired = results.filter(r => r.status === 'fulfilled' && r.value?.expired).length;
        const failed = results.length - successful;

        // Mark expired subscriptions as inactive
        if (expired > 0) {
          const expiredEndpoints = results
            .map((result, idx) => result.status === 'fulfilled' && result.value?.expired ? subscriptions[idx].endpoint : null)
            .filter(Boolean) as string[];
          
          if (expiredEndpoints.length > 0) {
            await supabaseAdmin
              .from('push_subscriptions')
              .update({ is_active: false })
              .in('endpoint', expiredEndpoints);
          }
        }

        // Create history record
        const { data: historyRecord } = await supabaseAdmin
          .from('push_notifications_history')
          .insert({
            title,
            body: 'Personalized leaderboard update sent to specific users with their rank',
            event_type: eventType || 'custom',
            event_data: eventData,
            target_type: 'targeted',
            target_criteria: { user_ids: userIds },
            sent_by: userId,
            sent_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        return {
          success: true,
          historyId: historyRecord?.id,
          sent: successful,
          failed,
          expired,
          personalized: true,
        };
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
        return { error: 'historyId ontbreekt' };
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
        return { error: 'historyId ontbreekt' };
      }

      const { data: notification } = await supabaseAdmin
        .from('push_notifications_history')
        .select('*')
        .eq('id', historyId)
        .single();

      if (!notification) {
        return { error: 'Melding niet gevonden' };
      }

      // Get failed deliveries
      const { data: failedDeliveries } = await supabaseAdmin
        .from('push_delivery_log')
        .select('subscription_endpoint, participant_id')
        .eq('notification_history_id', historyId)
        .eq('delivery_status', 'failed')
        .lt('delivery_attempt', 3);

      if (!failedDeliveries || failedDeliveries.length === 0) {
        return { error: 'Geen mislukte afleveringen om opnieuw te proberen' };
      }

      // Get current subscriptions
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .in('endpoint', failedDeliveries.map(d => d.subscription_endpoint).filter(Boolean) as string[])
        .eq('is_active', true);

      if (!subscriptions || subscriptions.length === 0) {
        return { error: 'Geen actieve abonnementen gevonden voor opnieuw' };
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

    return { error: 'Onbekende actie' };
  } catch (error: any) {
    console.error('[api.push-send] Error:', error);
    return { error: error.message || 'Interne serverfout' };
  }
}
