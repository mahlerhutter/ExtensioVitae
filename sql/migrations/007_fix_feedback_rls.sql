-- =====================================================
-- Migration 007: Fix Feedback Table RLS Policies
-- =====================================================
-- 
-- Problem: Admin policies try to access auth.users table,
-- causing "permission denied for table users" error
-- 
-- Solution: Remove problematic admin policies that query auth.users
-- =====================================================

-- =====================================================
-- 1. DROP PROBLEMATIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- =====================================================
-- 2. KEEP ONLY USER-SCOPED POLICIES
-- =====================================================

-- Users can insert their own feedback (already exists, recreate for safety)
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback (already exists, recreate for safety)
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. ADMIN ACCESS VIA SERVICE ROLE
-- =====================================================

-- Note: Admins should use the service role key to access all feedback
-- This is more secure than RLS policies that query auth.users
-- 
-- Admin queries should be made server-side or via Supabase dashboard
-- with the service role key, which bypasses RLS entirely

-- =====================================================
-- Done!
-- =====================================================

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'feedback';
