-- =====================================================
-- Fix Admin Config Infinite Recursion
-- =====================================================
-- The admin_config RLS policies are causing infinite recursion
-- because they reference is_admin() which queries admin_config
-- =====================================================

-- 1. Drop ALL policies on admin_config
DROP POLICY IF EXISTS "Admins can read admin config" ON admin_config;
DROP POLICY IF EXISTS "Admins can update admin config" ON admin_config;
DROP POLICY IF EXISTS "Enable read for admins" ON admin_config;
DROP POLICY IF EXISTS "Enable insert for admins" ON admin_config;
DROP POLICY IF EXISTS "Enable update for admins" ON admin_config;
DROP POLICY IF EXISTS "Enable delete for admins" ON admin_config;

-- 2. Create SIMPLE policies that don't use is_admin()
-- Allow authenticated users to READ (needed for is_admin() function)
CREATE POLICY "Anyone authenticated can read admin config" ON admin_config
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service_role can modify (via SQL Editor)
CREATE POLICY "Only service role can modify admin config" ON admin_config
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Fix is_admin() function to avoid recursion
-- =====================================================

DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS is_admin();

-- Simplified version that just checks the table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_config 
        WHERE admin_email = auth.jwt()->>'email'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- Fix other table policies to use the corrected is_admin()
-- =====================================================

-- User Profiles: Simplify policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles" ON user_profiles
    FOR SELECT
    USING (is_admin());

-- Plans: Simplify policies  
DROP POLICY IF EXISTS "Admins can read all plans" ON plans;
CREATE POLICY "Admins can read all plans" ON plans
    FOR SELECT
    USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all plans" ON plans;
CREATE POLICY "Admins can update all plans" ON plans
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- =====================================================
-- Verification
-- =====================================================

SELECT 'Admin config policies:' as check, COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'admin_config'
UNION ALL
SELECT 'is_admin function exists:', COUNT(*)
FROM pg_proc 
WHERE proname = 'is_admin';

-- =====================================================
-- DONE - Refresh the page and try again!
-- =====================================================
