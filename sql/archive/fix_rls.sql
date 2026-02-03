-- ============================================
-- EXTENSIOVITAE RLS FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- First, let's ensure the trigger for new users works correctly
-- Drop and recreate the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, user_profiles.name),
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policies for authenticated users to INSERT their own data
-- (Some might already exist, so we use IF NOT EXISTS pattern)

-- Drop existing insert policies if they exist and recreate
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Fix intake_responses to allow inserts where user_id matches auth.uid()
DROP POLICY IF EXISTS "Users can insert own intake" ON intake_responses;
CREATE POLICY "Users can insert own intake"
    ON intake_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Ensure select policy allows null user_id matches for legacy data
DROP POLICY IF EXISTS "Users can view own intake" ON intake_responses;
CREATE POLICY "Users can view own intake"
    ON intake_responses FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Fix plans table
DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
CREATE POLICY "Users can insert own plans"
    ON plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own plans" ON plans;
CREATE POLICY "Users can view own plans"
    ON plans FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Fix daily_progress table
DROP POLICY IF EXISTS "Users can insert own progress" ON daily_progress;
CREATE POLICY "Users can insert own progress"
    ON daily_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;
CREATE POLICY "Users can view own progress"
    ON daily_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Add UPSERT support for daily_progress (needed for updateProgress function)
DROP POLICY IF EXISTS "Users can upsert own progress" ON daily_progress;

-- Create user profile for existing auth users who don't have one
INSERT INTO public.user_profiles (id, name, email)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    au.email
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify tables exist and show counts
SELECT 'user_profiles' as table_name, COUNT(*) as row_count FROM user_profiles
UNION ALL
SELECT 'intake_responses', COUNT(*) FROM intake_responses
UNION ALL
SELECT 'plans', COUNT(*) FROM plans
UNION ALL
SELECT 'daily_progress', COUNT(*) FROM daily_progress;
