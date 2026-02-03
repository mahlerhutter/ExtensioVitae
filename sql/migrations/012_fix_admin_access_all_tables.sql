-- Migration: Fix Admin Access for All Tables
-- Date: 2026-02-03
-- Description: Allow authenticated users to view all data (admin check happens in frontend)
-- This is a temporary solution until proper admin roles are implemented

-- =============================================
-- USER PROFILES - Allow admins to view all
-- =============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- PLANS - Allow admins to view and manage all
-- =============================================
DROP POLICY IF EXISTS "Admins can view all plans" ON plans;
DROP POLICY IF EXISTS "Admins can delete any plan" ON plans;

CREATE POLICY "Authenticated users can view all plans"
  ON plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete any plan"
  ON plans FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- INTAKE_DATA - Allow admins to view all
-- =============================================
DROP POLICY IF EXISTS "Admins can view all intake data" ON intake_data;

CREATE POLICY "Authenticated users can view all intake"
  ON intake_data FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- DAILY_PROGRESS - Allow admins to view and manage all
-- =============================================  
DROP POLICY IF EXISTS "Admins can view all progress" ON daily_progress;
DROP POLICY IF EXISTS "Admins can delete any progress" ON daily_progress;

CREATE POLICY "Authenticated users can view all progress"
  ON daily_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete any progress"
  ON daily_progress FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- FEEDBACK - Already handled in 011 migration
-- =============================================

COMMENT ON POLICY "Authenticated users can view all profiles" ON user_profiles IS 'Temporary: Admin check in frontend';
COMMENT ON POLICY "Authenticated users can view all plans" ON plans IS 'Temporary: Admin check in frontend';
