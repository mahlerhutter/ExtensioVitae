-- Migration: Fix Feedback RLS for Admin Access
-- Date: 2026-02-03
-- Description: Simplify RLS policies to allow admins to view all feedback
-- This migration is IDEMPOTENT - safe to run multiple times

-- Drop existing SELECT policies (both old and new names)
DROP POLICY IF EXISTS "Authenticated users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- Drop and recreate INSERT policy to ensure it exists
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create new SELECT policy: Any authenticated user can view ALL feedback
-- (Admin check happens in the frontend)
CREATE POLICY "Authenticated users can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can update feedback (admin check in frontend)
CREATE POLICY "Authenticated users can update feedback"
  ON feedback FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE feedback IS 'User feedback - RLS simplified, admin check in frontend';
