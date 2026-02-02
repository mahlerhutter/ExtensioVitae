-- ============================================
-- EXTENSIOVITAE ADMIN POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Create an admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT email = 'manuelmahlerhutter@gmail.com'
        FROM auth.users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies to view ALL data

-- User Profiles: Admin can see all
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
CREATE POLICY "Admin can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin() OR auth.uid() = id);

-- Intake Responses: Admin can see all
DROP POLICY IF EXISTS "Admin can view all intakes" ON intake_responses;
CREATE POLICY "Admin can view all intakes"
    ON intake_responses FOR SELECT
    USING (is_admin() OR auth.uid() = user_id);

-- Plans: Admin can see all
DROP POLICY IF EXISTS "Admin can view all plans" ON plans;
CREATE POLICY "Admin can view all plans"
    ON plans FOR SELECT
    USING (is_admin() OR auth.uid() = user_id);

-- Daily Progress: Admin can see all
DROP POLICY IF EXISTS "Admin can view all progress" ON daily_progress;
CREATE POLICY "Admin can view all progress"
    ON daily_progress FOR SELECT
    USING (is_admin() OR auth.uid() = user_id);

-- WhatsApp Messages: Admin can see all
DROP POLICY IF EXISTS "Admin can view all messages" ON whatsapp_messages;
CREATE POLICY "Admin can view all messages"
    ON whatsapp_messages FOR SELECT
    USING (is_admin() OR auth.uid() = user_id);

-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own intake" ON intake_responses;
DROP POLICY IF EXISTS "Users can view own plans" ON plans;
DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can view own messages" ON whatsapp_messages;

-- ============================================
-- ADMIN DELETE POLICIES
-- ============================================

-- Admin can delete any plan
DROP POLICY IF EXISTS "Admin can delete any plan" ON plans;
CREATE POLICY "Admin can delete any plan"
    ON plans FOR DELETE
    USING (is_admin());

-- Admin can delete any progress
DROP POLICY IF EXISTS "Admin can delete any progress" ON daily_progress;
CREATE POLICY "Admin can delete any progress"
    ON daily_progress FOR DELETE
    USING (is_admin());

-- Admin can delete any intake
DROP POLICY IF EXISTS "Admin can delete any intake" ON intake_responses;
CREATE POLICY "Admin can delete any intake"
    ON intake_responses FOR DELETE
    USING (is_admin());

-- Admin can delete any user profile
DROP POLICY IF EXISTS "Admin can delete any profile" ON user_profiles;
CREATE POLICY "Admin can delete any profile"
    ON user_profiles FOR DELETE
    USING (is_admin());

-- Verify the admin function works
SELECT is_admin() AS "is_admin_check";

