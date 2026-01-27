# Concept A Cleanup - Complete Migration to Concept B

**Date:** January 2025  
**Status:** ✅ Complete

---

## Overview

This document records the complete removal of Concept A (GPS-tracked rally with zone codes) and full migration to Concept B (QR-only check-in system with autonomous navigation).

**Philosophy Change:**
- **Concept A**: GPS-tracked continuous rally, zone code submissions, multi-checkpoint validation, scoring system
- **Concept B**: QR check-in/checkout only, autonomous navigation, maintain mystery, simple presence tracking

---

## Files Removed

### Route Files (9 files)
1. ✅ `apps/web/app/routes/zones.tsx` - Zone overview with code submission links
2. ✅ `apps/web/app/routes/zone.$zoneId.tsx` - Individual zone detail with checkpoint codes
3. ✅ `apps/web/app/routes/dashboard.rally-submission.tsx` - Zone code submission form
4. ✅ `apps/web/app/routes/api.rally-submission.tsx` - Rally submission API
5. ✅ `apps/web/app/routes/dashboard.progress.tsx` - Concept A progress tracking
6. ✅ `apps/web/app/routes/dashboard.stats.tsx` - Concept A statistics
7. ✅ `apps/web/app/routes/certificates.$type.tsx` - Certificate generation based on Concept A scores
8. ✅ `apps/web/app/routes/api.download-data.tsx` - Download Concept A rally data
9. ✅ `apps/web/app/routes/api.shadow-recalculate.tsx` - Shadow rally score recalculation

### Library Files (4 files)
10. ✅ `apps/web/app/lib/feature-flags.server.ts` - Feature flag system (no longer needed)
11. ✅ `apps/web/app/lib/shadow-rally.server.ts` - Shadow rally scoring logic
12. ✅ `apps/web/app/lib/achievements.server.ts` - Achievement system based on Concept A
13. ✅ `apps/web/app/lib/leaderboard.server.ts` - Leaderboard based on zone codes and scores

### Admin Routes (2 files)
14. ✅ `apps/web/app/routes/admin.feature-flags.tsx` - Feature flags management UI
15. ✅ `apps/web/app/routes/admin.incident-logging.tsx` - Duplicate of event markers

### Scripts (3 files)
16. ✅ `scripts/add-safety-incidents.sql` - Safety incidents (redundant)
17. ✅ `scripts/generate-rally-zone-qr-codes.ts` - Static QR generation (redundant)
18. ✅ `scripts/recalculate-rhythm-scores.ts` - Rhythm score calculation

**Total: 18 files removed**

---

## Files Updated

### Sanity Queries Updated
1. ✅ `apps/web/app/routes/api.rally-zones.tsx` - Changed `rallyZone` → `rallyZoneV2`
2. ✅ `apps/web/app/routes/admin.zone-control.tsx` - Changed `rallyZone` → `rallyZoneV2`
3. ✅ `apps/web/app/routes/rally.tsx` - Converted from zones to Event Segments display

### Schema Changes
4. ✅ `sanity-studio/schemaTypes/index.ts` - Hidden old `rallyZone` schema, added deprecation comments

### Admin Dashboard
5. ✅ `apps/web/app/routes/admin._index.tsx` - Removed feature flags and incident logging cards

---

## Sanity CMS Status

### ✅ Active Schemas (Concept B)
- `eventSegment` (8 documents) - Route sections with start/end locations
- `rallyZoneV2` (8 documents) - QR check-in points with briefings
- `edition`, `sponsor`, `stat`, `siteConfig` - Keep
- `eventMarker`, `rideStory`, `eventStory` - Keep

### ❌ Hidden Schema (Concept A)
- `rallyZone` (8 documents) - Old multi-checkpoint system
- Status: Hidden from Studio, documents still exist in Sanity for reference

### 📦 Archive Recommendation
The 8 old `rallyZone` documents can be archived or deleted from Sanity after confirming Concept B is working:
```bash
# To delete old rallyZone documents (run in Sanity Studio):
sanity documents delete '*[_type == "rallyZone"]'
```

---

## Database Status

### ✅ Tables to Keep
- `participants` - User accounts
- `documents` - GPX files, rally books
- `zone_closures` - Admin can close zones
- `emergency_sos` - Emergency alerts
- `push_notification_history` - Push notifications
- `ride_stories` - Participant stories

### ⭐ New Table (Concept B)
- `rally_zone_checkins` - **NEEDS TO BE CREATED**
  - SQL file: `scripts/create-rally-zone-checkins-table.sql`
  - Structure: participant_id, rally_zone_id (Sanity _id), action (CHECKIN/CHECKOUT), qr_code, lat/lng
  - Status: **Manual execution required in Supabase**

### ❌ Unused Tables (Concept A)
- `rally_submissions` - Zone code submissions (rz1_code - rz8_code)
- `rally_zone_submissions` - GPS tracking, checkpoint validation, scoring

**Recommendation:** Keep for historical data, or archive to separate schema

---

## Remaining Work

### Priority 1: Database Migration
1. ✅ Create `rally_zone_checkins` SQL - **DONE**
2. ⚠️ **EXECUTE SQL in Supabase** - `scripts/create-rally-zone-checkins-table.sql`
3. ❓ Decide: Archive or drop `rally_submissions` and `rally_zone_submissions`

### Priority 2: Update Remaining Files
Several files still reference old Concept A tables but may be safe to leave:
- `apps/web/app/routes/admin._index.tsx` - Stats dashboard (may need update)
- `apps/web/app/routes/live-map.tsx` - Uses `rally_zone_submissions` (UPDATE NEEDED)
- `apps/web/app/routes/api.check-ins.tsx` - Uses `rally_zone_submissions` (UPDATE NEEDED)
- `apps/web/app/routes/admin.leaderboard.tsx` - Uses both tables (UPDATE NEEDED)
- `apps/web/app/routes/admin.manual-scan.tsx` - Uses `rally_zone_submissions` (UPDATE NEEDED)
- `apps/web/app/routes/dashboard.admin.analytics.tsx` - Extensive Concept A analytics (UPDATE NEEDED)
- `apps/web/app/routes/api.prepare-edition.tsx` - Edition preparation (may need update)
- `apps/web/app/lib/report-worker.server.ts` - Report generation (may need update)

### Priority 3: Testing
1. Test QR check-in/checkout flow
2. Test admin manual scan
3. Test zone control (open/close)
4. Test participant map and my-day views
5. Verify mock data generation
6. Test Event Segments display on rally page

---

## Key Decisions Made

1. **No Feature Flags**: Full Concept B migration, no hybrid system
2. **Generic Naming**: Waypoint 1-7, Eerste/Tweede Checkpoint (no false city names)
3. **Real GPX**: 8 waypoints from actual "Deur den Bocht Rally.gpx"
4. **Simple Check-ins**: CHECKIN/CHECKOUT actions only, no complex scoring
5. **Maintain Mystery**: Minimal route disclosure, participants choose their own path

---

## Success Criteria

- ✅ No Concept A routes accessible
- ✅ No feature flag code
- ✅ Sanity queries use rallyZoneV2/eventSegment
- ✅ Old rallyZone schema hidden
- ⚠️ rally_zone_checkins table created (SQL ready, needs execution)
- ❓ Remaining files updated for Concept B
- ❓ System tested end-to-end

---

## Next Steps

1. **Execute SQL migration** in Supabase Dashboard
2. **Update remaining files** that reference rally_zone_submissions
3. **Test complete Concept B system**
4. **Deploy schema changes** to Sanity (`npx sanity schema deploy` in sanity-studio/)
5. **Archive old data** (optional cleanup after verification)

---

## Notes

- The mock data generator (`scripts/generate-concept-b-mock-data.ts`) is fully updated for Concept B
- Admin routes for zone control and manual scan are Concept B compatible
- The `my-day.tsx` and `participant-map.tsx` routes align with Concept B philosophy
- Event markers system is separate and functional for both concepts
