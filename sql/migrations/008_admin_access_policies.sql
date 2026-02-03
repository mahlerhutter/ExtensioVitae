-- =====================================================
-- Migration 008: Admin Access for All Tables
-- =====================================================
-- 
-- Problem: Admin page shows 0 users because RLS blocks access
-- Solution: Add admin policies based on email whitelist
-- 
-- IMPORTANT: This uses a function-based approach to check admin emails
-- =====================================================

-- =====================================================
-- 1. CREATE ADMIN CHECK FUNCTION
-- =====================================================

-- Drop existing function if any
DROP FUNCTION IF EXISTS is_admin_user();

-- Create function to check if current user is admin
-- This checks against a list of admin emails
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    admin_emails TEXT[] := ARRAY[
        'manuelmahlerhutter@gmail.com',
        'test-user-db-error@example.com'
    ];
BEGIN
    -- Get the current user's email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Check if user's email is in the admin list
    RETURN user_email = ANY(admin_emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. ADD ADMIN POLICIES FOR USER_PROFILES
-- =====================================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create admin read policy
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin_user());

-- =====================================================
-- 3. ADD ADMIN POLICIES FOR PLANS
-- =====================================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all plans" ON plans;

-- Create admin read policy
CREATE POLICY "Admins can view all plans"
    ON plans FOR SELECT
    USING (is_admin_user());

-- =====================================================
-- 4. ADD ADMIN POLICIES FOR INTAKE_RESPONSES
-- =====================================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all intake" ON intake_responses;

-- Create admin read policy
CREATE POLICY "Admins can view all intake"
    ON intake_responses FOR SELECT
    USING (is_admin_user());

-- =====================================================
-- 5. ADD ADMIN POLICIES FOR FEEDBACK
-- =====================================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON feedback;

-- Create admin read policy
CREATE POLICY "Admins can view all feedback"
    ON feedback FOR SELECT
    USING (is_admin_user());

-- Create admin update policy
CREATE POLICY "Admins can update all feedback"
    ON feedback FOR UPDATE
    USING (is_admin_user());

-- =====================================================
-- 6. ADD ADMIN POLICIES FOR HEALTH_PROFILES
-- =====================================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all health profiles" ON health_profiles;

-- Create admin read policy
CREATE POLICY "Admins can view all health profiles"
    ON health_profiles FOR SELECT
    USING (is_admin_user());

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('user_profiles', 'plans', 'intake_responses', 'feedback', 'health_profiles')
ORDER BY tablename, policyname;

-- Test the admin function (run as logged-in admin)
-- SELECT is_admin_user();

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- To add new admin emails:
-- 1. Run: ALTER FUNCTION is_admin_user() REPLACE AS $$ ... $$ with updated array
-- 2. Or update the array in this migration and re-run
-- 
-- The SECURITY DEFINER allows the function to access auth.users
-- even though RLS would normally block it
-- =====================================================
