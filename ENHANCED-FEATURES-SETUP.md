# 🎉 Enhanced Features Setup Guide

## Features Implemented

You now have 5 powerful new features:

1. **📧 Email Notification System** - Automatic emails for registrations, payments, submissions
2. **📸 Photo Gallery** - User-uploaded photos with admin moderation
3. **🔔 Push Notifications** - Real-time web push notifications
4. **🏆 Achievements & Gamification** - Unlock achievements and earn points
5. **📜 Certificate Generation** - PDF certificates for participants

---

## 🚀 Quick Setup

### 1. Database Migration

The database has already been updated with the enhanced features schema. If you need to re-run it:

```bash
# From project root
psql $DATABASE_URL -f scripts/add-enhanced-features.sql
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@deurdenbocht.be

# Push Notifications (Generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:info@deurdenbocht.be

# Public URL for emails and QR codes
PUBLIC_URL=https://deurdenbocht.be
```

### 3. Generate VAPID Keys for Push Notifications

```bash
cd apps/web
npx web-push generate-vapid-keys
```

Copy the output to your `.env` file.

### 4. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Create an API key
4. Add your domain or use their test domain
5. Copy API key to `.env`

---

## 📧 Email System

### What's Automated

✅ **Registration Confirmation** - Sent after payment with QR code
✅ **Payment Confirmation** - Sent when payment is completed
✅ **Rally Submission** - Sent when rally codes are submitted
✅ **Event Reminders** - 7 days and 1 day before event
✅ **Critical Event Alerts** - For urgent notifications

### Templates

All email templates are in `/apps/web/app/lib/email.server.ts`

You can customize:
- Email design (HTML templates)
- Subject lines
- Content
- Colors and branding

### Testing Emails

```bash
# In your terminal
curl -X POST http://localhost:5173/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 📸 Photo Gallery

### Setup (One-time)

**Create Supabase Storage Bucket:**

1. Go to Supabase Dashboard > Storage
2. Click "New Bucket"
3. Name: `participant-photos`
4. Set to **Public** ✓
5. Save

See detailed setup: `docs/PHOTO-UPLOAD-SETUP.md`

### For Participants

1. Navigate to `/gallery`
2. Click "Upload Foto"
3. Select an image file (JPG, PNG, or WebP - max 5MB)
4. Add optional caption and location
5. Submit for approval

Photos are directly uploaded to Supabase Storage - no external hosting needed!

### For Admins

1. Go to `/admin/gallery`
2. Review pending photos
3. Approve or reject
4. Mark photos as "Featured" for homepage

### Technical Details

- **Storage**: Supabase Storage (public bucket)
- **Max size**: 5 MB per photo
- **Formats**: JPG, PNG, WebP
- **Validation**: Client + server side
- **Auto cleanup**: Failed uploads are removed
- **URL format**: `{supabase-url}/storage/v1/object/public/participant-photos/rally-photos/{file}`

---

## 🔔 Push Notifications

### For Participants

Add this component to dashboard:

```tsx
import { PushNotificationButton } from '~/components/PushNotificationButton';

// In your dashboard
<PushNotificationButton />
```

### For Admins

1. Go to `/admin/push-notifications`
2. See active subscriptions count
3. Send quick actions (Rally Start, Zone Open, etc.)
4. Or send custom notifications

### Notification Types

- 🏁 Rally Start
- 🎯 Zone Opened/Closed
- 🚨 Critical Events (road closures, accidents)
- 🏆 Leaderboard Updates
- 🎉 Achievement Unlocked
- ⏰ Event Reminders

---

## 🏆 Achievements

### Available Achievements

| Achievement | Icon | Points | Criteria |
|------------|------|--------|----------|
| First Blood | 🎯 | 10 | Complete first zone |
| Halfway Hero | ⭐ | 25 | Complete 4 zones |
| Zone Master | 🏆 | 50 | Complete all 8 zones |
| Perfect Score | 💯 | 100 | All answers correct |
| Early Bird | 🌅 | 15 | Check in before 07:00 |
| Weather Warrior | 🌧️ | 30 | Complete in bad weather |
| Marathon Rider | 🛣️ | 40 | Ride over 550km |
| Social Butterfly | 📸 | 20 | Upload 5 photos |
| Popular | ❤️ | 25 | Get 10 photo likes |
| Veteran | 🎖️ | 50 | Multi-year participant |

### How It Works

Achievements are automatically checked and unlocked when:
- Rally submissions are made
- Photos are uploaded
- Check-ins happen
- Submissions are updated

View achievements at `/achievements`

---

## 📜 Certificates

### Types

1. **Completion Certificate** - For all participants
   - Download at `/certificates/completion`
   
2. **Winner Certificate** - For top 10 finishers
   - Download at `/certificates/winner`

### Customization

Edit certificate templates in `/apps/web/app/lib/certificates.tsx`

You can customize:
- Layout and design
- Colors and fonts
- Content and text
- Stats displayed

---

## 🧪 Testing Everything

### 1. Test Emails

```bash
# Register a test participant
# Complete payment
# Check email (use resend dashboard to see test emails)
```

### 2. Test Photos

```bash
# Upload a photo as participant
# Check admin/gallery for approval
# Approve photo
# Verify it shows in /gallery
```

### 3. Test Push Notifications

```bash
# Enable notifications in dashboard
# Go to admin/push-notifications
# Send test notification
# Verify notification appears
```

### 4. Test Achievements

```bash
# Submit rally with 1 zone complete
# Check /achievements
# Verify "First Blood" unlocked
```

### 5. Test Certificates

```bash
# Complete rally submission
# Go to /certificates/completion
# Verify PDF downloads
```

---

## 🎨 Customization

### Email Templates

Edit colors, content, layout in:
```
apps/web/app/lib/email.server.ts
```

### Achievement Criteria

Modify achievement logic in:
```
apps/web/app/lib/achievements.server.ts
```

### Certificate Design

Update PDF templates in:
```
apps/web/app/lib/certificates.tsx
```

### Push Notification Messages

Edit notification templates in:
```
apps/web/app/lib/push-notifications.server.ts
```

---

## 📊 Admin Features

### New Admin Routes

- `/admin/gallery` - Manage photos
- `/admin/push-notifications` - Send push notifications

### Email Logs

Track all sent emails:
```sql
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50;
```

### Push Subscription Status

See active subscriptions:
```sql
SELECT COUNT(*) FROM push_subscriptions WHERE is_active = TRUE;
```

### Achievement Stats

See who has what achievements:
```sql
SELECT 
  p.first_name,
  p.last_name,
  COUNT(pa.id) as achievements_count,
  SUM(a.points) as total_points
FROM participants p
LEFT JOIN participant_achievements pa ON p.id = pa.participant_id
LEFT JOIN achievements a ON pa.achievement_id = a.id
GROUP BY p.id
ORDER BY total_points DESC;
```

---

## 🔧 Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` in `.env`
2. Verify domain is added in Resend dashboard
3. Check logs: `email_logs` table
4. Test with Resend's test domain first

### Push Notifications Not Working

1. Check VAPID keys are set correctly
2. Verify HTTPS is enabled (required for push)
3. Check browser console for errors
4. Test with Chrome first (best support)

### Achievements Not Unlocking

1. Check achievement criteria in code
2. Verify data is being submitted correctly
3. Check `participant_achievements` table
4. Review logs when submitting rally codes

### Certificates Not Generating

1. Check if react-pdf is installed
2. Verify participant has submission
3. Check browser console for PDF errors
4. Test with simple participant data first

---

## 🚀 Next Steps

### Before Launch

- [ ] Test all email templates
- [ ] Upload test photos and approve them
- [ ] Send test push notification
- [ ] Generate test certificate
- [ ] Unlock test achievements

### On Event Day

- [ ] Send "Rally Start" push notification
- [ ] Monitor photo uploads
- [ ] Check email logs
- [ ] Watch achievement unlocks
- [ ] Be ready to send event alerts

### After Event

- [ ] Generate winner certificates
- [ ] Send thank you emails
- [ ] Feature best photos
- [ ] Export achievement stats
- [ ] Collect feedback

---

## 💡 Pro Tips

1. **Email Frequency**: Don't spam! Only send important updates
2. **Photo Moderation**: Review photos daily during event week
3. **Push Notifications**: Test with your account first
4. **Achievements**: Balance easy and hard achievements
5. **Certificates**: Generate after final results are confirmed

---

## 📞 Support

If you need help:
1. Check this guide first
2. Review code comments
3. Check console logs
4. Test in isolation
5. Ask for help with specific error messages

---

## 🎉 Features Summary

You now have a fully-featured rally management system with:

✅ Automated email notifications
✅ Social photo sharing
✅ Real-time push notifications  
✅ Gamification with achievements
✅ Professional PDF certificates

**Happy rallying! 🏍️**
