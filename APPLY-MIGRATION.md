# Apply Database Migration - QUICK FIX

## ✅ The Problem
The `zone_closure_log` table doesn't exist in your Supabase database yet, causing TypeScript errors in [admin.zone-control.tsx](apps/web/app/routes/admin.zone-control.tsx).

## 🚀 Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/gxhseyrdqytkmujwtmlu/sql
2. Click "New Query"

### Step 2: Run Migration Script
Copy the entire contents of [scripts/rally-scenarios-migration.sql](scripts/rally-scenarios-migration.sql) and paste it into the SQL editor.

Click **"Run"**

### Step 3: Regenerate TypeScript Types

You have two options:

#### Option A: Using setup-db.sh script
```bash
cd /Users/thomasseyssens/Desktop/Deur\ Den\ Bocht/2026/site
./setup-db.sh
```

#### Option B: Manual command (if script doesn't work)
```bash
cd apps/web

# Install supabase CLI if needed
npm install -g supabase

# Generate types
npx supabase gen types typescript --project-id gxhseyrdqytkmujwtmlu > app/lib/database.types.ts
```

## ✅ Verification

After running the migration, check that the errors are gone:

```bash
cd apps/web
npm run build
```

You should see **0 errors** instead of 6.

## 🎯 What This Migration Does

Creates:
- ✅ `zone_closure_log` table - Tracks when admins open/close zones
- ✅ `manual_score_adjustments` table - For tie-breaking
- ✅ Adds new columns to `rally_zone_submissions` (validation workflow)
- ✅ Adds `status` column to `participants` table

All tables needed for the rally scenarios feature!

## ❓ If You Get Errors

If the migration fails with "column already exists":
- That's OK! It means parts of it ran before
- The script uses `IF NOT EXISTS` so it's safe to run multiple times

If you get permission errors:
- Make sure you're logged into the correct Supabase project
- Check that your service role key has admin permissions

## 🏁 Next Steps

After migration succeeds:
1. Rebuild your app: `cd apps/web && npm run build`
2. Test the zone control page: `/admin/zone-control`
3. Test event markers page: `/admin/event-markers`

Both should now work without errors!
