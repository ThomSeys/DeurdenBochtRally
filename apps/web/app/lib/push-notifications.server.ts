import webpush from 'web-push';

// Configure web push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:info@deurdenbocht.be';

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

export async function sendPushNotification(
  subscription: { endpoint: string; keys: any },
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
    return { success: true, result };
  } catch (error: any) {
    console.error('[push] failed to send notification', { 
      error: error.message,
      statusCode: error.statusCode,
      endpoint: subscription.endpoint?.substring(0, 50) + '...',
    });
    
    // If subscription is expired/invalid, mark as inactive
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true };
    }
    
    return { success: false, error };
  }
}

export async function sendBulkPushNotifications(
  subscriptions: Array<{ endpoint: string; keys: any }>,
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
  const failed = results.length - successful;

  console.info('[push] bulk send complete', { total: results.length, successful, failed });

  // Log failed results
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.error('[push] subscription failed (rejected)', { 
        index: idx, 
        reason: result.reason?.message || result.reason 
      });
    } else if (!result.value?.success) {
      console.warn('[push] subscription failed (not success)', { 
        index: idx, 
        error: result.value?.error?.message || result.value?.error 
      });
    }
  });

  return { successful, failed, results };
}

// Predefined notification templates
export const notificationTemplates = {
  rallyStart: {
    title: '🏁 Rally Gestart!',
    body: 'Het evenement is officieel begonnen. Veel plezier!',
    tag: 'rally-start',
  },

  rallyEnd: {
    title: '🏁 Rally Afgelopen!',
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
    title: `🎯 Rally Zone ${zoneNumber} Geopend`,
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
      options?.type && `📍 Type: ${options.type}`,
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

  eventResolved: (eventTitle: string) => ({
    title: `✅ Incident Opgelost`,
    body: `${eventTitle} is nu opgelost.`,
    tag: 'event-resolved',
  }),

  leaderboardUpdate: (rank: number) => ({
    title: '🏆 Leaderboard Update',
    body: `Je staat nu op positie #${rank}!`,
    tag: 'leaderboard',
  }),

  achievementUnlocked: (achievementTitle: string, achievementIcon: string) => ({
    title: '🎉 Achievement Unlocked!',
    body: `${achievementIcon} ${achievementTitle}`,
    tag: 'achievement',
  }),

  reminder: (hours: number) => ({
    title: `⏰ ${hours} uur tot het evenement!`,
    body: 'Vergeet niet je QR code en GPS te checken',
    tag: 'reminder',
  }),
};
