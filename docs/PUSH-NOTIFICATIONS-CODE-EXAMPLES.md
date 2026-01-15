# Code Examples: Implementing Push Notification Tracking

## Quick Reference: Converting Existing Code

### Example 1: Zone Opening Notification

**BEFORE** (from `admin.zone-control.tsx` around line 85):
```typescript
import { sendBulkPushNotifications } from '~/lib/push-notifications.server';

// Get subscriptions...
const subscriptions = await supabaseAdmin
  .from('push_subscriptions')
  .select('endpoint, keys')
  .eq('is_active', true);

// Send notification
const result = await sendBulkPushNotifications(subscriptions.data || [], 
  notificationTemplates.zoneOpened(zone.order, zone.title)
);

console.info('[zone-control] Zone opened notification sent', { 
  zone: zone.id,
  sent: result.successful 
});
```

**AFTER** (with tracking):
```typescript
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';

const userId = await requireUserId(request);

// Get subscriptions...
const subscriptions = await supabaseAdmin
  .from('push_subscriptions')
  .select('id, endpoint, keys, participant_id')
  .eq('is_active', true);

// Send notification with history tracking
const result = await sendPushNotificationWithHistory(
  subscriptions.data || [], 
  notificationTemplates.zoneOpened(zone.order, zone.title),
  {
    eventType: 'zone_opened',
    eventData: { 
      zoneId: zone.id,
      zoneName: zone.title,
      zoneNumber: zone.order,
      timestamp: new Date().toISOString()
    },
    sentBy: userId,
  }
);

console.info('[zone-control] Zone opened notification sent with tracking', { 
  zone: zone.id,
  historyId: result.historyId,
  sent: result.successful,
  failed: result.failed,
  expired: result.expired
});
```

---

### Example 2: Zone Closing Notification

**BEFORE**:
```typescript
// Around line 140 in admin.zone-control.tsx
const result = await sendBulkPushNotifications(subscriptions.data || [], 
  notificationTemplates.zoneClosed(zone.order, zone.title)
);
```

**AFTER**:
```typescript
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';

const userId = await requireUserId(request);

const result = await sendPushNotificationWithHistory(
  subscriptions.data || [], 
  notificationTemplates.zoneClosed(zone.order, zone.title),
  {
    eventType: 'zone_closed',
    eventData: { 
      zoneId: zone.id,
      zoneName: zone.title,
      zoneNumber: zone.order,
      timestamp: new Date().toISOString()
    },
    sentBy: userId,
  }
);
```

---

### Example 3: Critical Event Notification

**BEFORE** (from `admin.event-markers.tsx` around line 168):
```typescript
const result = await sendBulkPushNotifications(subscriptions.data || [],
  notificationTemplates.criticalEvent(title, description, { 
    type: eventType,
    severity,
    source: 'admin'
  })
);
```

**AFTER**:
```typescript
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';

const userId = await requireUserId(request);

const result = await sendPushNotificationWithHistory(
  subscriptions.data || [],
  notificationTemplates.criticalEvent(title, description, { 
    type: eventType,
    severity,
    source: 'admin'
  }),
  {
    eventType: 'critical_event',
    eventData: { 
      eventTitle: title,
      eventDescription: description,
      eventType,
      severity, // 'low', 'high', 'critical'
      coordinates: coords,
      reportedBy: source, // 'admin', 'live-map', etc.
      timestamp: new Date().toISOString()
    },
    sentBy: userId,
  }
);

console.info('[event-markers] Critical event notification sent', { 
  eventTitle: title,
  historyId: result.historyId,
  recipientCount: result.successful + result.failed
});
```

---

### Example 4: Event Resolution Notification

**BEFORE**:
```typescript
const result = await sendBulkPushNotifications(subscriptions.data || [],
  notificationTemplates.eventResolved(marker.title)
);
```

**AFTER**:
```typescript
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';

const userId = await requireUserId(request);

const result = await sendPushNotificationWithHistory(
  subscriptions.data || [],
  notificationTemplates.eventResolved(marker.title, 'Incident has been resolved'),
  {
    eventType: 'event_resolved',
    eventData: { 
      eventId: marker.id,
      eventTitle: marker.title,
      resolvedAt: new Date().toISOString(),
      resolvedBy: userId
    },
    sentBy: userId,
  }
);
```

---

## Manual Send Examples

### Send Broadcast via Direct API Call

```typescript
// In a server action or loader
async function sendBroadcastNotification(request: Request) {
  const userId = await requireUserId(request);
  await requireAdmin(userId);

  const response = await fetch('http://localhost:3000/api/push-send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'broadcast',
      title: '🏁 Rally Start!',
      body: 'The event begins NOW! Get to your starting zone!',
      eventType: 'rally_start',
    }),
  });

  return response.json();
}
```

### Send Targeted via Direct API Call

```typescript
// Send to specific participants who checked into Zone 3
async function sendZoneChallengeNotification(
  zoneId: string,
  title: string,
  body: string,
  userId: string
) {
  const response = await fetch('http://localhost:3000/api/push-send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'targeted',
      title,
      body,
      criteria: {
        zones: [zoneId],
      },
      eventType: 'zone_challenge',
    }),
  });

  const result = await response.json();
  console.log(`Challenge sent to ${result.sent} participants in zone`);
  return result;
}
```

---

## Query Examples for Admin Dashboard

### Get Recent Notifications by Type

```typescript
// Get last 10 zone-opened events
const { data: zoneEvents } = await supabaseAdmin
  .from('push_notifications_history')
  .select('*')
  .eq('event_type', 'zone_opened')
  .order('sent_at', { ascending: false })
  .limit(10);

zoneEvents?.forEach(event => {
  console.log(`
    Zone ${event.event_data?.zoneNumber} opened
    Success: ${event.success_count}/${event.recipient_count}
    Failed: ${event.failed_count}
  `);
});
```

### Get Today's Summary

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const { data: todayNotifications } = await supabaseAdmin
  .from('push_notifications_history')
  .select('event_type, recipient_count, success_count, failed_count')
  .gte('sent_at', today.toISOString());

const summary = {
  totalSent: todayNotifications?.reduce((sum, n) => sum + n.recipient_count, 0) || 0,
  totalSuccessful: todayNotifications?.reduce((sum, n) => sum + n.success_count, 0) || 0,
  totalFailed: todayNotifications?.reduce((sum, n) => sum + n.failed_count, 0) || 0,
  byType: {} as Record<string, number>,
};

todayNotifications?.forEach(n => {
  if (!summary.byType[n.event_type]) summary.byType[n.event_type] = 0;
  summary.byType[n.event_type] += n.success_count;
});

console.log('Today Summary:', summary);
```

### Get Failed Delivery Details

```typescript
async function getFailedDeliveries(notificationHistoryId: number) {
  const { data: failures } = await supabaseAdmin
    .from('push_delivery_log')
    .select(`
      participant_id,
      delivery_status,
      error_message,
      status_code,
      last_attempt_at
    `)
    .eq('notification_history_id', notificationHistoryId)
    .eq('delivery_status', 'failed');

  return failures?.map(f => ({
    userId: f.participant_id,
    error: f.error_message,
    httpStatus: f.status_code,
    lastTry: f.last_attempt_at,
    isExpiredSubscription: f.status_code === 410,
  })) || [];
}
```

---

## Using the Admin Dashboard Programmatically

### From Your Component

```tsx
import { useFetcher } from 'react-router-dom';

export function SendNotificationForm() {
  const fetcher = useFetcher();

  const handleSendBroadcast = async (title: string, body: string) => {
    const formData = new FormData();
    formData.append('_action', 'send-broadcast');
    formData.append('title', title);
    formData.append('body', body);
    formData.append('eventType', 'custom');

    fetcher.submit(formData, { method: 'POST' });
  };

  return (
    <div>
      <button onClick={() => handleSendBroadcast('Hello!', 'Test message')}>
        Send
      </button>
      {fetcher.data?.success && (
        <p>Sent to {fetcher.data.sent} users!</p>
      )}
    </div>
  );
}
```

---

## Complete Implementation Checklist

### Step 1: Update admin.zone-control.tsx
- [ ] Import `sendPushNotificationWithHistory` from `push-notifications-enhanced.server`
- [ ] Update zone opening notification (around line 85-95)
- [ ] Update zone closing notification (around line 135-145)
- [ ] Test both scenarios

### Step 2: Update admin.event-markers.tsx
- [ ] Import `sendPushNotificationWithHistory`
- [ ] Update critical event notification (around line 168)
- [ ] Update event resolved notification (around line 60-65)
- [ ] Update event cancelled notification
- [ ] Test all scenarios

### Step 3: Update api.events.submit.tsx
- [ ] If there's a notification call, update it (around line 74)
- [ ] Use same pattern as above

### Step 4: Update other files
- [ ] Check `dashboard._index.tsx` for notifications
- [ ] Check `admin.manual-scan.tsx` for notifications
- [ ] Check `admin.leaderboard.tsx` for notifications
- [ ] Check any other admin files

### Step 5: Test
- [ ] Deploy code
- [ ] Go to `/admin/push-history`
- [ ] Send test notification
- [ ] Verify it appears in history
- [ ] Check delivery status

### Step 6: Monitor
- [ ] Use queries above to check success rates
- [ ] Identify any problematic subscriptions
- [ ] Use admin dashboard regularly

---

## Debugging: Common Issues

### "Unknown action" error
**Problem**: API returns `{ error: 'Unknown action' }`

**Solution**: Check your `action` field in the request:
```javascript
// ❌ Wrong
{ "type": "broadcast" }

// ✅ Correct  
{ "action": "broadcast" }
```

### "No active subscriptions found"
**Problem**: Message sent but says no subscriptions

**Solution**: Check if users have subscribed:
```sql
SELECT COUNT(*) FROM push_subscriptions WHERE is_active = true;
```

### History not updating
**Problem**: Sent notification but history empty

**Solution**: Verify you're using correct import:
```typescript
// ❌ Won't track
import { sendBulkPushNotifications } from '~/lib/push-notifications.server';

// ✅ Will track
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';
```

### Retry-failed doesn't work
**Problem**: Clicking retry shows no effect

**Solution**: Verify there are actually failed deliveries:
```sql
SELECT COUNT(*) FROM push_delivery_log 
WHERE notification_history_id = 123 
AND delivery_status = 'failed';
```

---

## Performance Considerations

### Indexes Created
```sql
- idx_push_history_participant
- idx_push_history_event_type
- idx_push_history_sent_at
- idx_push_history_status
- idx_push_delivery_notification
- idx_push_delivery_participant
- idx_push_delivery_status
```

### Query Performance Tips

```typescript
// ✅ Fast - uses index
WHERE event_type = 'zone_opened'

// ✅ Fast - uses index
WHERE is_active = true

// ⚠️ Slower - full scan
WHERE event_data->>'zoneId' = '123'

// Better - use JSON operators
WHERE event_data @> '{"zoneId":"123"}'
```

---

## Production Checklist

- [ ] Database migration applied
- [ ] All notification calls updated
- [ ] Routes configured in routes.ts
- [ ] Admin can access `/admin/push-history`
- [ ] Test broadcast sent and tracked
- [ ] Test targeted message sent and tracked
- [ ] Test retry failed functionality
- [ ] Monitor success rates for first hour
- [ ] Set up alerts for high failure rate
- [ ] Document event types used
- [ ] Brief team on new features

---

## Support & Questions

For issues or questions:
1. Check `docs/PUSH-NOTIFICATIONS-TRACKING.md` for full guide
2. Check `docs/PUSH-NOTIFICATIONS-IMPLEMENTATION.md` for setup
3. Check queries above for debugging
4. Review this file for code examples
