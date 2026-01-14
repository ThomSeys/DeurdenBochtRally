# 🎉 Enhanced Features Setup Guide

## What's Been Added

Your Deur Den Bocht Rally website now includes 5 major feature enhancements:

1. ✉️ **Email Notification System** - Automated emails for registration, payments, submissions
2. 📸 **Photo Gallery & Upload** - Social sharing and community engagement
3. 🔔 **Push Notifications** - Real-time updates during events
4. 🏆 **Achievements & Gamification** - Unlock badges and earn points
5. 📜 **Certificate Generation** - Professional PDF certificates

---

## 📋 Required Setup Steps

### 1. Database Migration

Run the SQL migration to create new tables:

```bash
cd "/Users/thomasseyssens/Desktop/Deur Den Bocht/2026/site"

# Connect to your Supabase database and run:
psql $DATABASE_URL < scripts/add-enhanced-features.sql

# OR use Supabase dashboard:
# 1. Go to SQL Editor in Supabase dashboard
# 2. Copy contents of scripts/add-enhanced-features.sql
# 3. Execute the SQL
```

This creates tables for:
- `participant_photos` - User uploaded photos
- `achievements` - Achievement definitions
- `participant_achievements` - Unlocked achievements
- `push_subscriptions` - Web push subscriptions
- `certificates` - Certificate generation tracking
- `photo_likes` - Photo engagement
- `email_logs` - Email delivery audit trail

### 2. Environment Variables

Add these to your `.env` file (or Vercel environment variables):

```bash
# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@deurdenbocht.be
PUBLIC_URL=https://your-domain.com

# Push Notifications (Web Push VAPID keys)
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:info@deurdenbocht.be
```

#### Getting Resend API Key:
1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain (deurdenbocht.be)
3. Generate an API key
4. Add to environment variables

#### Generating VAPID Keys:
```bash
npx web-push generate-vapid-keys
```

Copy the output into your environment variables.

### 3. Sanity Schema Update (Optional)

If you want to manage achievements or photo moderation in Sanity, you can add schemas. For now, achievements are managed in the database.

### 4. Deploy to Production

```bash
# Push to git
git add .
git commit -m "feat: Add email, photos, push notifications, achievements, and certificates"
git push

# Deploy to Vercel (auto-deploys if connected to git)
# Or manually:
vercel --prod
```

Don't forget to add environment variables in Vercel dashboard!

---

## 🚀 Feature Documentation

### 1. Email Notifications

**What it does:**
- Sends automated emails for registration confirmations
- Payment confirmations with invoice details
- Rally submission confirmations with leaderboard position
- Event reminders (1 week, 1 day before)
- Critical event notifications (accidents, road closures)

**Email templates available:**
- `registrationConfirmationEmail()` - Welcome email with QR code
- `paymentConfirmationEmail()` - Payment receipt
- `rallySubmissionEmail()` - Submission confirmation with stats
- `eventReminderEmail()` - Pre-event reminders
- `criticalEventNotification()` - Emergency alerts

**Sending an email:**
```typescript
import { sendEmail, registrationConfirmationEmail } from '~/lib/email.server';

const email = registrationConfirmationEmail(participant);
await sendEmail({
  to: participant.email,
  ...email,
});
```

**Where emails are sent:**
- `api.webhook.tsx` - After payment completion
- `dashboard.rally-submission.tsx` - After rally submission

**Future additions:**
- Admin panel to send bulk emails
- Scheduled reminder emails (cron job)
- Email preferences in user settings

---

### 2. Photo Gallery & Upload

**User Routes:**
- `/gallery` - View and upload photos
- Upload photos with caption and location
- Like other participants' photos
- View your own pending/approved photos

**Admin Routes:**
- `/admin/gallery` - Moderate photo uploads
- Approve/reject photos
- Feature photos on homepage
- Delete inappropriate content

**How it works:**
1. User uploads photo URL (must be hosted separately - Sanity, Cloudinary, etc.)
2. Photo goes into pending state (requires admin approval)
3. Admin approves/rejects in admin panel
4. Approved photos visible to all users
5. Featured photos can be highlighted

**Upload flow:**
```
User → Upload Form → Pending → Admin Approval → Public Gallery
```

**Next steps:**
- Add direct image upload (Cloudinary or Supabase Storage)
- Auto-moderation with AI (Azure Content Moderator)
- Photo albums/collections
- Download high-res originals

---

### 3. Push Notifications

**User experience:**
1. User clicks "Enable Notifications" in dashboard
2. Browser asks for permission
3. Subscription saved to database
4. User receives real-time updates

**Notification types:**
- Rally start announcements
- Rally zone opened/closed
- Critical events (accidents, road closures)
- Leaderboard position changes
- Achievement unlocks

**Admin sending:**
```typescript
import { sendBulkPushNotifications, notificationTemplates } from '~/lib/push-notifications.server';

// Get all active subscriptions
const { data: subscriptions } = await supabaseAdmin
  .from('push_subscriptions')
  .select('*')
  .eq('is_active', true);

// Send notification
await sendBulkPushNotifications(
  subscriptions,
  notificationTemplates.criticalEvent('Road Closure', 'N8 closed near Zone 3')
);
```

**Component usage:**
```tsx
import { PushNotificationButton } from '~/components/PushNotificationButton';

<PushNotificationButton />
```

**Future additions:**
- Admin UI for sending push notifications
- Scheduled notifications
- Notification preferences per user
- Rich media in notifications

---

### 4. Achievements & Gamification

**Achievement System:**
- 10 default achievements (more can be added in database)
- Points system for each achievement
- Auto-unlock when criteria met
- Achievement leaderboard

**Default Achievements:**
1. **First Blood** (10pts) - Complete first rally zone
2. **Halfway Hero** (25pts) - Complete 4 zones
3. **Zone Master** (50pts) - Complete all 8 zones
4. **Perfect Score** (100pts) - All answers correct
5. **Early Bird** (15pts) - Check in before 07:00
6. **Weather Warrior** (30pts) - Complete in bad weather
7. **Marathon Rider** (40pts) - Ride over 550km
8. **Social Butterfly** (20pts) - Upload 5 photos
9. **Popular** (25pts) - Get 10 likes on photos
10. **Veteran** (50pts) - Participated in previous editions

**Routes:**
- `/achievements` - View all achievements and progress
- Shows locked/unlocked state
- Progress bars and stats
- Leaderboard by achievement points

**Auto-checking:**
Achievements are automatically checked and unlocked when:
- Rally submission is saved
- Photos are uploaded
- Check-in occurs
- Specific criteria is met

**Adding new achievements:**
```sql
INSERT INTO achievements (name, title, description, icon, category, points, criteria) VALUES
  ('speedster', 'Speedster', 'Complete all zones in under 10 hours', '⚡', 'special', 75, '{"total_time_under": 600}');
```

---

### 5. Certificate Generation

**Certificate Types:**
1. **Completion Certificate** - For all participants
2. **Winner Certificate** - For top 10 finishers

**Routes:**
- `/certificates/completion` - Download completion certificate
- `/certificates/winner` - Download winner certificate (if top 10)

**What's included:**
- Participant name
- Rally statistics (zones, distance, points)
- Rank (for winner certificates)
- Professional design with branding
- PDF format, ready to print

**Technical:**
- Uses @react-pdf/renderer for PDF generation
- Generated on-demand (not pre-generated)
- Tracked in `certificates` table
- Can add download tracking

**Future additions:**
- Custom certificate designs per year
- Email certificates automatically
- Social media sharing images
- Certificate verification QR code

---

## 🧪 Testing Checklist

### Email Testing
- [ ] Register new participant → check email received
- [ ] Complete payment → check confirmation email
- [ ] Submit rally codes → check submission email
- [ ] Verify email templates render correctly
- [ ] Test on mobile email clients

### Photo Gallery Testing
- [ ] Upload photo as participant → appears in "My Photos"
- [ ] Photo shows as "pending" before approval
- [ ] Admin can see pending photos
- [ ] Admin approves photo → appears in public gallery
- [ ] Like photo → count increases
- [ ] Featured photos have special styling

### Push Notifications Testing
- [ ] Click "Enable Notifications" → browser permission requested
- [ ] Subscribe successfully → saved in database
- [ ] Send test notification from backend
- [ ] Notification appears even when tab not active
- [ ] Unsubscribe works correctly

### Achievements Testing
- [ ] Complete zone → "First Blood" unlocks
- [ ] Complete 4 zones → "Halfway Hero" unlocks
- [ ] Complete all zones → "Zone Master" unlocks
- [ ] Upload photos → "Social Butterfly" progress
- [ ] Check achievements page → progress bars correct
- [ ] Achievement points add to total

### Certificates Testing
- [ ] Download completion certificate → PDF generates
- [ ] Check participant name and stats correct
- [ ] Winner certificate only accessible to top 10
- [ ] PDF prints correctly
- [ ] Certificate tracked in database

---

## 📊 Admin Dashboard Updates

New admin panels available:

1. **`/admin/gallery`**
   - Moderate photo uploads
   - Approve/reject pending photos
   - Feature photos
   - View all approved photos

2. **Photo Management**
   - See pending count in dashboard
   - Batch approval (future)
   - Moderation logs

---

## 🎨 Participant Dashboard Updates

New features in `/dashboard`:

1. **Photo Gallery Card** - Link to upload and view photos
2. **Achievements Card** - Link to achievements page
3. **Certificate Card** - Download certificates
4. **Push Notifications Button** - Enable/disable notifications

---

## 🔧 Troubleshooting

### Emails not sending
- Check RESEND_API_KEY is set correctly
- Verify domain is verified in Resend
- Check email_logs table for errors
- Look at server logs for "email" errors

### Push notifications not working
- Check VAPID keys are set
- Verify service worker is registered (check DevTools)
- Test in different browsers (Chrome, Firefox)
- Check push_subscriptions table for active subscriptions

### Achievements not unlocking
- Check criteria in achievements table
- Verify checkAndUnlockAchievements() is called
- Look at participant_achievements table
- Check console logs for errors

### Photos not uploading
- Ensure image URL is valid and accessible
- Check admin approval flow
- Verify RLS policies in Supabase
- Check participant_photos table

### Certificates not generating
- Verify @react-pdf/renderer is installed
- Check participant has rally submission
- Test PDF generation locally first
- Look at certificates table for tracking

---

## 🚀 Next Steps & Future Enhancements

### Immediate (Next week)
- [ ] Add bulk email sending in admin panel
- [ ] Direct image upload (Cloudinary integration)
- [ ] Push notification admin UI
- [ ] Achievement notification on unlock

### Short-term (Next month)
- [ ] Photo albums/collections
- [ ] Achievement badges in profile
- [ ] Certificate email automation
- [ ] Weekly stats email

### Long-term (3+ months)
- [ ] Social media integration (share achievements)
- [ ] Photo contest voting
- [ ] Custom achievement creation (admin)
- [ ] Multi-year statistics and comparisons
- [ ] Mobile app (React Native)

---

## 📞 Support

If you encounter issues:

1. Check server logs: `vercel logs` or check Vercel dashboard
2. Check database: Use Supabase dashboard SQL editor
3. Check environment variables are set correctly
4. Verify all migrations have run successfully

**Test URLs:**
- Gallery: `/gallery`
- Achievements: `/achievements`
- Admin Gallery: `/admin/gallery`
- Certificates: `/certificates/completion`

---

## 🎉 You're All Set!

Your rally website now has:
- ✅ Professional email system
- ✅ Social photo sharing
- ✅ Real-time notifications
- ✅ Gamification with achievements
- ✅ Professional certificates

**Total new features:** 5 major systems, 15+ new routes, 7 new database tables, 100% more awesome! 🚀
