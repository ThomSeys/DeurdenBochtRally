# Participant Deletion & Audit Trail Implementation

## Overview
Complete implementation of participant deletion with comprehensive audit trail to maintain compliance with legal/accounting requirements while respecting GDPR rights.

## Key Components

### 1. Audit Log Table (`participant_audit_log`)
**File**: `scripts/add-participant-audit-log.sql`

Maintains permanent records of:
- Account deletions (self-service GDPR)
- Registration cancellations
- Payment refunds
- Data exports
- Admin deletions

**Key Features**:
- Stores denormalized participant data (not FK references)
- Keeps payment info for 7-year legal compliance
- Records IP address and user agent
- Stores metadata (motorcycle, achievements, etc.)
- Distinguishes self-deletion (deleted_by = NULL) from admin deletion

### 2. Audit Log Service
**File**: `apps/web/app/lib/audit-log.server.ts`

Provides helper functions:
- `createAuditLogEntry()` - Core audit logging
- `logCancellation()` - Registration cancellations
- `logRefund()` - Payment refunds
- `logDataExport()` - GDPR data portability requests

### 3. Updated Deletion Flow
**File**: `apps/web/app/routes/api.delete-account.tsx`

**Process**:
1. ✅ Fetch full participant data
2. ✅ **Create audit log entry** (BEFORE deletion)
3. ✅ Delete dependent data (CASCADE-safe):
   - Achievements
   - Zone submissions
   - Rally submissions
   - Ride stories
   - Photos
   - Emergency contacts
   - Push subscriptions
   - Riding buddies (both directions)
   - Certificates
   - Emergency SOS records
4. ✅ Delete participant record
5. ✅ Delete Auth user
6. ✅ Send confirmation email

### 4. Data Export Logging
**File**: `apps/web/app/routes/api.download-data.tsx`

Logs all GDPR data export requests for audit trail.

### 5. Admin Audit Log View
**File**: `apps/web/app/routes/admin.audit-log.tsx`

Admin interface to view:
- All deletion events
- Cancellations
- Refunds
- Data exports
- Filter by event type
- Pagination

## Database Schema

### Tables with CASCADE Delete
All these will auto-delete when participant is deleted:
- ✅ `rally_zone_checkins` (ON DELETE CASCADE)
- ✅ `participant_achievements` (ON DELETE CASCADE)
- ✅ `certificates` (ON DELETE CASCADE)
- ✅ `ride_stories` (ON DELETE CASCADE)
- ✅ `ride_story_likes` (ON DELETE CASCADE)
- ✅ `participant_photos` (ON DELETE CASCADE)
- ✅ `photo_likes` (ON DELETE CASCADE)
- ✅ `emergency_sos` (ON DELETE CASCADE)
- ✅ `emergency_contacts` (ON DELETE CASCADE)
- ✅ `push_subscriptions` (ON DELETE CASCADE)
- ✅ `riding_buddies` (ON DELETE CASCADE)
- ✅ `rally_submissions` (ON DELETE CASCADE - if exists)
- ✅ `rally_zone_submissions` (ON DELETE CASCADE - if exists)

### Tables with SET NULL
These keep records but remove participant reference:
- `push_notifications_history.sent_by` (ON DELETE SET NULL)
- `emergency_sos.resolved_by` (ON DELETE SET NULL)

### Audit Table (Never Deleted)
- `participant_audit_log` - Permanent record

## What Gets Deleted

### ✅ Personal Data (GDPR Compliance)
- Name, email, phone, address
- Motorcycle details (brand, model, license plate)
- Profile photo
- Bio

### ✅ Event Data
- GPS locations and zone check-ins
- Rally submissions and scores
- Achievements and certificates
- Ride stories and comments
- Photos and likes
- Emergency contacts
- Push notification subscriptions
- Riding buddy connections

### ❌ What We Keep (Legal Requirements)

#### 1. Audit Trail
- Participant ID (for reference only)
- Email, name, phone
- Registration details (formula, ride type)
- **Payment information**:
  - Amount paid
  - Payment status
  - Stripe payment ID
  - Payment date
- Deletion timestamp
- Deletion reason
- Who deleted (self vs admin)
- IP address & user agent

#### 2. Why We Keep Payment Data
**Legal requirement**: 7 years for accounting/tax compliance
**Privacy**: Stored in separate audit table, not in active participant data
**Stripe**: Also maintains records per their legal obligations

## Implementation Steps

### 1. Run Migration
```bash
psql $DATABASE_URL -f scripts/add-participant-audit-log.sql
```

### 2. Deploy Updated Code
Files changed:
- `apps/web/app/routes/api.delete-account.tsx`
- `apps/web/app/routes/api.download-data.tsx`
- `apps/web/app/lib/audit-log.server.ts` (new)
- `apps/web/app/routes/admin.audit-log.tsx` (new)

### 3. Future: Add to Admin Menu
Add link to audit log in admin navigation.

## Usage Examples

### Log a Cancellation
```typescript
import { logCancellation } from '~/lib/audit-log.server';

// User cancels before event
await logCancellation(
  participantData,
  'Cancelled due to schedule conflict',
  undefined, // self-cancellation
  request
);
```

### Log a Refund
```typescript
import { logRefund } from '~/lib/audit-log.server';

// Admin issues refund
await logRefund(
  participantData,
  'Event cancelled - full refund',
  adminUserId,
  participant.amount_paid
);
```

### Log Data Export
```typescript
import { logDataExport } from '~/lib/audit-log.server';

// Automatic on data download
await logDataExport(
  participantId,
  email,
  firstName,
  lastName,
  request
);
```

## GDPR Compliance

### ✅ Right to be Forgotten (Art. 17)
- Complete deletion of personal data
- Audit trail kept for legal basis (Art. 17.3.e)

### ✅ Right to Data Portability (Art. 20)
- JSON export of all data
- Logged in audit trail

### ✅ Transparency (Art. 13-14)
- Clear communication about what's deleted
- Clear communication about what's retained and why
- 7-year retention period disclosed

## Security

### RLS Policies
- Audit log readable only by admins
- Service role can insert (application level)
- No user can modify/delete audit entries

### Privacy
- License plate stored as last 4 chars only in metadata
- IP addresses stored for security audit only
- User agent for fraud detection

## Monitoring

### Admin View Features
- Filter by event type
- Search by email
- Date range filtering
- Export to CSV for accounting

### Metrics to Track
- Deletion requests per month
- Cancellation reasons (patterns)
- Data export frequency
- Refund volume

## Data Retention

### Active Data: Until Deletion
- Participant records
- Event data
- Photos, stories, etc.

### Audit Log: 7 Years
- All deletion records
- Cancellation records
- Payment references
- Required for:
  - Tax compliance
  - Accounting standards
  - Legal defense

### After 7 Years
Manual or automated archival/deletion of audit logs based on legal advice.

## Future Enhancements

### 1. Soft Delete Option
Add `deleted_at` to participants table for "soft delete" instead of hard delete:
- Keeps participant record
- Marks as deleted
- Filters out of queries
- Allows "undelete" within 30 days

### 2. Anonymization Instead of Deletion
- Replace name with "Deleted User #123"
- Hash email
- Clear personal fields
- Keep aggregated stats

### 3. Scheduled Purge
Automated job to hard-delete soft-deleted accounts after 30 days.

### 4. Cancellation Workflow
Dedicated UI for:
- Cancel registration
- Request refund
- Provide cancellation reason
- Automatic audit logging

## Testing Checklist

- [ ] Create test participant
- [ ] Delete account via self-service
- [ ] Verify audit log entry created
- [ ] Verify all dependent data deleted
- [ ] Verify auth user deleted
- [ ] Check confirmation email sent
- [ ] Admin can view audit log
- [ ] Filter audit log by type
- [ ] Export data creates audit entry
- [ ] Cannot delete admin users

## Notes

1. **Foreign Keys**: All dependent tables have ON DELETE CASCADE, but we explicitly delete to have control
2. **Auth Users**: Must be deleted separately from Supabase Auth
3. **Storage**: Profile photos in storage buckets should be cleaned up (TODO)
4. **Stripe**: Payment data remains in Stripe per their compliance
5. **Edition Reset**: When resetting for new edition, audit log preserves historical data
