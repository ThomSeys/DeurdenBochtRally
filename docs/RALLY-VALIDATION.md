# Rally Zone Solution Validation System

## Overview
The rally submission system now uses Sanity CMS as the source of truth for rally zones and validates submitted codes against the correct solutions stored in Sanity.

## Changes Made

### 1. Sanity Schema Updates
**File:** `sanity-studio/schemaTypes/rallyZone.ts`

Added two new fields to the rally zone schema:
- **solution** (string, required): The correct answer/code for this zone
- **color** (string, required): Zone difficulty color (green/yellow/orange/red)

### 2. TypeScript Type Updates
**File:** `apps/web/app/lib/sanity.server.ts`

Updated the `RallyZone` type to include:
```typescript
solution: string;
color: 'green' | 'yellow' | 'orange' | 'red';
```

Updated the `getRallyZones()` query to fetch these new fields.

### 3. Rally Submission Updates
**File:** `apps/web/app/routes/dashboard.rally-submission.tsx`

**Loader:**
- Now fetches rally zones from Sanity using `getRallyZones()`
- Zones are dynamically loaded based on the active edition

**Action:**
- Validates submitted codes against Sanity solutions
- Case-insensitive comparison after trimming whitespace
- Returns error message with zone title if code is incorrect
- Only validates if code is not empty (allows skipping zones)

**Component:**
- Dynamically builds zone list from Sanity data
- Uses zone titles, descriptions, and colors from CMS

### 4. Update Script
**File:** `scripts/update-rally-zones.ts`

A utility script to update existing rally zones with solution codes and colors.

## Usage

### Setting Up Rally Zones in Sanity

1. Open Sanity Studio
2. Navigate to Rally Zones
3. For each zone, add:
   - **Solution Code**: The correct answer participants must find
   - **Zone Color**: The difficulty level (green/yellow/orange/red)

### Running the Update Script

If you have existing rally zones without solutions:

```bash
cd /Users/thomasseyssens/Desktop/Deur\ Den\ Bocht/2026/site
npx tsx scripts/update-rally-zones.ts
```

**Important:** Edit the `rallyZonesData` array in the script with the actual solution codes before running!

### How Validation Works

1. User submits a zone code through the stepper form
2. System fetches the corresponding rally zone from Sanity
3. Submitted code is compared to the solution (case-insensitive, trimmed)
4. If correct: Code is saved and user advances to next zone
5. If incorrect: Error message is shown with zone name
6. Empty codes are allowed (users can skip zones)

## Benefits

✅ **Centralized Management**: All rally zone data in Sanity
✅ **Security**: Solutions never exposed to client-side code
✅ **Flexibility**: Easy to update codes or add new zones
✅ **Edition Support**: Zones can be edition-specific
✅ **Validation**: Prevents incorrect submissions
✅ **Dynamic**: No hardcoded zone data in application

## Next Steps

1. Add actual solution codes to rally zones in Sanity Studio
2. Test submission with correct and incorrect codes
3. Consider adding:
   - Points per zone (configurable in Sanity)
   - Hints or clues in Sanity
   - Time-based bonuses
   - Zone-specific rules
