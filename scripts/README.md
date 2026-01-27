# Scripts Directory

Comprehensive scripts for managing Deur Den Bocht data and infrastructure.

## � Quick Start

### Complete Fresh Setup

```bash
# One command to set up everything from scratch
npm run script scripts/master-setup.ts
```

This will:
1. ✨ Create ALL Sanity content (edition, config, zones, schedule, FAQ, etc)
2. 🗺️ Generate 4 rally zones from GPX route
3. 📤 Publish everything to production
4. 🗄️ Guide you through Supabase schema setup
5. 🪣 Create storage buckets
6. 👤 Create admin user
7. 🧪 Add test data

### Nuclear Option - Complete Reset

```bash
# Delete EVERYTHING from both Sanity and Supabase
npm run script scripts/clean-slate.ts

# Then run fresh setup
npm run script scripts/master-setup.ts
```

## 📁 Structure

```
scripts/
├── master-setup.ts     # 🎯 Complete setup wizard
├── clean-slate.ts      # 💀 Delete everything (dangerous!)
├── sanity/             # Sanity CMS management
├── supabase/           # Supabase infrastructure
└── archive/            # Old scripts (reference only)
```

## 📝 Available Scripts

### Sanity Scripts (`sanity/`)

| Script | Purpose |
|--------|---------|
| `00-config.ts` | Shared Sanity configuration |
| `01-setup-content.ts` | Create initial edition and site config |
| `generate-rally-zones.ts` | Generate 4 zones with data from main GPX |
| `publish-all-drafts.ts` | Publish all draft documents |
| `reset-all-data.ts` | Delete ALL Sanity content (with confirmation) |

```bash
# Create fresh Sanity content
npm run script scripts/sanity/reset-all-data.ts
npm run script scripts/sanity/01-setup-content.ts
npm run script scripts/sanity/generate-rally-zones.ts
npm run script scripts/sanity/publish-all-drafts.ts
```

### Supabase Scripts (`supabase/`)

| Script | Purpose |
|--------|---------|
| `00-config.ts` | Shared Supabase configuration |
| `schema.sql` | Complete database schema (run in SQL Editor) |
| `setup-storage-buckets.ts` | Create all required storage buckets |
| `generate-qr-codes.ts` | Generate QR codes for participants |
| `create-admin.ts` | Create/promote admin users |
| `unlock-achievements.ts` | Retroactively unlock achievements |
| `populate-test-data.ts` | Create test participants and data |
| `reset-for-new-edition.ts` | Clean database for new edition (preserves admins) |

```bash
# Setup infrastructure
npm run script scripts/supabase/setup-storage-buckets.ts
npm run script scripts/supabase/create-admin.ts

# Generate QR codes for existing users
npm run script scripts/supabase/generate-qr-codes.ts

# Check achievements for all participants
npm run script scripts/supabase/unlock-achievements.ts

# Reset for new edition
npm run script scripts/supabase/reset-for-new-edition.ts
```

## 🗄️ Database Schema

The complete schema (`supabase/schema.sql`) includes:

**Core Tables:**
- `participants` - Registered riders
- `rally_zone_checkins` - Simple location-based check-ins
- `documents` - GPX files, PDFs, maps

**Gamification:**
- `achievements` - Achievement definitions
- `participant_achievements` - Unlocked achievements
- `certificates` - Generated completion certificates

**Social Features:**
- `ride_stories` - Participant stories (synced with Sanity)
- `participant_photos` - Rally photos with approval workflow
- `photo_likes`, `ride_story_likes` - Social interactions

**Safety:**
- `emergency_sos` - Emergency alerts with location
- `emergency_contacts` - Emergency contact information

**Notifications:**
- `push_subscriptions` - Web push notification endpoints
- `push_notifications_history` - Sent notification log
- `push_delivery_log` - Delivery tracking
- `push_recipient_groups` - Audience segmentation
- `push_message_templates` - Reusable message templates

**Reporting:**
- `scheduled_reports` - Automated report generation
- `report_history` - Generated report archive
- `report_queue` - On-demand report requests

**Storage Buckets:**
- `participant-photos` (public) - Rally photos
- `qr-codes` (public) - Participant QR codes
- `fallback-photos` (public) - Fallback images
- `reports` (private) - Generated reports

## ⚙️ Environment Variables

Required in `apps/web/.env.local`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sanity
SANITY_PROJECT_ID=tp2nrvnd
SANITY_DATASET=production
SANITY_TOKEN=your-token

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔧 Common Tasks

### Add New Achievement

1. Add to `supabase/schema.sql` default data section
2. Run INSERT statement in SQL Editor
3. Update criteria in `supabase/unlock-achievements.ts`
4. Run unlock script to retroactively award

### Prepare for New Edition

```bash
# 1. Reset Sanity content
npm run script scripts/sanity/reset-all-data.ts
npm run script scripts/sanity/01-setup-content.ts

# 2. Update edition details in Sanity Studio

# 3. Generate new rally zones
npm run script scripts/sanity/generate-rally-zones.ts
npm run script scripts/sanity/publish-all-drafts.ts

# 4. Reset Supabase data (preserves admins)
npm run script scripts/supabase/reset-for-new-edition.ts
```

### Test Full Setup Locally

```bash
# 1. Fresh Sanity setup
npm run script scripts/sanity/reset-all-data.ts
npm run script scripts/sanity/01-setup-content.ts
npm run script scripts/sanity/generate-rally-zones.ts
npm run script scripts/sanity/publish-all-drafts.ts

# 2. Run schema.sql in Supabase Studio

# 3. Setup infrastructure
npm run script scripts/supabase/setup-storage-buckets.ts
npm run script scripts/supabase/create-admin.ts
npm run script scripts/supabase/populate-test-data.ts

# 4. Start dev server
npm run dev
```

## 📚 Documentation

See also:
- `/docs/setup/` - Initial setup guides
- `/docs/features/` - Feature-specific documentation
- `/docs/deployment/` - Deployment instructions
