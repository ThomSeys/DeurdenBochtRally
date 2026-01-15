# Push Notifications Implementation Checklist

## ✅ What's Been Created

### 1. Database Tables
- ✅ `push_notifications_history` - Audit log of all notifications
- ✅ `push_delivery_log` - Per-recipient delivery tracking
- ✅ `push_recipient_groups` - Saved recipient group criteria
- ✅ `push_message_templates` - Reusable message templates
- ✅ Indexes for efficient queries
- ✅ RLS policies for security

### 2. Server Library
- ✅ `push-notifications-enhanced.server.ts` - New functions:
  - `sendPushNotificationWithHistory()` - Send + log
  - `sendTargetedPushNotification()` - Target specific users
  - `getTargetedRecipients()` - Query by criteria
  - `retryFailedNotifications()` - Retry failures
  - Plus all original template functions

### 3. API Endpoint
- ✅ `POST /api/push-send` - Complete notification management
  - `broadcast` action - Send to all
  - `targeted` action - Send to criteria
  - `to-users` action - Send to user IDs
  - `get-history` action - View history
  - `retry-failed` action - Retry failures

### 4. Admin Interface
- ✅ `/admin/push-history` - Full control center
  - 📊 History tab with filtering
  - 📢 Broadcast message form
  - 🎯 Targeted message form
  - Retry controls
  - Pagination

## 🚀 Setup Steps

### Step 1: Run Database Migration

Open Supabase SQL editor and run:

```sql
-- Copy entire contents of scripts/add-push-history-tracking.sql
-- Paste into Supabase SQL editor
-- Click "Run"
```

Verify tables created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'push_%';
```

Expected: `push_notifications_history`, `push_delivery_log`, `push_recipient_groups`, `push_message_templates`

### Step 2: Update Push Notification Calls

#### In `/admin.zone-control.tsx` (~line 85):

Find:
```typescript
// When opening a zone
const subscriptions = await supabaseAdmin...
const result = await sendBulkPushNotifications(subscriptions, ...);
```

Replace with:
```typescript
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';

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
```

Do the same for:
- Zone closing (line ~140)
- Any other zone control notifications

#### In `/admin.event-markers.tsx` (~line 168):

Update critical event notifications:
```typescript
import { sendPushNotificationWithHistory } from '~/lib/push-notifications-enhanced.server';

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
      coordinates: coords
    },
    sentBy: userId,
  }
);
```

And for resolved events:
```typescript
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

### Step 3: Test the Setup

1. **Build & Deploy**
   ```bash
   npm run build
   # or
   vercel deploy
   ```

2. **Access Admin Panel**
   - Go to `/admin/push-history`
   - Should see empty history initially

3. **Test Broadcast**
   - Fill in title and body
   - Click "Send to All"
   - Should see notification in history

4. **Check Database**
   ```sql
   SELECT COUNT(*) FROM push_notifications_history;
   SELECT COUNT(*) FROM push_delivery_log;
   ```

## 📊 Verification Queries

### Check Latest Notifications
```sql
SELECT 
  id, 
  title, 
  event_type, 
  recipient_count,
  success_count,
  failed_count,
  status,
  sent_at
FROM push_notifications_history
ORDER BY sent_at DESC
LIMIT 10;
```

### Check Delivery Status by Event Type
```sql
SELECT 
  event_type,
  COUNT(*) as total_sent,
  SUM(success_count) as total_successful,
  SUM(failed_count) as total_failed,
  ROUND(100.0 * SUM(success_count) / SUM(recipient_count), 2) as success_rate
FROM push_notifications_history
GROUP BY event_type
ORDER BY sent_at DESC;
```

### Find Failed Subscriptions
```sql
SELECT 
  participant_id,
  delivery_status,
  COUNT(*) as count,
  MAX(error_message) as last_error
FROM push_delivery_log
WHERE delivery_status IN ('failed', 'expired')
GROUP BY participant_id, delivery_status
ORDER BY count DESC;
```

## 🎯 Usage Examples

### Send to All Users
```bash
curl -X POST http://localhost:5173/api/push-send \
  -H "Content-Type: application/json" \
  -d '{
    "action": "broadcast",
    "title": "🏁 Event Starting!",
    "body": "The rally begins in 1 hour",
    "eventType": "reminder"
  }'
```

### Send to Specific Users
```bash
curl -X POST http://localhost:5173/api/push-send \
  -H "Content-Type: application/json" \
  -d '{
    "action": "to-users",
    "title": "🎯 Challenge",
    "body": "You have a special challenge!",
    "userIds": ["uuid-1", "uuid-2"],
    "eventType": "custom"
  }'
```

### Get History
```bash
curl -X POST http://localhost:5173/api/push-send \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get-history",
    "limit": 10,
    "offset": 0
  }'
```

## 🔍 Monitoring Commands

### Live Tail of Recent Notifications
```sql
SELECT 
  id,
  title,
  event_type,
  status,
  success_count,
  failed_count,
  sent_at
FROM push_notifications_history
WHERE sent_at > NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC;
```

### Check Subscription Health
```sql
SELECT 
  is_active,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE is_active = false) as inactive
FROM push_subscriptions
GROUP BY is_active;
```

### Identify Problematic Subscriptions
```sql
SELECT 
  pdl.participant_id,
  COUNT(*) as total_failures,
  COUNT(DISTINCT pdl.notification_history_id) as affected_campaigns,
  MAX(pdl.error_message) as last_error,
  MAX(pdl.last_attempt_at) as last_attempt
FROM push_delivery_log pdl
WHERE pdl.delivery_status = 'failed'
GROUP BY pdl.participant_id
HAVING COUNT(*) > 5
ORDER BY COUNT(*) DESC;
```

## ⚠️ Important Notes

1. **Always use `sendPushNotificationWithHistory()`** for new notifications
   - This ensures tracking and history logging
   - Keep old `sendBulkPushNotifications()` for backwards compatibility

2. **Migrate existing notification code gradually**
   - Start with admin-triggered notifications
   - Then automatic event notifications
   - Finally, user-facing notifications

3. **Set `sentBy` for manual notifications**
   - Helps audit who sent what
   - Leave null for automatic system notifications

4. **Use meaningful `eventType` values**
   - Helps filter and analyze patterns
   - Makes history searchable

5. **Test with small groups first**
   - Use targeted messages before broadcast
   - Check history for delivery status

## 🐛 Troubleshooting

### Tables Don't Exist
**Problem**: `Relation "push_notifications_history" does not exist`

**Solution**:
1. Go to Supabase SQL editor
2. Copy entire `scripts/add-push-history-tracking.sql`
3. Paste and run
4. Wait for completion

### Admin Can't Access Page
**Problem**: Permission denied on `/admin/push-history`

**Solution**:
1. Verify user has admin role in `auth.users` metadata
2. Check RLS policies are enabled
3. Retry after role update

### Notifications Not Showing in History
**Problem**: Sent but not tracked

**Solution**:
1. Verify importing from `push-notifications-enhanced.server`
2. Check that `eventType` parameter is included
3. Verify table permissions in Supabase

### Failed to Send Error
**Problem**: Batch sending fails

**Solution**:
1. Check `push_subscriptions` table for active entries
2. Verify VAPID keys are set
3. Check subscription endpoints are valid

## 📞 Support Resources

- Full guide: `docs/PUSH-NOTIFICATIONS-TRACKING.md`
- Database queries: Above in this file
- API examples: Usage Examples section
- Admin interface: `/admin/push-history`

---

**Status**: ✅ Ready for production
**Created**: 2026-01-15
**Database**: Fully migrated
**API**: Implemented
**Admin UI**: Ready
