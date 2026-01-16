# Quick Implementation Guide - Multi-Checkpoint Rally Zones

## 🚀 Step-by-Step Implementation

### Phase 1: Database Setup (15 min)

1. **Run SQL migration:**
   ```bash
   cd scripts
   psql $DATABASE_URL < add-multi-checkpoint-system.sql
   ```

2. **Verify tables updated:**
   ```sql
   -- Check new columns exist
   SELECT checkpoint_number, total_checkpoints 
   FROM rally_zone_submissions LIMIT 1;
   
   SELECT short_zones_completed, medium_zones_completed, long_zones_completed
   FROM rally_submissions LIMIT 1;
   ```

### Phase 2: Sanity Schema (10 min)

1. **Deploy updated schema:**
   ```bash
   cd sanity-studio
   npm install
   npm run dev
   ```

2. **Verify in Studio:**
   - Open any Rally Zone
   - Check for "Zone Type" field
   - Check for "Checkpoints" array field
   - Check for "Estimated Distance" field

### Phase 3: Data Migration (20 min)

1. **Run migration script:**
   ```bash
   cd scripts
   npm run ts-node migrate-to-multi-checkpoint.ts
   ```

2. **Review migrated zones:**
   - Open Sanity Studio
   - Check each zone has correct type
   - Verify checkpoint arrays created
   - Note placeholder checkpoints

3. **Update placeholder checkpoints:**
   For each medium/long zone:
   - Replace "PLACEHOLDER2" with real checkpoint
   - Add descriptive clues
   - Add solution codes
   - Add GPS coordinates (optional but recommended)

### Phase 4: Update Queries (30 min)

Update these files to fetch new checkpoint data:

```typescript
// Example: apps/web/app/routes/zones.tsx
const rallyZones = await sanityClient.fetch(`
  *[_type == "rallyZone"] | order(order asc) {
    _id,
    title,
    description,
    location,
    zoneType,              // NEW
    estimatedDistance,     // NEW
    checkpoints[] {        // NEW
      name,
      description,
      codeHint,
      solution,
      validAnswers,
      location
    },
    exit,
    lus,
    rejoin,
    points,
    color,
    image,
    startPoint,
    endPoint,
    "zoneNumber": order + 1
  }
`);
```

### Phase 5: Update UI Components (2-3 hours)

Priority order:

1. **Zone Overview** (`apps/web/app/routes/zones.tsx`)
   - Add zone type badge
   - Show checkpoint count
   - Display estimated distance

2. **Zone Detail** (`apps/web/app/routes/zone.$zoneId.tsx`)
   - Render checkpoint list
   - Show completion per checkpoint
   - Add checkpoint indicators

3. **Submission Form** (`apps/web/app/routes/dashboard.rally-submission.tsx`)
   - Support multiple submissions per zone
   - Track which checkpoint
   - Show progress per zone

4. **Leaderboard** (`apps/web/app/routes/admin.leaderboard.tsx`)
   - Show zone type breakdown
   - Display checkpoint completion

## 🎨 UI Component Templates

### Zone Type Badge

```tsx
function ZoneTypeBadge({ zoneType }: { zoneType: 'short' | 'medium' | 'long' }) {
  const colors = {
    short: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    long: 'bg-red-100 text-red-800',
  };
  
  const labels = {
    short: 'Kort',
    medium: 'Middel',
    long: 'Lang',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[zoneType]}`}>
      {labels[zoneType]}
    </span>
  );
}
```

### Checkpoint List

```tsx
function CheckpointList({ checkpoints }: { checkpoints: Checkpoint[] }) {
  return (
    <div className="space-y-4">
      {checkpoints.map((checkpoint, index) => (
        <div key={index} className="border rounded-lg p-4">
          <h4 className="font-semibold">{checkpoint.name}</h4>
          <p className="text-gray-600">{checkpoint.description}</p>
          <p className="text-sm text-gray-500 mt-2">
            💡 Tip: {checkpoint.codeHint}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### Zone Completion Indicator

```tsx
function ZoneProgress({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium">
        {completed}/{total}
      </span>
    </div>
  );
}
```

## 📊 Testing Scenarios

### Test Case 1: Short Zone
```
1. Start Zone 1 (Type A, 1 checkpoint)
2. Submit checkpoint 1 code
3. Verify: 12 points awarded
4. Check: zone shows as complete
```

### Test Case 2: Medium Zone
```
1. Start Zone 2 (Type B, 2 checkpoints)
2. Submit checkpoint 1 code
3. Verify: Zone shows 1/2 complete
4. Submit checkpoint 2 code
5. Verify: 20 points awarded total
6. Check: zone shows as complete
```

### Test Case 3: Long Zone
```
1. Start Zone 4 (Type C, 3 checkpoints)
2. Submit checkpoint 1 code
3. Submit checkpoint 2 code
4. Verify: Zone shows 2/3 complete
5. Submit checkpoint 3 code
6. Verify: 35 points awarded total
7. Check: zone shows as complete
```

### Test Case 4: Points Calculation
```
Complete:
- 2 short zones = 24 pts
- 4 medium zones = 80 pts
- 2 long zones = 70 pts
Total: 174 pts
+ All zones bonus: 30 pts
= 204 pts (before other bonuses)
```

## ⚠️ Common Issues & Solutions

### Issue 1: Checkpoint validation fails
**Solution:** Ensure `total_checkpoints` matches actual checkpoint count in Sanity

### Issue 2: Points not calculating correctly
**Solution:** Check that zone completion tracking updates `short_zones_completed`, etc.

### Issue 3: Legacy zones missing checkpoints array
**Solution:** Run migration script again or manually add checkpoint arrays in Sanity

### Issue 4: GPS coordinates missing
**Solution:** Checkpoint locations are optional but recommended for validation

## 📱 Minimum Viable Implementation

If you need to launch quickly, this is the bare minimum:

1. ✅ Run database migration
2. ✅ Deploy Sanity schema
3. ✅ Run data migration
4. ✅ Update one checkpoint per short zone
5. ✅ Update two checkpoints per medium zone  
6. ✅ Update three checkpoints per long zone
7. ⏭️ UI updates can be iterative

The system will work with basic functionality, and you can enhance UI progressively.

## 🎯 Success Criteria

✅ All 8 zones have correct zone type
✅ Each zone has correct number of checkpoints
✅ All placeholder checkpoints replaced
✅ Points calculation works correctly
✅ Participants can submit per checkpoint
✅ Leaderboard shows accurate scores
✅ Zone completion tracking works

## 🆘 Rollback Plan

If needed, you can rollback:

1. **Sanity:** Revert schema, hide new fields
2. **Database:** Legacy calculation still works with `rz1_code` etc.
3. **UI:** Falls back to single checkpoint display

The system is designed to be backward compatible during transition.

## 📞 Next Actions

After implementing:

1. Test with real users in staging
2. Adjust zone type assignments based on actual routes
3. Fine-tune points values
4. Gather feedback on checkpoint descriptions
5. Monitor completion rates per zone type

Good luck! 🏁
