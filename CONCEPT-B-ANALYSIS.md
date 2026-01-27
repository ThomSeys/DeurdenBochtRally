# Concept B Full Implementation Analysis

## 🎯 Executive Summary

This project is transitioning from **Concept A (GPS-based validation)** to **Concept B (QR-only, segmented route)**.

**Current State:** Hybrid system with Concept A database structure still in place
**Target State:** Clean Concept B-only implementation
**Critical Decision:** Full migration or nothing - NO feature flags

---

## 🔍 Current Project Structure

### Concept A (OLD - To Be Removed)
**Philosophy:** GPS-tracked, continuous rally with real-time validation
- GPS tracking at rally zones
- Real-time location validation
- `rally_submissions` table with zone codes (rz1_code - rz8_code)
- `rally_zone_submissions` table for detailed zone tracking
- Complex scoring: rhythm_score, view_score, shadow_score
- Multiple checkpoint per zone system

### Concept B (NEW - Current Target)
**Philosophy:** QR-only, segmented autonomous navigation
- 8 Event Segments (linear route sections)
- 8 Rally Zones (checkpoint areas)
- QR code check-in/check-out at each Rally Zone
- No GPS validation
- Simple presence tracking
- `rally_zone_checkins` table (NOT YET CREATED)
- Autonomous route choice between waypoints

---

## 📊 Database Schema Analysis

### ✅ TABLES THAT EXIST (Concept A)

**`participants`** - ✅ Usable for both concepts
- Basic rider info
- payment_status, is_admin
- qr_code, qr_code_image_url
- **Keep as-is**

**`rally_submissions`** - ❌ CONCEPT A ONLY
- rz1_code through rz8_code (zone codes)
- total_points, total_distance
- short/medium/long_zones_completed
- **UNUSED IN CONCEPT B** - only exists for backward compatibility

**`rally_zone_submissions`** - ❌ CONCEPT A ONLY
- entry_timestamp, entry_latitude/longitude
- answer_timestamp, answer_latitude/longitude
- GPS accuracy tracking
- checkpoint_number, total_checkpoints
- rhythm_score, view_score, shadow_score
- **COMPLETELY UNUSED IN CONCEPT B**

**`zone_closures`** - ✅ Usable for both
- Admin can close zones
- Keep for Concept B

**`documents`** - ✅ Keep
- GPX files, rally books
- Needed for both concepts

**Other tables:**
- `achievements` - ✅ Keep
- `ride_stories` - ✅ Keep
- `emergency_sos` - ✅ Keep
- `push_notification_history` - ✅ Keep

### ❌ TABLES THAT DON'T EXIST (Needed for Concept B)

**`rally_zone_checkins`** - MISSING!!!
```sql
CREATE TABLE rally_zone_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id),
  rally_zone_id TEXT NOT NULL, -- Sanity _id
  action TEXT NOT NULL CHECK (action IN ('CHECKIN', 'CHECKOUT')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  qr_code TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🗂️ Sanity CMS Analysis

### ✅ SCHEMAS THAT EXIST

**`eventSegment`** - ✅ CONCEPT B READY
- title, order
- start_location, end_location (coordinates)
- distance_km, estimated_duration_minutes
- character, difficulty
- gpx_file field
- **Perfect for Concept B**

**`rallyZoneV2`** - ✅ CONCEPT B READY
- title, order
- start_location, end_location
- briefing (portable text)
- emergency_contact
- qr_checkin_code, qr_checkout_code
- **Perfect for Concept B**

**`rallyZone`** - ❌ CONCEPT A (LEGACY)
- Old multi-checkpoint system
- GPS validation fields
- checkpoint arrays with solutions
- **UNUSED - Can be deleted**

**`siteConfig`** - ✅ Keep
- gpxRouteFile
- Hero images
- SEO settings

**`edition`** - ✅ Keep
- Year management

**`sponsor`**, `stat`, `eventMarker` - ✅ Keep

---

## 🚧 What Needs to Be Done

### Priority 1: Database Migration

1. **Create `rally_zone_checkins` table**
   - Write SQL migration
   - Test with mock data
   - Update RLS policies

2. **Remove/Archive Concept A tables** (Optional cleanup)
   - `rally_submissions` → Keep for now (backward compatibility)
   - `rally_zone_submissions` → Can be dropped or archived
   - Decision: Keep or remove?

### Priority 2: Sanity Cleanup

1. **Remove `rallyZone` (old Concept A schema)**
   - Hide from Studio
   - Archive existing documents
   - Update all queries to use `rallyZoneV2`

2. **Verify `rallyZoneV2` and `eventSegment` schemas**
   - Ensure all needed fields exist
   - Test QR code fields work

### Priority 3: Code Migration

#### Routes to Update/Remove

**❌ REMOVE (Concept A only):**
- `apps/web/app/routes/zones.tsx` - Old zone overview
- `apps/web/app/routes/zone.$zoneId.tsx` - Individual zone details with codes
- `apps/web/app/routes/dashboard.rally-submission.tsx` - Code submission form
- Parts of `apps/web/app/routes/admin.submissions.tsx` - Zone code review
- `apps/web/app/routes/admin.zone-control.tsx` - Has both A and B mixed

**✅ KEEP (Concept B):**
- `apps/web/app/routes/my-day.tsx` - Personal day overview
- `apps/web/app/routes/participant-map.tsx` - Limited map view
- `apps/web/app/routes/live-map.tsx` - Admin live tracking
- `apps/web/app/routes/admin.manual-scan.tsx` - QR check-in override
- `apps/web/app/routes/admin.zone-override.tsx` - Manual check-in/out

**❌ REMOVE (Feature Flags):**
- `apps/web/app/lib/feature-flags.server.ts` - No longer needed
- `apps/web/app/routes/admin.feature-flags.tsx` - Remove UI
- Update admin dashboard to remove link

#### Components to Update

- `apps/web/app/components/LiveEventMap.tsx` - Update to show segments + check-ins
- Remove old zone code submission forms
- Update leaderboard to use check-in counts instead of zone codes

### Priority 4: Admin Dashboard Updates

**Keep:**
- Event Markers
- Manual Scan
- Zone Override
- Participants
- Leaderboard
- Live Map
- Check-in

**Remove:**
- Zone Control (or update to Concept B only)
- Feature Flags
- Any Concept A specific tools

---

## 🎯 Migration Strategy

### Phase 1: Database (1-2 hours)
1. Create `rally_zone_checkins` table
2. Run migration
3. Test with mock data generator
4. Verify RLS policies work

### Phase 2: Sanity Cleanup (30 min)
1. Hide `rallyZone` schema from Studio
2. Update all GROQ queries from `rallyZone` → `rallyZoneV2`
3. Test Studio editing

### Phase 3: Remove Concept A Routes (2-3 hours)
1. Delete zone code submission routes
2. Remove old zone detail pages
3. Update navigation/links
4. Test all pages load

### Phase 4: Update Admin Tools (1-2 hours)
1. Remove feature flags
2. Update admin dashboard
3. Clean up zone control for B-only
4. Test admin workflows

### Phase 5: Testing (2-3 hours)
1. End-to-end participant flow
2. Admin check-in override
3. QR scanning
4. Leaderboard calculations
5. Live map display

---

## 🧹 Cleanup Checklist

### Supabase

**Tables to Keep:**
- ✅ participants
- ✅ documents
- ✅ achievements
- ✅ ride_stories
- ✅ emergency_sos
- ✅ push_notification_history
- ✅ zone_closures (update for B)
- ✅ manual_checkpoint_entries (if exists)

**Tables to Remove/Archive:**
- ❌ rally_submissions (Concept A)
- ❌ rally_zone_submissions (Concept A)
- ❌ Any checkpoint tracking tables

**Tables to Create:**
- ⭐ rally_zone_checkins (NEW)

### Sanity

**Schemas to Keep:**
- ✅ eventSegment
- ✅ rallyZoneV2
- ✅ edition
- ✅ siteConfig
- ✅ sponsor
- ✅ stat
- ✅ eventMarker
- ✅ rideStory

**Schemas to Remove:**
- ❌ rallyZone (old Concept A)

**Documents to Clean:**
- Archive old `rallyZone` documents
- Keep all `rallyZoneV2` and `eventSegment` documents

### Code Files

**Remove:**
- feature-flags.server.ts
- admin.feature-flags.tsx
- zones.tsx (old)
- zone.$zoneId.tsx (code submission)
- dashboard.rally-submission.tsx (zone codes)
- Parts of admin routes dealing with Concept A

**Keep:**
- my-day.tsx
- participant-map.tsx
- live-map.tsx
- admin.manual-scan.tsx
- admin.zone-override.tsx
- admin.check-in.tsx

---

## ⚠️ Critical Decisions Needed

1. **Rally Submissions Table**
   - Keep for historical data?
   - Remove completely?
   - Archive and hide?

2. **Rally Zone Submissions Table**
   - Same question as above
   - Likely safe to remove (Concept A only)

3. **Migration Timing**
   - All at once (recommended)
   - Phased approach?

4. **Data Migration**
   - Need to migrate any existing participant data?
   - Or start fresh with Concept B?

---

## 📝 Next Steps (Recommended Order)

1. ✅ Create rally_zone_checkins SQL migration
2. ✅ Update generate-concept-b-mock-data.ts to use new table
3. ✅ Test mock data generation
4. ✅ Remove feature flags system
5. ✅ Update admin dashboard
6. ✅ Remove Concept A routes (zones, submission forms)
7. ✅ Update all GROQ queries (rallyZone → rallyZoneV2)
8. ✅ Test complete participant + admin flow
9. ✅ Archive/remove Concept A tables
10. ✅ Deploy to production

---

## 🎉 Success Criteria

- [ ] rally_zone_checkins table exists and works
- [ ] QR check-in/checkout flow works end-to-end
- [ ] No Concept A code remains
- [ ] All admin tools work for Concept B
- [ ] Leaderboard calculates correctly
- [ ] Live map shows check-ins properly
- [ ] No feature flag references
- [ ] Clean database schema
- [ ] Clean Sanity schema
- [ ] Documentation updated
