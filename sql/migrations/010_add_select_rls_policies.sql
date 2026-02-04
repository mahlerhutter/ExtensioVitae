-- =====================================================
-- Migration 010: Add/Fix SELECT RLS Policies
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Ensure all tables have proper SELECT policies
--          without using is_admin_user() function (recursion issue)
-- =====================================================

-- =====================================================
-- 1. ENSURE RLS IS ENABLED ON ALL TABLES
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. USER_PROFILES SELECT POLICIES
-- =====================================================

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- User can view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Admin policy using direct auth.jwt() check (no recursion)
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 3. HEALTH_PROFILES SELECT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own health profile" ON health_profiles;
DROP POLICY IF EXISTS "Admins can view all health profiles" ON health_profiles;

CREATE POLICY "Users can view own health profile"
    ON health_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all health profiles"
    ON health_profiles FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 4. INTAKE_RESPONSES SELECT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own intake" ON intake_responses;
DROP POLICY IF EXISTS "Admins can view all intake" ON intake_responses;

CREATE POLICY "Users can view own intake"
    ON intake_responses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all intake"
    ON intake_responses FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 5. PLANS SELECT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own plans" ON plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON plans;

CREATE POLICY "Users can view own plans"
    ON plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all plans"
    ON plans FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 6. DAILY_PROGRESS SELECT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON daily_progress;

CREATE POLICY "Users can view own progress"
    ON daily_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
    ON daily_progress FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 7. PLAN_SNAPSHOTS SELECT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own snapshots" ON plan_snapshots;
DROP POLICY IF EXISTS "Admins can view all snapshots" ON plan_snapshots;

CREATE POLICY "Users can view own snapshots"
    ON plan_snapshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all snapshots"
    ON plan_snapshots FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 8. FEEDBACK SELECT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;

CREATE POLICY "Users can view own feedback"
    ON feedback FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
    ON feedback FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 9. ADMIN_CONFIG - Only admins can read
-- =====================================================

DROP POLICY IF EXISTS "Admins can view config" ON admin_config;

-- Admins can view admin config (using jwt to avoid recursion)
CREATE POLICY "Admins can view config"
    ON admin_config FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 10. VERIFICATION QUERY
-- =====================================================
-- Run this to verify all policies are created:

SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename IN (
    'user_profiles',
    'health_profiles',
    'intake_responses',
    'plans',
    'daily_progress',
    'plan_snapshots',
    'feedback',
    'admin_config'
)
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- NOTES
-- =====================================================
--
-- This migration uses auth.jwt() ->> 'email' instead of
-- is_admin_user() function to avoid RLS recursion issues.
--
-- The jwt() function extracts the email directly from the
-- JWT token without querying user_profiles table.
--
-- To test:
-- 1. Login as User A, create a plan
-- 2. Login as User B, try SELECT * FROM plans WHERE id = '[User A plan id]'
-- 3. Expected: Empty result (permission denied silently)
-- 4. Login as User A, try same query
-- 5. Expected: Plan returned
--
-- =====================================================
