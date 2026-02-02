# Database Migration Guide

## Current Issue
The live Supabase database still has the old CHECK constraint that doesn't allow `'inactive'` status. This causes errors when the frontend tries to set plans to inactive.

## Solution: Run Migration Script

### Steps to Execute

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your ExtensioVitae project
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the Migration**
   - Click **New Query**
   - Copy the entire contents of `sql/migrations/001_update_cancelled_to_inactive.sql`
   - Paste into the SQL editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

3. **Verify Success**
   - The query should complete without errors
   - Check the output table showing status counts
   - You should see `inactive` status with a count (formerly `cancelled`)

### What the Migration Does

1. **Drops** the old CHECK constraint
2. **Adds** a new CHECK constraint that includes `'inactive'`
3. **Updates** all existing `'cancelled'` plans to `'inactive'`
4. **Verifies** the changes with a count query

### Expected Output

```
status      | count
------------|------
active      | 2
completed   | 0
inactive    | 3
paused      | 0
pending     | 0
```

### If Something Goes Wrong

If you encounter errors, you can rollback:

```sql
-- Rollback: Revert to old constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;
ALTER TABLE plans ADD CONSTRAINT plans_status_check 
  CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled'));

-- Revert data
UPDATE plans SET status = 'cancelled' WHERE status = 'inactive';
```

### After Migration

Once the migration is complete:
1. The admin cleanup function (🧹) will work correctly
2. Creating new plans will properly set old plans to `inactive`
3. The "Vergangene Pläne" section will display correctly

---

**Important:** This migration is **safe to run** - it only adds a new allowed value and updates existing data. No data is deleted.
