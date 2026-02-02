-- Migration: Add 'inactive' status and update existing data
-- Date: 2026-02-02
-- Purpose: Align database schema and existing data with new semantic naming convention
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;

-- Step 2: Add the new CHECK constraint with 'inactive' included
ALTER TABLE plans ADD CONSTRAINT plans_status_check 
  CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled', 'inactive'));

-- Step 3: Update all plans with 'cancelled' status to 'inactive'
UPDATE plans
SET status = 'inactive',
    updated_at = NOW()
WHERE status = 'cancelled';

-- Step 4: Verify the migration
SELECT 
    status,
    COUNT(*) as count
FROM plans
GROUP BY status
ORDER BY status;

-- Expected output: You should see counts for each status, with 'inactive' having the former 'cancelled' count
