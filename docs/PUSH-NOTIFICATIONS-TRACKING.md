# Push Notifications: History Tracking & Targeted Messaging

## Overview

This update adds comprehensive push notification tracking and enables targeted messaging to specific participants. You can now:

1. **Track all push notifications** - Every notification sent is logged with delivery status
2. **Send targeted messages** - To specific participants, zones, or custom criteria
3. **Retry failed notifications** - Automatically handle and retry failed deliveries
4. **View detailed history** - See delivery status, failures, and event details
5. **Event-based logging** - Automatic categorization by event type (zone opened, achievement, etc.)

## What's New

### Database Tables

1. **`push_notifications_history`** - Complete audit log of all notifications
   - Tracks title, body, event type, target criteria
   - Records success/failure counts and status
   - Stores which admin sent it (if manual)

2. **`push_delivery_log`** - Per-recipient delivery status
   - Individual status for each recipient
   - Error messages and HTTP status codes
   - Retry attempt tracking

3. **`push_recipient_groups`** - Pre-defined recipient groups
   - Save recurring recipient criteria
   - Use for quick targeting later

4. **`push_message_templates`** - Reusable message templates
   - Save and reuse common messages
   - Link to recipient groups for one-click sending

### New API Endpoint

**`POST /api/push-send`** - Send and manage push notifications

Actions available:
- `broadcast` - Send to all active subscribers
- `targeted` - Send to specific criteria
- `to-users` - Send to specific participant IDs
- `get-history` - Retrieve notification history
- `get-history-details` - Get detailed info for a notification
- `retry-failed` - Retry failed deliveries

### New Admin Page

**`/admin/push-history`** - Full push notification management interface

Features:
- 📊 **History Tab**: View all notifications with filtering by event type
- 📢 **Broadcast Tab**: Send message to all subscribers
- 🎯 **Targeted Tab**: Send to specific participants

## Setup Instructions

### 1. Run Database Migration

```bash
# Navigate to your project
cd /path/to/site

# Run the migration
psql -h your_db_host -U your_db_user -d your_db_name -f scripts/add-push-history-tracking.sql
```

Or use Supabase SQL editor:
1. Go to SQL Editor in Supabase dashboard
2. Create a new query
3. Paste the contents of `scripts/add-push-history-tracking.sql`
4. Run the query

### 2. Update Existing Push Notification Calls

Update your existing push notification code to use the new functions with history tracking:

**Before:**
```typescript
import { sendBulkPushNotifications } from '~/lib/push-notifications.server';

const result = await sendBulkPushNotifications(subscriptions, notification);
```

**After:**
```typescript
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';

const result = await sendPushNotificationWithHistory(
  subscriptions,
  notification,
  {
    eventType: 'zone_opened',
    eventData: { zoneId: 123, zoneName: 'Zone A' },
    sentBy: userId, // Optional: track who sent it
  }
);
```

### 3. Update Zone Control Events

[admin.zone-control.tsx](apps/web/app/routes/admin.zone-control.tsx) - Around lines 85-95 and 135-145:

```typescript
// When opening a zone
const result = await sendPushNotificationWithHistory(
  subscriptions,
  notificationTemplates.zoneOpened(zone.order, zone.title),
  {
    eventType: 'zone_opened',
    eventData: { 
      zoneId: zone.id,
      zoneName: zone.title,
      zoneNumber: zone.order
    },
    sentBy: userId,
  }
);

// When closing a zone
const result = await sendPushNotificationWithHistory(
  subscriptions,
  notificationTemplates.zoneClosed(zone.order, zone.title),
  {
    eventType: 'zone_closed',
    eventData: { 
      zoneId: zone.id,
      zoneName: zone.title,
      zoneNumber: zone.order
    },
    sentBy: userId,
  }
);
```

### 4. Update Event Marker Notifications

[admin.event-markers.tsx](apps/web/app/routes/admin.event-markers.tsx):

```typescript
// When creating an event marker
const result = await sendPushNotificationWithHistory(
  subscriptions,
  notificationTemplates.criticalEvent(title, description, { 
    type: eventType,
    severity,
    source: 'admin'
  }),
  {
    eventType: 'critical_event',
    eventData: { 
      eventTitle: title,
      eventType,
      severity,
      location: coords
    },
    sentBy: userId,
  }
);

// When resolving an event
const result = await sendPushNotificationWithHistory(
  subscriptions,
  notificationTemplates.eventResolved(marker.title),
  {
    eventType: 'event_resolved',
    eventData: { 
      eventId: marker.id,
      eventTitle: marker.title
    },
    sentBy: userId,
  }
);
```

## Usage Examples

### Send Broadcast Message

```typescript
const response = await fetch('/api/push-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'broadcast',
    title: '🏁 Event Starting Soon!',
    body: 'The rally begins in 1 hour. Get ready!',
    eventType: 'reminder',
  }),
});

const result = await response.json();
console.log(`Sent to ${result.sent} participants, ${result.failed} failed`);
```

### Send Targeted Message to Specific Users

```typescript
const response = await fetch('/api/push-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'to-users',
    title: '🎯 Special Challenge',
    body: 'You have been selected for a special challenge!',
    userIds: ['user-id-1', 'user-id-2', 'user-id-3'],
    eventType: 'custom',
  }),
});
```

### Send to Users in Specific Zones

```typescript
const response = await fetch('/api/push-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'targeted',
    title: '🎯 Zone Challenge',
    body: 'Special bonus points in Zone 3 for the next 30 minutes!',
    criteria: {
      zones: ['zone-id-1', 'zone-id-2'],
    },
    eventType: 'zone_challenge',
  }),
});
```

### Get Notification History

```typescript
const response = await fetch('/api/push-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-history',
    limit: 50,
    offset: 0,
    eventType: 'zone_opened', // Optional filter
  }),
});

const { history, total } = await response.json();
```

### Retry Failed Notifications

```typescript
const response = await fetch('/api/push-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'retry-failed',
    historyId: 123, // From notification history
  }),
});

const result = await response.json();
console.log(`Retried ${result.retried} notifications`);
```

## Admin Interface

Access the push notification center at `/admin/push-history`

### History Tab
- View all sent notifications
- Filter by event type
- See delivery success/failure rates
- Retry failed notifications
- View message details

### Broadcast Tab
- Send message to all subscribers
- Customize title and body
- Categorize by event type

### Targeted Tab
- Select specific participants
- Send custom message to selection
- Track delivery for target group

## Event Types

Use these event types for categorization:

- `zone_opened` - Zone became available
- `zone_closed` - Zone was closed
- `critical_event` - Important incident on map
- `event_resolved` - Incident resolved
- `achievement_unlocked` - Participant earned achievement
- `leaderboard_update` - Position changed
- `reminder` - Event countdown
- `custom` - Manual/custom message

## Monitoring & Maintenance

### Check Delivery Status
```sql
SELECT 
  notification_history_id,
  delivery_status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE delivery_status = 'sent') as successful
FROM push_delivery_log
GROUP BY notification_history_id, delivery_status
ORDER BY notification_history_id DESC;
```

### Find Failed Notifications
```sql
SELECT 
  pnh.id,
  pnh.title,
  pnh.event_type,
  COUNT(pdl.id) as failed_count,
  MAX(pdl.error_message) as last_error
FROM push_notifications_history pnh
LEFT JOIN push_delivery_log pdl ON pnh.id = pdl.notification_history_id
WHERE pdl.delivery_status = 'failed'
GROUP BY pnh.id, pnh.title, pnh.event_type
ORDER BY pnh.sent_at DESC;
```

### Clean Up Expired Subscriptions
```sql
DELETE FROM push_subscriptions 
WHERE is_active = false 
AND updated_at < NOW() - INTERVAL '30 days';
```

## Security Notes

- ✅ Only admins can send notifications or view full history
- ✅ Participants can view only their own delivery logs
- ✅ Row-level security (RLS) enforces permissions
- ✅ All actions logged with admin user ID
- ✅ Sensitive data (subscription endpoints) truncated in logs

## Troubleshooting

### Notifications not being tracked
- Ensure migration was applied: `SELECT * FROM push_notifications_history LIMIT 1;`
- Check that you're using `sendPushNotificationWithHistory()` instead of old functions
- Verify admin user has proper RLS permissions

### Failed retry attempts
- Check `push_delivery_log` for error messages: `SELECT DISTINCT error_message FROM push_delivery_log WHERE delivery_status = 'failed';`
- Some subscriptions may be truly invalid (410/404 errors)
- Mark these as inactive and users need to re-subscribe

### Missing participant in targeted list
- Ensure participant has active subscription: `SELECT * FROM push_subscriptions WHERE is_active = true;`
- Check criteria matches participant data: `SELECT * FROM check_ins WHERE participant_id = '...' AND zone_id = '...';`

## Next Steps

1. ✅ Run database migration
2. ✅ Add routes to your routes.ts (already done)
3. ✅ Update existing push notification calls to use new history tracking
4. ✅ Test sending broadcasts and targeted messages
5. ✅ Monitor `/admin/push-history` for delivery status

## Files Modified

- `scripts/add-push-history-tracking.sql` - Database migration
- `apps/web/app/lib/push-notifications-enhanced.server.ts` - Enhanced push library
- `apps/web/app/routes/api.push-send.tsx` - New API endpoint
- `apps/web/app/routes/admin.push-history.tsx` - Admin interface
- `apps/web/app/routes.ts` - Added new routes
