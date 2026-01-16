# Multi-Checkpoint Rally Zone System

## 🎯 Overview

This document describes the new 3-tier Rally Zone system with multiple checkpoints, designed to create more engaging and strategic rally experiences.

## 📊 System Architecture

### Zone Types

The system introduces three distinct zone types:

#### 🟢 Type A – Korte Verleider (Short Temptation)
- **Distance**: 5-8 km
- **Checkpoints**: 1
- **Points**: 12 base points
- **Purpose**: Low barrier, quick wins, warm-up zones
- **Psychological Effect**: "Ah okay, this is fun!"

#### 🟡 Type B – Beslisser (Decision Maker)
- **Distance**: 15-25 km
- **Checkpoints**: 2
- **Points**: 20 base points (10 per checkpoint)
- **Purpose**: Strategic decisions, moderate commitment
- **Psychological Effect**: "Here I can win or lose"

#### 🔴 Type C – De Grote Omweg (The Big Detour)
- **Distance**: 30-45 km
- **Checkpoints**: 3
- **Points**: 35 base points (~12 per checkpoint)
- **Purpose**: Full adventure, major commitment
- **Psychological Effect**: "This was a rally within the rally"

### Recommended Distribution

For 8 zones total:
- **2 short zones** (Type A)
- **4 medium zones** (Type B)
- **2 long zones** (Type C)

This creates a balanced experience where:
- Main route: ~350 km (carrying capacity)
- Rally zones: ~150 km (strategic decisions)
- Total engagement: ~500 km

## 🗄️ Database Schema

### rally_zone_submissions

New fields added:

```sql
checkpoint_number INTEGER NOT NULL DEFAULT 1
  -- Which checkpoint (1-3) this submission is for

total_checkpoints INTEGER NOT NULL DEFAULT 1
  -- Total number of checkpoints in this zone (1-3)
```

### rally_submissions

New tracking fields:

```sql
short_zones_completed INTEGER DEFAULT 0
medium_zones_completed INTEGER DEFAULT 0
long_zones_completed INTEGER DEFAULT 0
```

## 🎨 Sanity CMS Schema

### rallyZone Document Type

New fields:

```typescript
zoneType: 'short' | 'medium' | 'long'
  // Determines length, difficulty, checkpoint count

estimatedDistance: number
  // Estimated loop distance in km

checkpoints: Array<{
  name: string              // "Checkpoint 1: De Brug"
  description: string       // What the checkpoint is
  codeHint: string         // Hint for what to look for
  solution: string         // Correct answer/code
  validAnswers: string[]   // Alternative accepted answers
  location?: {             // GPS coordinates
    lat: number
    lng: number
  }
}>
```

Legacy fields (hidden but kept for backward compatibility):
- `checkpoint` (single string)
- `codeHint` (single string)
- `solution` (single string)
- `validAnswers` (single array)

## 💰 Points System

### Zone Completion Points

| Zone Type | Base Points | Per Checkpoint | Total |
|-----------|-------------|----------------|-------|
| Short (1) | 12 | 12 | 12 |
| Medium (2) | 20 | 10 | 20 |
| Long (3) | 35 | ~12 | 35 |

### Bonuses

- **All 8 zones**: +30 points (increased from 20)
- **4+ zones** (minimum qualification): +10 points
- **Distance >500km**: +10 points
- **No highways**: +10 points
- **Weather bonus**: +5 points

### Maximum Theoretical Score

```
Short zones:  2 × 12 = 24
Medium zones: 4 × 20 = 80
Long zones:   2 × 35 = 70
All zones bonus:      30
Distance bonus:       10
No highways:          10
Weather:               5
─────────────────────────
Total:               229 points
```

## 🔄 Migration Process

### 1. Schema Migration

Run the Sanity schema migration:

```bash
cd scripts
npm run ts-node migrate-to-multi-checkpoint.ts
```

This will:
- Add `zoneType` and `estimatedDistance` to all zones
- Convert single checkpoint to checkpoint array
- Add placeholder checkpoints for medium/long zones

### 2. Database Migration

Run the SQL migration:

```bash
psql [connection] < add-multi-checkpoint-system.sql
```

This will:
- Add `checkpoint_number` and `total_checkpoints` to submissions
- Add zone type counters to rally_submissions
- Update the rally_director_dashboard view

### 3. Manual Steps

After automated migration:

1. **Review zones in Sanity Studio**
   - Check zone type assignments
   - Verify estimated distances

2. **Define additional checkpoints**
   - Replace "PLACEHOLDER2" and "PLACEHOLDER3"
   - Add descriptive clues
   - Add GPS coordinates

3. **Test submission flow**
   - Submit checkpoint 1 of a medium zone
   - Submit checkpoint 2
   - Verify points calculation

## 📱 UI/UX Updates Needed

### Zone Overview Page
- [ ] Display zone type badge (Short/Medium/Long)
- [ ] Show estimated distance
- [ ] List all checkpoints with numbering
- [ ] Show points per checkpoint

### Zone Detail Page
- [ ] Checkpoint accordion/tabs
- [ ] Progressive reveal (checkpoint 2 unlocks after 1)
- [ ] Checkpoint completion indicators

### Submission Form
- [ ] Support multiple submissions per zone
- [ ] Checkpoint selection/indicator
- [ ] Show remaining checkpoints
- [ ] Aggregate zone completion status

### Leaderboard
- [ ] Show zone type breakdown (2/2 short, 3/4 medium, 1/2 long)
- [ ] Display checkpoint completion ratio
- [ ] Highlight strategic completions

### Live Map
- [ ] Different markers for checkpoint types
- [ ] Show which checkpoint of a zone
- [ ] Completion indicators per zone

## 🧪 Testing Checklist

### Sanity Studio
- [ ] Create new zone with 1 checkpoint (short)
- [ ] Create new zone with 2 checkpoints (medium)
- [ ] Create new zone with 3 checkpoints (long)
- [ ] Edit checkpoint details
- [ ] Verify validation rules

### Database
- [ ] Submit checkpoint 1 of medium zone
- [ ] Submit checkpoint 2 of same zone
- [ ] Verify checkpoint_number increments
- [ ] Check points calculation
- [ ] Test completion tracking

### User Flow
- [ ] Start a short zone
- [ ] Complete short zone (1 checkpoint)
- [ ] Start a medium zone
- [ ] Complete medium zone (2 checkpoints)
- [ ] Start a long zone
- [ ] Complete long zone (3 checkpoints)
- [ ] Submit final rally submission
- [ ] Verify final score includes all bonuses

## 🎯 Strategic Implications

### For Participants

**Minimum Strategy** (4 zones minimum):
- 2 short (24 pts) + 2 medium (40 pts) = 64 pts + 10 bonus = 74 pts

**Balanced Strategy** (6 zones):
- 2 short (24) + 4 medium (80) = 104 pts + 10 bonus = 114 pts

**Completionist** (8 zones):
- All zones (174 pts) + 30 bonus = 204 pts + other bonuses

### For Organizers

**Points Distribution**:
- Longest zones have highest value
- Forces strategic choices
- Rewards commitment
- Makes "just follow GPX" non-competitive

**Engagement**:
- Multiple checkpoints create investment
- "Sunk cost" keeps riders engaged
- Creates memorable stories
- Varies difficulty across event

## 📊 Analytics & Reporting

New metrics to track:

- Zone completion by type
- Checkpoint abandonment rate
- Average time per zone type
- Most/least popular zones
- Strategic patterns (which types riders choose)

## 🔮 Future Enhancements

Potential additions:

1. **Dynamic Checkpoint Unlocking**
   - Checkpoint 2 only appears after completing checkpoint 1
   - GPS-based proximity unlocking

2. **Checkpoint Difficulty Ratings**
   - Easy/Medium/Hard per checkpoint
   - Bonus points for harder checkpoints

3. **Time-Based Scoring**
   - Faster completion = more points
   - Shadow score per checkpoint

4. **Zone Chaining Bonuses**
   - Complete consecutive zones
   - Regional completion bonuses

5. **Checkpoint Photos**
   - Required proof photos
   - Photo validation scoring

## 📞 Support & Questions

For questions about this system:
- Check `/docs/advanced/RALLY-SCENARIOS-IMPLEMENTATION.md`
- Review Sanity schema: `/sanity-studio/schemaTypes/rallyZone.ts`
- Database schema: `/scripts/add-multi-checkpoint-system.sql`

## 📝 Changelog

### 2026-01-16
- Initial implementation of 3-tier zone system
- Added multi-checkpoint support
- Updated points calculation
- Created migration scripts
