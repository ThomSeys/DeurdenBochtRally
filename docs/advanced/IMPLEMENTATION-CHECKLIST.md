# Implementation Checklist - 3-Tier Rally Zone System

## ✅ Phase 1: Core System (COMPLETE)

### Schema & Types
- [x] Updated Sanity schema with `zoneType`, `estimatedDistance`, `checkpoints`
- [x] Updated TypeScript types in `sanity.types.ts`
- [x] Updated database types in `database.types.ts`
- [x] Added backward compatibility for legacy fields

### Database
- [x] Created SQL migration `add-multi-checkpoint-system.sql`
- [x] Added `checkpoint_number` and `total_checkpoints` fields
- [x] Added zone type counters (`short/medium/long_zones_completed`)
- [x] Updated `rally_director_dashboard` view

### Business Logic
- [x] Updated points calculation in `utils.ts`
- [x] Implemented 3-tier point system (12/20/35)
- [x] Added zone type bonuses
- [x] Maintained backward compatibility

### Migration Tools
- [x] Created `migrate-to-multi-checkpoint.ts` script
- [x] Implemented automatic zone type assignment
- [x] Added placeholder checkpoint generation

### Documentation
- [x] Created comprehensive system docs
- [x] Created quick implementation guide
- [x] Created implementation summary
- [x] Added UI component examples

## ⏳ Phase 2: Deployment & Data (TODO - 2-3 hours)

### Database Deployment
- [ ] Run `add-multi-checkpoint-system.sql` in staging
- [ ] Verify new columns exist
- [ ] Run SQL in production
- [ ] Backup database before migration

### Sanity Deployment
- [ ] Start Sanity Studio locally
- [ ] Verify new fields appear
- [ ] Test creating a zone with checkpoints
- [ ] Deploy to production

### Data Migration
- [ ] Run `migrate-to-multi-checkpoint.ts` in staging
- [ ] Review all zones in Sanity Studio
- [ ] Verify zone type assignments correct
- [ ] Confirm checkpoint arrays created

### Checkpoint Content
- [ ] Zone 1: Update checkpoints (Type A - 1 checkpoint)
- [ ] Zone 2: Add checkpoint 2 (Type B - 2 checkpoints)
- [ ] Zone 3: Add checkpoint 2 (Type B - 2 checkpoints)
- [ ] Zone 4: Add checkpoints 2-3 (Type C - 3 checkpoints)
- [ ] Zone 5: Add checkpoint 2 (Type B - 2 checkpoints)
- [ ] Zone 6: Update checkpoints (Type A - 1 checkpoint)
- [ ] Zone 7: Add checkpoint 2 (Type B - 2 checkpoints)
- [ ] Zone 8: Add checkpoints 2-3 (Type C - 3 checkpoints)

### GPS Coordinates
- [ ] Add coordinates for all checkpoints (optional but recommended)
- [ ] Verify geofence radii appropriate
- [ ] Test GPS validation

## ⏳ Phase 3: Query Updates (TODO - 1-2 hours)

### Sanity Queries
- [ ] Update `apps/web/app/routes/zones.tsx` - fetch zoneType, checkpoints
- [ ] Update `apps/web/app/routes/zone.$zoneId.tsx` - fetch full checkpoint data
- [ ] Update `apps/web/app/routes/dashboard.rally-submission.tsx` - zone info
- [ ] Update admin routes - checkpoint tracking
- [ ] Update live map queries

### Test Queries
- [ ] Verify all zones load with new fields
- [ ] Check checkpoint arrays populate
- [ ] Test backward compatibility with legacy zones

## ⏳ Phase 4: UI Updates (TODO - 4-6 hours)

### Zone Overview Page (`zones.tsx`)
- [ ] Add zone type badge component
- [ ] Display estimated distance
- [ ] Show checkpoint count
- [ ] Update zone cards layout
- [ ] Add sorting by zone type

### Zone Detail Page (`zone.$zoneId.tsx`)
- [ ] Create checkpoint list/accordion
- [ ] Show checkpoint numbers
- [ ] Add completion indicators per checkpoint
- [ ] Progressive reveal (unlock checkpoints sequentially)
- [ ] Update with new data structure

### Submission Form (`dashboard.rally-submission.tsx`)
- [ ] Support per-checkpoint submission
- [ ] Add checkpoint selector/indicator
- [ ] Track which checkpoint being submitted
- [ ] Show zone completion progress
- [ ] Display remaining checkpoints
- [ ] Update form validation
- [ ] Store `checkpoint_number` in submissions

### Leaderboard (`admin.leaderboard.tsx`)
- [ ] Show zone type breakdown (2/2 short, 3/4 medium, 1/2 long)
- [ ] Display checkpoint completion ratio
- [ ] Add zone type filter
- [ ] Show points by zone type

### Live Map (`live-map.tsx`)
- [ ] Different marker icons per checkpoint
- [ ] Show which checkpoint of zone
- [ ] Completion indicators
- [ ] Update popup with checkpoint info

### Components
- [ ] Create `ZoneTypeBadge` component
- [ ] Create `CheckpointList` component
- [ ] Create `ZoneProgress` component
- [ ] Create `CheckpointIndicator` component
- [ ] Update existing `ZoneCard` if it exists

## ⏳ Phase 5: Submission Logic (TODO - 2-3 hours)

### Form Handling
- [ ] Update submission action to handle checkpoint_number
- [ ] Store total_checkpoints from zone data
- [ ] Update zone completion tracking
- [ ] Calculate points by zone type
- [ ] Update zone counters (short/medium/long_zones_completed)

### Validation
- [ ] Verify checkpoint exists before submission
- [ ] Check checkpoint_number <= total_checkpoints
- [ ] Validate sequential checkpoint completion
- [ ] Prevent duplicate checkpoint submissions

### Points Calculation
- [ ] Update to use new zone type counters
- [ ] Calculate per zone type
- [ ] Apply correct bonuses
- [ ] Test edge cases

## ⏳ Phase 6: Testing (TODO - 2-3 hours)

### Functional Testing
- [ ] Create test participant account
- [ ] Test short zone (1 checkpoint)
  - [ ] Start zone
  - [ ] Submit checkpoint 1
  - [ ] Verify 12 points awarded
  - [ ] Check completion status
- [ ] Test medium zone (2 checkpoints)
  - [ ] Start zone
  - [ ] Submit checkpoint 1
  - [ ] Verify partial completion
  - [ ] Submit checkpoint 2
  - [ ] Verify 20 points total
  - [ ] Check full completion
- [ ] Test long zone (3 checkpoints)
  - [ ] Start zone
  - [ ] Submit all 3 checkpoints
  - [ ] Verify 35 points total
  - [ ] Check completion indicators

### Points Testing
- [ ] Complete 2 short zones = 24 pts
- [ ] Complete 4 medium zones = 80 pts
- [ ] Complete 2 long zones = 70 pts
- [ ] Verify all zones bonus = +30 pts
- [ ] Test 4+ zones minimum bonus = +10 pts
- [ ] Verify other bonuses still work

### Edge Cases
- [ ] Attempt to submit checkpoint 2 before checkpoint 1
- [ ] Submit invalid checkpoint_number
- [ ] Submit same checkpoint twice
- [ ] Legacy zones without checkpoints array
- [ ] Partial zone completion scenarios

### Integration Testing
- [ ] Full rally flow (start to finish)
- [ ] Multiple participants
- [ ] Leaderboard accuracy
- [ ] Live map updates
- [ ] Admin dashboard shows correct data

## ⏳ Phase 7: Documentation Updates (TODO - 1 hour)

### User-Facing Docs
- [ ] Update participant guide with new zone types
- [ ] Explain checkpoint system
- [ ] Update points explanation
- [ ] Add examples of strategic choices

### Admin Docs
- [ ] Update admin guide with checkpoint management
- [ ] Document manual checkpoint entry
- [ ] Explain zone type selection criteria

## 🚀 Phase 8: Deployment (TODO - 1 hour)

### Pre-Deployment
- [ ] Review all changes in staging
- [ ] Run full test suite
- [ ] Backup production database
- [ ] Create rollback plan
- [ ] Notify team of deployment

### Deployment Steps
- [ ] Deploy database migrations
- [ ] Deploy Sanity schema changes
- [ ] Deploy application code
- [ ] Run data migration
- [ ] Verify no errors in logs
- [ ] Test critical paths

### Post-Deployment
- [ ] Monitor error logs
- [ ] Test with real participant account
- [ ] Verify points calculation
- [ ] Check leaderboard accuracy
- [ ] Gather initial feedback

## 📊 Success Metrics

After deployment, track:
- [ ] Zone completion rates by type
- [ ] Average checkpoints per participant
- [ ] Points distribution
- [ ] Most/least popular zones
- [ ] Checkpoint abandonment rates
- [ ] Participant feedback

## 🔄 Iteration Plan

Week 1:
- [ ] Monitor completion patterns
- [ ] Gather participant feedback
- [ ] Note any UI/UX issues

Week 2:
- [ ] Analyze data
- [ ] Identify needed adjustments
- [ ] Plan refinements

Week 3:
- [ ] Implement improvements
- [ ] Test changes
- [ ] Deploy updates

## 📞 Support

If issues arise:
1. Check error logs first
2. Review documentation in `/docs/advanced/`
3. Test in staging environment
4. Rollback if critical issues found

## 🎯 Definition of Done

System is complete when:
- [x] Core schema and types implemented
- [ ] Database migrations run successfully
- [ ] All zones have correct types and checkpoints
- [ ] UI displays new system correctly
- [ ] Submissions work per checkpoint
- [ ] Points calculate accurately
- [ ] All tests pass
- [ ] Staging fully functional
- [ ] Production deployed successfully
- [ ] Participant feedback positive

---

**Current Status:** Phase 1 Complete (Core System) ✅
**Next Step:** Phase 2 - Deployment & Data
**Estimated Remaining:** 10-15 hours
**Target Completion:** [Your deadline here]
