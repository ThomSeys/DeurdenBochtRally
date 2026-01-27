# 🚨 CRITICAL NEXT STEPS - Concept B Migration

**Status:** Cleanup complete, database migration pending

---

## ⚠️ MUST DO IMMEDIATELY

### 1. Execute Database Migration (CRITICAL)

The `rally_zone_checkins` table MUST be created for Concept B to work:

```bash
# Open Supabase Dashboard → SQL Editor
# Execute: /scripts/create-rally-zone-checkins-table.sql

# Or via command line:
supabase db execute --file scripts/create-rally-zone-checkins-table.sql
```

**Table Structure:**
- `participant_id` (UUID) - References participants table
- `rally_zone_id` (TEXT) - Sanity document _id (e.g., "draft.rallyzone-123")
- `action` (TEXT) - "CHECKIN" or "CHECKOUT"
- `qr_code` (TEXT) - QR code scanned
- `latitude`, `longitude` (DOUBLE PRECISION) - Check-in location
- `timestamp`, `created_at` - Timestamps

**Why critical:** Without this table, participants cannot check in/out of zones!

---

## 🔧 FILES THAT NEED UPDATING

These files still reference Concept A tables (`rally_zone_submissions`):

### High Priority (App will break without these)

1. **apps/web/app/routes/live-map.tsx**
   - Currently: Queries `rally_zone_submissions` for participant locations
   - Update to: Query `rally_zone_checkins` for latest check-ins
   
2. **apps/web/app/routes/api.check-ins.tsx**
   - Currently: Returns `rally_zone_submissions` data
   - Update to: Return `rally_zone_checkins` data

3. **apps/web/app/routes/admin.manual-scan.tsx**
   - Currently: Inserts into `rally_zone_submissions`
   - Update to: Insert into `rally_zone_checkins` with CHECKIN action

4. **apps/web/app/routes/admin.leaderboard.tsx**
   - Currently: Uses `rally_submissions` and `rally_zone_submissions` for scores
   - Decision needed: Simple check-in count leaderboard OR remove entirely?

### Medium Priority (Admin features)

5. **apps/web/app/routes/dashboard.admin.analytics.tsx**
   - Extensive Concept A analytics (zone submissions, photos, scores)
   - Decision needed: Rewrite for Concept B analytics OR remove?

6. **apps/web/app/routes/admin._index.tsx**
   - Dashboard stats still query `rally_submissions` and `rally_zone_submissions`
   - Update to: Query `rally_zone_checkins` for check-in counts

### Low Priority (Optional features)

7. **apps/web/app/routes/api.prepare-edition.tsx**
   - Edition preparation deletes from old tables
   - Update to: Also handle `rally_zone_checkins` cleanup

8. **apps/web/app/lib/report-worker.server.ts**
   - Report generation uses old submission data
   - Update to: Use check-in data for reports

---

## 🎯 TESTING CHECKLIST

After database migration and file updates:

### Participant Flow
- [ ] QR code check-in works
- [ ] QR code checkout works
- [ ] My Day shows check-ins correctly
- [ ] Participant map shows current location
- [ ] Event segments display on rally page

### Admin Flow
- [ ] Manual scan creates check-in
- [ ] Zone control (open/close) works
- [ ] Live map shows participant check-ins
- [ ] Analytics dashboard loads (if kept)
- [ ] Admin dashboard stats correct

### Data Integrity
- [ ] Check-ins stored in `rally_zone_checkins`
- [ ] RLS policies work (participants see own data)
- [ ] QR codes validate correctly
- [ ] Lat/lng captured properly

---

## 📊 DATABASE CLEANUP DECISION

### Old Tables Still Present:
- `rally_submissions` (8 columns, zone codes rz1_code - rz8_code)
- `rally_zone_submissions` (GPS tracking, checkpoints, scoring)

### Options:

**Option A: Archive (Recommended)**
```sql
-- Rename tables to archive them
ALTER TABLE rally_submissions RENAME TO rally_submissions_archived_concept_a;
ALTER TABLE rally_zone_submissions RENAME TO rally_zone_submissions_archived_concept_a;

-- Update RLS to prevent writes
-- Keep for historical reference
```

**Option B: Drop (Clean slate)**
```sql
-- Backup first!
pg_dump -t rally_submissions > rally_submissions_backup.sql
pg_dump -t rally_zone_submissions > rally_zone_submissions_backup.sql

-- Then drop
DROP TABLE rally_zone_submissions CASCADE;
DROP TABLE rally_submissions CASCADE;
```

**Option C: Keep (Safest for now)**
- Leave tables as-is until Concept B fully tested
- No participants will use them anymore
- Can clean up later

---

## 🗄️ SANITY CLEANUP

### Option 1: Keep Old Documents (Safe)
```javascript
// Do nothing - old rallyZone docs stay for reference
// Hidden from Studio but still queryable if needed
```

### Option 2: Archive Old Documents
```javascript
// Tag as archived
sanity documents patch '*[_type == "rallyZone"]' --set archived=true
```

### Option 3: Delete Old Documents (Clean)
```bash
# In Sanity Studio directory:
sanity documents delete '*[_type == "rallyZone"]'
```

**Recommendation:** Keep old documents until Concept B is production-tested.

---

## ⏰ TIMELINE

### Today (Immediate)
1. ✅ Execute `create-rally-zone-checkins-table.sql` in Supabase
2. ✅ Update live-map.tsx
3. ✅ Update api.check-ins.tsx
4. ✅ Update admin.manual-scan.tsx
5. ✅ Test check-in flow

### This Week (High Priority)
1. ✅ Update admin._index.tsx stats
2. ✅ Update admin.leaderboard.tsx OR remove
3. ✅ Update dashboard.admin.analytics.tsx OR remove
4. ✅ Test admin features
5. ✅ Deploy schema changes (`npx sanity schema deploy`)

### Next Week (Low Priority)
1. ✅ Update api.prepare-edition.tsx
2. ✅ Update report-worker.server.ts
3. ✅ Decide on old table cleanup
4. ✅ Production testing with real participants

---

## 📞 NEED HELP?

### Database Issues
- Check Supabase logs for RLS policy errors
- Verify foreign key constraints
- Test with mock data generator first

### Sanity Issues
- Run `npx sanity schema deploy` to sync schema
- Check Studio for hidden types
- Verify documents exist in production dataset

### Code Issues
- Check imports for removed files
- Update TypeScript types if needed
- Test routes with `npm run dev`

---

## ✅ COMPLETION CRITERIA

Concept B migration is complete when:
- ✅ All Concept A routes removed
- ✅ All Concept A code removed
- ✅ Sanity queries updated
- ✅ Old schema hidden
- ⚠️ **`rally_zone_checkins` table created** (PENDING)
- ⚠️ **Remaining files updated** (PENDING)
- ❌ System tested end-to-end
- ❌ Production deployment successful

---

**Last Updated:** January 2025  
**Next Review:** After database migration and file updates
