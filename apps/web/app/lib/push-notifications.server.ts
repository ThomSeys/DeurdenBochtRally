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
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, notification))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  console.info('[push] bulk send complete', { total: results.length, successful, failed });

  return { successful, failed, results };
}

// Predefined notification templates
export const notificationTemplates = {
  rallyStart: {
    title: '🏁 Rally Gestart!',
    body: 'Het evenement is officieel begonnen. Veel plezier!',
    tag: 'rally-start',
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

  criticalEvent: (eventTitle: string, eventDescription: string) => ({
    title: `🚨 ${eventTitle}`,
    body: eventDescription,
    tag: 'critical-event',
    requireInteraction: true,
    actions: [
      { action: 'view-map', title: 'Bekijk Map', icon: '/icon-map.png' },
    ],
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
