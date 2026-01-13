# Rally Application - Scenario Analysis & Implementation Plan

## 📊 Current State vs Required Features

### ✅ What Already Exists

#### Database Tables
- **participants** (Rider equivalent)
  - ✅ id, first_name, last_name, phone, license_plate
  - ✅ checked_in, checked_in_at
  - ✅ payment_status, is_admin
  - ❌ Missing: `status` (active/withdrawn/disqualified)

- **rally_submissions**
  - ✅ participant_id, zone codes (rz1-rz8)
  - ✅ total_points, total_distance, submitted_at
  - ✅ start_km, end_km (odometer readings)
  - ✅ shadow_total, final_score

- **rally_zone_submissions**
  - ✅ participant_id, zone_id
  - ✅ entry_timestamp, entry_latitude, entry_longitude, entry_accuracy
  - ✅ answer_timestamp, answer_latitude, answer_longitude, answer_accuracy
  - ✅ submitted_answer, normalized_answer, is_correct
  - ✅ rhythm_score, view_score, shadow_score, correctness_score
  - ❌ Missing: `scan_type` (start/checkpoint)
  - ❌ Missing: `proof_photo_url`
  - ❌ Missing: `is_manual`
  - ❌ Missing: validation flags (`valid`, `reason_if_invalid`, `approved_by`)

- **Sanity CMS (rallyZone)**
  - ✅ name, description, location
  - ✅ startPoint, endPoint (GPS coordinates)
  - ✅ solution, validAnswers
  - ✅ color (difficulty)
  - ❌ Missing: `radius_m` (geofence radius)
  - ❌ Missing: `is_open` (zone status)

#### Existing Features
- ✅ QR code generation for participants
- ✅ GPS tracking (entry/answer coordinates)
- ✅ Shadow rally scoring system (rhythm, view, correctness)
- ✅ Admin dashboard for viewing submissions
- ✅ Zone validation with Sanity
- ✅ Leaderboard calculation

### ❌ What's Missing

1. **Rider Status Management**
   - No `status` field (active/withdrawn/disqualified)
   - Need UI to change rider status in admin panel

2. **Zone Control**
   - No `is_open` field on zones
   - No `radius_m` geofence radius
   - No admin interface to close/open zones

3. **Scan System**
   - No `scan_type` differentiation (start vs checkpoint)
   - No `proof_photo_url` for evidence
   - No `is_manual` flag for offline entries
   - No validation workflow (valid/invalid/pending)

4. **Manual Approval System**
   - No pending/approved status
   - No `approved_by` field
   - No admin interface for approving scans

5. **Photo Upload**
   - No file upload infrastructure
   - No proof photo storage

6. **Offline Support**
   - No local storage/caching
   - No sync mechanism

7. **Geofencing**
   - GPS coordinates exist but no validation against radius
   - No automatic rejection of scans outside geofence

## 🎯 Implementation Plan

### Phase 1: Database Schema Updates

**File:** `scripts/rally-scenarios-migration.sql`

```sql
-- Add rider status to participants
ALTER TABLE participants 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'withdrawn', 'disqualified'));

-- Add zone control fields (we'll store these in Sanity instead)

-- Add scan validation fields to rally_zone_submissions
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS scan_type TEXT DEFAULT 'checkpoint'
    CHECK (scan_type IN ('start', 'checkpoint')),
  ADD COLUMN IF NOT EXISTS proof_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS valid BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reason_if_invalid TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES participants(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS gps_within_geofence BOOLEAN;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_zone_submissions_valid ON rally_zone_submissions(valid);
CREATE INDEX IF NOT EXISTS idx_zone_submissions_scan_type ON rally_zone_submissions(scan_type);
```

### Phase 2: Sanity Schema Updates

**File:** `sanity-studio/schemaTypes/rallyZone.ts`

Add fields:
- `radius_m` (number) - Geofence radius in meters (default: 30)
- `is_open` (boolean) - Whether zone accepts scans (default: true)
- `reference_photo` (image) - Reference photo for manual validation

### Phase 3: Core Features Implementation

#### 3.1 Scan Submission with GPS & Photo
- Update zone scanning flow
- Add geofence validation
- Add photo upload capability
- Support offline caching with Service Worker

#### 3.2 Admin Validation Dashboard
- View pending scans (valid = null)
- View scan details (GPS accuracy, photo)
- Approve/reject with reason
- Compare with reference photo

#### 3.3 Zone Control Panel
- Admin interface to open/close zones
- Update Sanity `is_open` field
- Prevent new scans when closed
- Auto-score closed zones (use average)

#### 3.4 Rider Status Management
- Admin interface to change rider status
- Filter leaderboard by active riders only
- Mark scans invalid when rider disqualified

## 📋 Scenario-Specific Implementations

### Scenario 1: QR Weg / Onleesbaar
**Status:** ⚠️ Partially Implemented

**Current:**
- Riders can submit zone codes manually
- No photo proof required

**Needs:**
1. Add photo upload to zone scan form
2. Mark submission as `valid = NULL` (pending manual)
3. Admin sees pending scans with photos
4. Admin compares with reference photo
5. Admin clicks Approve → `valid = TRUE`, `approved_by = admin_id`

**Implementation:**
- Update [dashboard.rally-submission.tsx](apps/web/app/routes/dashboard.rally-submission.tsx)
- Create new admin route: [admin.pending-scans.tsx](apps/web/app/routes/admin.pending-scans.tsx)

### Scenario 2: GPS Faalt
**Status:** ✅ Partially Working

**Current:**
- GPS accuracy is recorded
- Low accuracy is allowed

**Enhancement:**
1. Show warning when `accuracy > 50m`
2. Require photo when accuracy > 50m
3. Mark as `valid = NULL` for manual review
4. Admin can override based on photo proof

### Scenario 3: Weg Afgesloten
**Status:** ❌ Not Implemented

**Needs:**
1. Add `is_open` field to Sanity rallyZone
2. Create admin UI to toggle zone status
3. Block new scans when `is_open = FALSE`
4. For closed zones: calculate shadow score as average
5. Show "Zone Closed" message in app

**Implementation:**
- Update Sanity schema
- Create [admin.zone-control.tsx](apps/web/app/routes/admin.zone-control.tsx)
- Update zone scan logic to check `is_open`

### Scenario 4: Twee Rijders Exact Gelijk
**Status:** ✅ Already Handled

**Current:**
- Shadow scoring system handles tie-breaking
- Admin can adjust individual zone scores

**Enhancement:**
- Add "tie-breaker" UI in admin to set score adjustments
- Document tie-breaking procedure

### Scenario 5: Telefoon Dood
**Status:** ❌ Not Implemented

**Needs:**
1. Add `is_manual` field to scans
2. Create admin-only manual scan entry form
3. Manual scans get `rhythm_score = 0` (no timing advantage)
4. Require: participant, zone, timestamp, photo
5. Mark as `is_manual = TRUE`

**Implementation:**
- Create [admin.manual-scan.tsx](apps/web/app/routes/admin.manual-scan.tsx)
- Update scoring logic to handle manual scans

### Scenario 6: Internet Valt Uit
**Status:** ⚠️ Needs Enhancement

**Current:**
- Basic offline form submission (browser cache)

**Needs:**
1. Service Worker for offline capability
2. LocalStorage for pending scans
3. Sync queue when connection restored
4. Visual indicator: "Offline - X pending uploads"
5. Retry logic with exponential backoff

**Implementation:**
- Create [public/service-worker.js](apps/web/public/service-worker.js)
- Add sync logic to scan submission

## 🚀 Priority Order

### HIGH Priority (Week 1)
1. ✅ Database migration script
2. ✅ Update TypeScript types
3. ✅ Add rider status to participants
4. ✅ Add scan validation fields
5. ✅ Create admin pending scans dashboard
6. ✅ Implement photo upload for scans

### MEDIUM Priority (Week 2)
7. ✅ Add zone open/close controls
8. ✅ Update Sanity schema for zones
9. ✅ Implement geofence validation
10. ✅ Create manual scan entry form
11. ✅ Add rider status management UI

### LOW Priority (Week 3)
12. ⚠️ Offline support with Service Worker
13. ⚠️ Sync queue for offline scans
14. ⚠️ Enhanced analytics for directors
15. ⚠️ Automated alerts for low GPS accuracy

## 📝 Notes

- **No Tracking:** System only records scan points, not continuous tracking
- **Privacy:** GPS data only stored at scan moments
- **Simplicity:** Three checks: location, timing, authenticity
- **Fair Play:** Manual entries get no timing advantage
- **Director Control:** Full override capability for chaos scenarios
