-- Complete Feedback Setup - Run All At Once
-- This combines column additions + RLS policies
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Add Missing Columns
-- =============================================
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS task_helpful BOOLEAN;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS what_you_like TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS what_to_improve TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS general_comment TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS task_id TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS day_number INTEGER CHECK (day_number >= 1 AND day_number <= 30);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- =============================================
-- STEP 2: Enable RLS
-- =============================================
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 3: Drop All Existing Policies
-- =============================================
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- =============================================
-- STEP 4: Create New Policies
-- =============================================

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- All authenticated users can view all feedback (admin check in frontend)
CREATE POLICY "Authenticated users can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can update feedback (admin check in frontend)
CREATE POLICY "Authenticated users can update feedback"
  ON feedback FOR UPDATE
  TO authenticated
  USING (true);

-- =============================================
-- STEP 5: Verify Setup
-- =============================================

-- Show all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Show all policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'feedback';
