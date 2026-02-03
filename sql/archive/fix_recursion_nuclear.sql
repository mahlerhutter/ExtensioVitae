-- =====================================================
-- NUCLEAR FIX: Remove ALL is_admin() references
-- =====================================================
-- The problem: ANY policy that calls is_admin() causes recursion
-- Solution: Temporarily disable admin-specific policies
-- =====================================================

-- 1. Drop is_admin() function entirely (CASCADE removes dependent policies)
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- 2. Drop ALL policies that reference is_admin()
-- User Profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Plans
DROP POLICY IF EXISTS "Admins can read all plans" ON plans;
DROP POLICY IF EXISTS "Admins can update all plans" ON plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON plans;

-- Intake Responses
DROP POLICY IF EXISTS "Admins can read all intake responses" ON intake_responses;
DROP POLICY IF EXISTS "Admins can update intake responses" ON intake_responses;

-- Health Profiles
DROP POLICY IF EXISTS "Admins can read all health profiles" ON health_profiles;
DROP POLICY IF EXISTS "Admins can update health profiles" ON health_profiles;

-- Daily Progress
DROP POLICY IF EXISTS "Admins can read all progress" ON daily_progress;
DROP POLICY IF EXISTS "Admins can update all progress" ON daily_progress;

-- Feedback
DROP POLICY IF EXISTS "Admins can read all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- Plan Snapshots
DROP POLICY IF EXISTS "Admins can read all snapshots" ON plan_snapshots;

-- 3. Simplify admin_config policies (NO recursion)
DROP POLICY IF EXISTS "Admins can read admin config" ON admin_config;
DROP POLICY IF EXISTS "Admins can update admin config" ON admin_config;
DROP POLICY IF EXISTS "Enable read for admins" ON admin_config;
DROP POLICY IF EXISTS "Enable insert for admins" ON admin_config;
DROP POLICY IF EXISTS "Enable update for admins" ON admin_config;
DROP POLICY IF EXISTS "Enable delete for admins" ON admin_config;
DROP POLICY IF EXISTS "Anyone authenticated can read admin config" ON admin_config;
DROP POLICY IF EXISTS "Only service role can modify admin config" ON admin_config;

-- Simple policy: Everyone can read (needed for future is_admin() checks)
CREATE POLICY "Public read access" ON admin_config
    FOR SELECT
    USING (true);

-- Only service_role can modify
CREATE POLICY "Service role full access" ON admin_config
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Verification
-- =====================================================

-- Check that no policies reference is_admin
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%';

-- Should return 0 rows!

-- =====================================================
-- DONE - Refresh browser!
-- =====================================================
