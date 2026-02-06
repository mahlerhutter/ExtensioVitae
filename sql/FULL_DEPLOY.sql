-- Migration: Add 'inactive' status and update existing data
-- Date: 2026-02-02
-- Purpose: Align database schema and existing data with new semantic naming convention
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;

-- Step 2: Add the new CHECK constraint with 'inactive' included
ALTER TABLE plans ADD CONSTRAINT plans_status_check 
  CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled', 'inactive'));

-- Step 3: Update all plans with 'cancelled' status to 'inactive'
UPDATE plans
SET status = 'inactive',
    updated_at = NOW()
WHERE status = 'cancelled';

-- Step 4: Verify the migration
SELECT 
    status,
    COUNT(*) as count
FROM plans
GROUP BY status
ORDER BY status;

-- Expected output: You should see counts for each status, with 'inactive' having the former 'cancelled' count
-- Migration: Add unique constraint to intake_responses.user_id
-- Date: 2026-02-02
-- Purpose: Fix upsert operation for intake data syncing

-- Add unique constraint on user_id
-- This allows the upsert operation in saveIntakeToSupabase to work correctly
ALTER TABLE intake_responses
ADD CONSTRAINT intake_responses_user_id_key UNIQUE (user_id);

-- Note: This assumes each user should only have ONE intake response
-- If you need to track multiple intake responses per user (history), 
-- you would need to modify the upsert logic instead
-- Migration: Create Feedback Table
-- Date: 2026-02-02
-- Description: Add user feedback collection system

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  
  -- Feedback Type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('initial', 'general', 'micro', 'bug', 'feature')),
  
  -- Ratings
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  task_helpful BOOLEAN,
  
  -- Text Feedback
  what_you_like TEXT,
  what_to_improve TEXT,
  general_comment TEXT,
  
  -- Context
  task_id TEXT,
  day_number INTEGER CHECK (day_number >= 1 AND day_number <= 30),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  
  -- Admin
  reviewed BOOLEAN DEFAULT FALSE,
  admin_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_plan_id ON feedback(plan_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed ON feedback(reviewed);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- RLS Policies

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all feedback (using environment variable)
-- Note: You need to set app.admin_emails in your Supabase dashboard
-- Settings > Database > Custom Config
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      -- This will be checked against VITE_ADMIN_EMAILS on the client side
    )
  );

-- Admins can update feedback (mark as reviewed, add notes)
CREATE POLICY "Admins can update feedback"
  ON feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE feedback IS 'User feedback on plans and tasks';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback: initial (after plan creation), general, micro (task-specific), bug, feature';
COMMENT ON COLUMN feedback.overall_rating IS 'Overall satisfaction rating from 1-5 stars';
COMMENT ON COLUMN feedback.task_helpful IS 'Whether a specific task was helpful (for micro-feedback)';
COMMENT ON COLUMN feedback.reviewed IS 'Whether admin has reviewed this feedback';
-- Migration: Add Plan Overview and Adjustments
-- Date: 2026-02-02
-- Description: Add columns to support plan review and refinement feature

-- Add plan overview metadata
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_overview JSONB;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_iterations INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS user_adjustments JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_plans_plan_iterations ON plans(plan_iterations);

-- Add comments
COMMENT ON COLUMN plans.plan_overview IS 'Metadata about the plan including focus breakdown, phases, time commitment, etc.';
COMMENT ON COLUMN plans.plan_iterations IS 'Number of times the plan was regenerated before user confirmation';
COMMENT ON COLUMN plans.user_adjustments IS 'User adjustments made during plan review (intensity, time budget, exclusions, etc.)';

-- Example plan_overview structure:
-- {
--   "title": "Your Personalized Longevity Blueprint",
--   "tagline": "Focus on Sleep Optimization & Stress Management",
--   "projected_impact": "+3.2 years",
--   "daily_commitment_avg": 35,
--   "daily_commitment_range": [20, 50],
--   "difficulty": "moderate",
--   "phases": [
--     {
--       "name": "Foundation",
--       "days": "1-10",
--       "focus": "Building habits, gentle introduction",
--       "intensity": "low-medium"
--     },
--     {
--       "name": "Growth",
--       "days": "11-20",
--       "focus": "Increasing complexity, adding variety",
--       "intensity": "medium-high"
--     },
--     {
--       "name": "Mastery",
--       "days": "21-30",
--       "focus": "Optimization, advanced techniques",
--       "intensity": "medium-high"
--     }
--   ],
--   "focus_breakdown": {
--     "movement": 25,
--     "nutrition": 20,
--     "sleep": 30,
--     "stress": 15,
--     "cognitive": 5,
--     "social": 5
--   },
--   "sample_activities": [
--     {
--       "day": 3,
--       "activities": ["10-min morning walk", "5-min box breathing", "Sleep journal"]
--     },
--     {
--       "day": 15,
--       "activities": ["20-min HIIT workout", "Prepare overnight oats", "15-min meditation"]
--     },
--     {
--       "day": 28,
--       "activities": ["30-min nature walk", "Advanced breathwork", "Gratitude practice"]
--     }
--   ]
-- }

-- Example user_adjustments structure:
-- {
--   "intensity": "moderate",
--   "time_budget": 30,
--   "focus_percentages": {
--     "movement": 25,
--     "nutrition": 20,
--     "sleep": 30,
--     "stress": 15,
--     "cognitive": 5,
--     "social": 5
--   },
--   "exclusions": ["cold_exposure", "fasting"],
--   "preferences": {
--     "exercise_types": ["yoga", "walking"],
--     "timing_preference": "morning"
--   }
-- }
-- =====================================================
-- Migration 005: Separate User Profile and Health Profile
-- =====================================================
-- 
-- SIMPLIFIED VERSION - Run in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE USER_PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Identity (stable, rarely changes)
    name TEXT,
    email TEXT,
    phone_number TEXT,
    
    -- Demographics (constant)
    biological_sex TEXT CHECK (biological_sex IN ('male', 'female', 'diverse')),
    birth_date DATE,
    
    -- Preferences (not plan-relevant)
    whatsapp_opt_in BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "whatsapp": false}'::jsonb,
    preferred_language TEXT DEFAULT 'de',
    timezone TEXT DEFAULT 'Europe/Vienna',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- =====================================================
-- 2. CREATE HEALTH_PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- CORE DATA
    height_cm INTEGER CHECK (height_cm BETWEEN 100 AND 250),
    weight_kg DECIMAL(5,2) CHECK (weight_kg BETWEEN 30 AND 300),
    sleep_hours_bucket TEXT,
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    training_frequency TEXT,
    diet_patterns TEXT[] DEFAULT '{}',
    daily_time_budget INTEGER DEFAULT 20,
    equipment_access TEXT DEFAULT 'none',
    
    -- EXTENDED DATA
    is_smoker BOOLEAN DEFAULT false,
    smoking_frequency TEXT,
    alcohol_frequency TEXT,
    chronic_conditions TEXT[] DEFAULT '{}',
    takes_medications BOOLEAN DEFAULT false,
    medication_notes TEXT,
    injuries_limitations TEXT[] DEFAULT '{}',
    dietary_restrictions TEXT[] DEFAULT '{}',
    menopause_status TEXT,
    sleep_disorders TEXT[] DEFAULT '{}',
    mental_health_flags TEXT[] DEFAULT '{}',
    
    -- Completeness
    core_completed BOOLEAN DEFAULT false,
    extended_completed BOOLEAN DEFAULT false,
    extended_completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON health_profiles(user_id);

-- =====================================================
-- 3. CREATE PLAN_SNAPSHOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    health_profile_snapshot JSONB NOT NULL,
    primary_goal TEXT,
    secondary_goals TEXT[] DEFAULT '{}',
    excluded_activities TEXT[] DEFAULT '{}',
    intensity_cap TEXT,
    generator_version TEXT DEFAULT 'ev-blueprint-js-2.1',
    generation_notes TEXT,
    
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_snapshots_plan_id ON plan_snapshots(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_snapshots_user_id ON plan_snapshots(user_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_snapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. USER PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. HEALTH PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "health_profiles_select" ON health_profiles;
CREATE POLICY "health_profiles_select" ON health_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_profiles_insert" ON health_profiles;
CREATE POLICY "health_profiles_insert" ON health_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_profiles_update" ON health_profiles;
CREATE POLICY "health_profiles_update" ON health_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 7. PLAN SNAPSHOTS POLICIES (simplified with user_id column)
-- =====================================================

DROP POLICY IF EXISTS "plan_snapshots_select" ON plan_snapshots;
CREATE POLICY "plan_snapshots_select" ON plan_snapshots
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "plan_snapshots_insert" ON plan_snapshots;
CREATE POLICY "plan_snapshots_insert" ON plan_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Done!
-- =====================================================
-- =====================================================
-- Migration 006: Add Auto-Create User Profile Trigger
-- =====================================================
-- 
-- This migration adds a trigger to automatically create
-- a user_profiles entry when a new user signs up.
-- =====================================================

-- =====================================================
-- 1. CREATE TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user_profiles entry for new user
    INSERT INTO public.user_profiles (user_id, email, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER ON auth.users
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- Done!
-- =====================================================
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
-- Migration 009: Add Notification Preferences
-- Adds JSONB column to user_profiles to store messaging settings

-- 1. Add column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email": {
    "enabled": true, 
    "types": ["weekly_report", "system"]
  },
  "telegram": {
    "enabled": false, 
    "chat_id": null, 
    "username": null
  },
  "sms": {
    "enabled": false, 
    "phone": null, 
    "types": ["daily_briefing"]
  }
}';

-- 2. Add Telegram verification status (optional but good for UI)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS telegram_connected BOOLEAN DEFAULT FALSE;

-- 3. Comment on column
COMMENT ON COLUMN user_profiles.notification_preferences IS 'Stores settings for Email, Telegram, and SMS channels';
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
-- =====================================================
-- Migration 012: Modular Tracking System
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Enable continuous daily tracking with pluggable modules
-- Ref: docs/TECHNICAL_CONCEPT_MODULAR_TRACKING.md
-- =====================================================

-- =====================================================
-- 1. MODULE DEFINITIONS (System-wide, admin-managed)
-- =====================================================

CREATE TABLE IF NOT EXISTS module_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    slug TEXT UNIQUE NOT NULL,
    name_de TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_de TEXT,
    description_en TEXT,
    icon TEXT DEFAULT '📋',

    -- Module Type
    type TEXT NOT NULL,
    duration_days INTEGER,

    -- Configuration Schema
    config_schema JSONB DEFAULT '{}',

    -- Task Template
    task_template JSONB NOT NULL DEFAULT '{}',

    -- Context Integration
    affected_by_modes TEXT[] DEFAULT '{}',
    priority_weight INTEGER DEFAULT 50,

    -- Categorization
    category TEXT DEFAULT 'general',
    pillars TEXT[] DEFAULT '{}',

    -- Premium/Pricing
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_module_type CHECK (type IN ('recurring', 'one-time', 'continuous')),
    CONSTRAINT valid_category CHECK (category IN ('general', 'nutrition', 'exercise', 'sleep', 'supplements', 'mindset', 'health'))
);

COMMENT ON TABLE module_definitions IS 'System-wide module definitions that users can activate';
COMMENT ON COLUMN module_definitions.type IS 'recurring=repeats, one-time=single run, continuous=no end date';
COMMENT ON COLUMN module_definitions.affected_by_modes IS 'Module pauses when user is in these modes';

-- =====================================================
-- 2. MODULE INSTANCES (User-activated modules)
-- =====================================================

CREATE TABLE IF NOT EXISTS module_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES module_definitions(id) ON DELETE CASCADE NOT NULL,

    -- Instance State
    status TEXT DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- User Configuration
    config JSONB DEFAULT '{}',

    -- Progress
    current_day INTEGER DEFAULT 1,
    total_days INTEGER,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Context Override
    auto_pause_in_modes TEXT[] DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_instance_status CHECK (status IN ('active', 'paused', 'completed', 'cancelled'))
);

COMMENT ON TABLE module_instances IS 'User-specific instances of activated modules';

-- =====================================================
-- 3. DAILY TRACKING (Central tracking table)
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Date
    tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Context Snapshot
    active_mode TEXT DEFAULT 'normal',
    readiness_score INTEGER,

    -- Aggregated Tasks
    tasks JSONB NOT NULL DEFAULT '[]',

    -- Completion Summary
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- AX-1 Monitoring
    time_spent_seconds INTEGER DEFAULT 0,

    -- User Notes
    notes TEXT,

    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_mode CHECK (active_mode IN ('normal', 'travel', 'sick', 'detox', 'deep_work')),
    CONSTRAINT valid_readiness CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100)),
    UNIQUE(user_id, tracking_date)
);

COMMENT ON TABLE daily_tracking IS 'Daily aggregated view of all tasks from active modules';

-- =====================================================
-- 4. TASK COMPLETIONS (Granular tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    daily_tracking_id UUID REFERENCES daily_tracking(id) ON DELETE CASCADE,
    module_instance_id UUID REFERENCES module_instances(id) ON DELETE SET NULL,

    -- Task Identification
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL DEFAULT 'action',

    -- Task Content
    title_de TEXT NOT NULL,
    title_en TEXT,
    description TEXT,
    pillar TEXT,
    duration_minutes INTEGER DEFAULT 5,
    scheduled_time TIME,

    -- Completion
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    skipped_reason TEXT,

    -- Source
    source_module TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_task_type CHECK (task_type IN ('action', 'reminder', 'check-in', 'info')),
    CONSTRAINT valid_task_status CHECK (status IN ('pending', 'completed', 'skipped', 'snoozed'))
);

COMMENT ON TABLE task_completions IS 'Individual task completion records';

-- =====================================================
-- 5. LAB RESULTS (For blood check module)
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Lab Info
    lab_date DATE NOT NULL,
    lab_provider TEXT,

    -- Raw Data
    raw_file_url TEXT,
    parsed_data JSONB,

    -- Key Biomarkers
    biomarkers JSONB NOT NULL DEFAULT '{}',

    -- Analysis
    deficiencies JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',

    -- Verification
    verification_status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_verification CHECK (verification_status IN ('pending', 'verified', 'flagged'))
);

COMMENT ON TABLE lab_results IS 'User lab results for blood check module';

-- =====================================================
-- 6. USER MODE STATE (Emergency Modes)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_mode_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Current Mode
    current_mode TEXT DEFAULT 'normal',
    mode_activated_at TIMESTAMPTZ,
    mode_expires_at TIMESTAMPTZ,

    -- Mode History (last 10)
    mode_history JSONB DEFAULT '[]',

    -- Auto-detection Settings
    auto_detect_travel BOOLEAN DEFAULT true,
    auto_detect_sick BOOLEAN DEFAULT true,

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_user_mode CHECK (current_mode IN ('normal', 'travel', 'sick', 'detox', 'deep_work'))
);

COMMENT ON TABLE user_mode_state IS 'Current emergency mode state for each user';

-- =====================================================
-- 7. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_module_definitions_slug ON module_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_module_definitions_active ON module_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_module_definitions_category ON module_definitions(category);

CREATE INDEX IF NOT EXISTS idx_module_instances_user ON module_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_module_instances_status ON module_instances(status);
CREATE INDEX IF NOT EXISTS idx_module_instances_module ON module_instances(module_id);
CREATE INDEX IF NOT EXISTS idx_module_instances_user_status ON module_instances(user_id, status);

CREATE INDEX IF NOT EXISTS idx_daily_tracking_user_date ON daily_tracking(user_id, tracking_date);
CREATE INDEX IF NOT EXISTS idx_daily_tracking_date ON daily_tracking(tracking_date);

CREATE INDEX IF NOT EXISTS idx_task_completions_daily ON task_completions(daily_tracking_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_status ON task_completions(status);
CREATE INDEX IF NOT EXISTS idx_task_completions_module ON task_completions(module_instance_id);

CREATE INDEX IF NOT EXISTS idx_lab_results_user ON lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_date ON lab_results(lab_date);

CREATE INDEX IF NOT EXISTS idx_user_mode_state_user ON user_mode_state(user_id);

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE module_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mode_state ENABLE ROW LEVEL SECURITY;

-- Module Definitions: Everyone can read active modules
DROP POLICY IF EXISTS "Anyone can view active modules" ON module_definitions;
CREATE POLICY "Anyone can view active modules"
    ON module_definitions FOR SELECT
    USING (is_active = true);

-- Module Instances: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own instances" ON module_instances;
CREATE POLICY "Users can view own instances"
    ON module_instances FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own instances" ON module_instances;
CREATE POLICY "Users can insert own instances"
    ON module_instances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own instances" ON module_instances;
CREATE POLICY "Users can update own instances"
    ON module_instances FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own instances" ON module_instances;
CREATE POLICY "Users can delete own instances"
    ON module_instances FOR DELETE
    USING (auth.uid() = user_id);

-- Daily Tracking: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own tracking" ON daily_tracking;
CREATE POLICY "Users can view own tracking"
    ON daily_tracking FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tracking" ON daily_tracking;
CREATE POLICY "Users can insert own tracking"
    ON daily_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tracking" ON daily_tracking;
CREATE POLICY "Users can update own tracking"
    ON daily_tracking FOR UPDATE
    USING (auth.uid() = user_id);

-- Task Completions: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own completions" ON task_completions;
CREATE POLICY "Users can view own completions"
    ON task_completions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own completions" ON task_completions;
CREATE POLICY "Users can insert own completions"
    ON task_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own completions" ON task_completions;
CREATE POLICY "Users can update own completions"
    ON task_completions FOR UPDATE
    USING (auth.uid() = user_id);

-- Lab Results: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own labs" ON lab_results;
CREATE POLICY "Users can view own labs"
    ON lab_results FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own labs" ON lab_results;
CREATE POLICY "Users can insert own labs"
    ON lab_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own labs" ON lab_results;
CREATE POLICY "Users can update own labs"
    ON lab_results FOR UPDATE
    USING (auth.uid() = user_id);

-- User Mode State: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own mode" ON user_mode_state;
CREATE POLICY "Users can view own mode"
    ON user_mode_state FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mode" ON user_mode_state;
CREATE POLICY "Users can insert own mode"
    ON user_mode_state FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mode" ON user_mode_state;
CREATE POLICY "Users can update own mode"
    ON user_mode_state FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Update timestamp trigger for module_instances
DROP TRIGGER IF EXISTS update_module_instances_updated_at ON module_instances;
CREATE TRIGGER update_module_instances_updated_at
    BEFORE UPDATE ON module_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for daily_tracking
DROP TRIGGER IF EXISTS update_daily_tracking_updated_at ON daily_tracking;
CREATE TRIGGER update_daily_tracking_updated_at
    BEFORE UPDATE ON daily_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for user_mode_state
DROP TRIGGER IF EXISTS update_user_mode_state_updated_at ON user_mode_state;
CREATE TRIGGER update_user_mode_state_updated_at
    BEFORE UPDATE ON user_mode_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. SEED DATA: DEFAULT MODULES
-- =====================================================

-- Fasting Module (16:8)
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'fasting-16-8',
    'Intervallfasten 16:8',
    'Intermittent Fasting 16:8',
    '16 Stunden fasten, 8 Stunden Essensfenster. Ideal für Einsteiger.',
    '16 hours fasting, 8 hours eating window. Ideal for beginners.',
    '🍽️',
    'continuous',
    NULL,
    'nutrition',
    ARRAY['nutrition', 'metabolic'],
    70,
    ARRAY['sick', 'travel'],
    '{
        "eating_window_start": {"type": "time", "default": "12:00", "label_de": "Essensfenster Start"},
        "eating_window_end": {"type": "time", "default": "20:00", "label_de": "Essensfenster Ende"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "fasting-reminder-morning",
                "type": "info",
                "time": "07:00",
                "title_de": "Fastenphase läuft",
                "title_en": "Fasting phase active",
                "description": "Nur Wasser, schwarzer Kaffee oder Tee",
                "pillar": "nutrition",
                "duration_minutes": 0
            },
            {
                "id": "eating-window-start",
                "type": "reminder",
                "time": "{{config.eating_window_start}}",
                "title_de": "Essensfenster öffnet",
                "title_en": "Eating window opens",
                "pillar": "nutrition",
                "duration_minutes": 0
            },
            {
                "id": "eating-window-end",
                "type": "action",
                "time": "{{config.eating_window_end}}",
                "title_de": "Letzte Mahlzeit — Essensfenster schließt",
                "title_en": "Last meal — eating window closes",
                "pillar": "nutrition",
                "duration_minutes": 0
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Circadian Light Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'circadian-light',
    'Lichtprotokoll',
    'Circadian Light Protocol',
    'Optimiere deinen Schlaf-Wach-Rhythmus durch gezieltes Morgenlicht.',
    'Optimize your sleep-wake cycle through targeted morning light exposure.',
    '☀️',
    'continuous',
    NULL,
    'sleep',
    ARRAY['sleep', 'energy'],
    80,
    ARRAY['sick'],
    '{
        "wake_time": {"type": "time", "default": "07:00", "label_de": "Aufwachzeit"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-light",
                "type": "action",
                "time": "{{config.wake_time}}+30min",
                "title_de": "Morgenlicht holen (10 min)",
                "title_en": "Get morning light (10 min)",
                "description": "Geh nach draußen oder ans Fenster. Keine Sonnenbrille.",
                "pillar": "sleep",
                "duration_minutes": 10
            },
            {
                "id": "blue-light-cutoff",
                "type": "reminder",
                "time": "21:00",
                "title_de": "Blaulicht reduzieren",
                "title_en": "Reduce blue light",
                "description": "Night Shift aktivieren, Bildschirmzeit reduzieren",
                "pillar": "sleep",
                "duration_minutes": 0
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Supplement Timing Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'supplement-timing',
    'Supplement-Timing',
    'Supplement Timing',
    'Optimale Einnahmezeiten für deine Supplements.',
    'Optimal timing for your supplements.',
    '💊',
    'continuous',
    NULL,
    'supplements',
    ARRAY['supplements', 'nutrition'],
    60,
    ARRAY[]::text[],
    '{
        "supplements": {
            "type": "array",
            "items": ["vitamin_d", "omega3", "magnesium", "zinc", "b_complex"],
            "default": ["vitamin_d", "magnesium"],
            "label_de": "Deine Supplements"
        },
        "wake_time": {"type": "time", "default": "07:00", "label_de": "Aufwachzeit"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-supplements",
                "type": "action",
                "time": "{{config.wake_time}}+30min",
                "title_de": "Morgen-Supplements",
                "title_en": "Morning supplements",
                "description": "Vitamin D + K2 mit Fett, vor Kaffee",
                "pillar": "supplements",
                "duration_minutes": 2,
                "condition": "config.supplements.includes(''vitamin_d'')"
            },
            {
                "id": "evening-magnesium",
                "type": "action",
                "time": "21:00",
                "title_de": "Magnesium (Abend)",
                "title_en": "Magnesium (evening)",
                "description": "Magnesium Glycinat oder Threonat",
                "pillar": "supplements",
                "duration_minutes": 1,
                "condition": "config.supplements.includes(''magnesium'')"
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Yearly Plan Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'yearly-optimization',
    'Jahres-Optimierung',
    'Yearly Optimization',
    'Quartalsziele und regelmäßige Reviews für langfristigen Erfolg.',
    'Quarterly goals and regular reviews for long-term success.',
    '📆',
    'continuous',
    365,
    'mindset',
    ARRAY['mindset', 'health'],
    30,
    ARRAY[]::text[],
    '{
        "focus_areas": {
            "type": "array",
            "items": ["longevity", "performance", "recovery", "metabolic", "mental"],
            "default": ["longevity"],
            "label_de": "Fokus-Bereiche"
        },
        "review_day": {"type": "weekday", "default": "sunday", "label_de": "Wöchentlicher Review-Tag"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "weekly-review",
                "type": "check-in",
                "frequency": "weekly",
                "day": "{{config.review_day}}",
                "time": "19:00",
                "title_de": "Wochen-Review",
                "title_en": "Weekly review",
                "description": "5 min Reflexion: Was lief gut? Was verbessern?",
                "pillar": "mindset",
                "duration_minutes": 5
            },
            {
                "id": "monthly-check",
                "type": "reminder",
                "frequency": "monthly",
                "day": 1,
                "time": "10:00",
                "title_de": "Monatlicher Health-Check",
                "title_en": "Monthly health check",
                "description": "Gewicht, Energie-Level, Schlafqualität notieren",
                "pillar": "health",
                "duration_minutes": 3
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Blood Check Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, is_premium, config_schema, task_template)
VALUES (
    'blood-check',
    'Blutbild-Optimierung',
    'Blood Panel Optimization',
    '90-Tage Zyklus zur Optimierung deiner Blutwerte.',
    '90-day cycle to optimize your blood markers.',
    '🩸',
    'recurring',
    90,
    'health',
    ARRAY['health', 'supplements'],
    50,
    ARRAY[]::text[],
    true,
    '{
        "target_markers": {
            "type": "array",
            "items": ["vitamin_d", "b12", "ferritin", "tsh", "hba1c", "homocysteine", "crp"],
            "default": ["vitamin_d", "b12", "ferritin"],
            "label_de": "Ziel-Marker"
        },
        "last_lab_date": {"type": "date", "label_de": "Letztes Blutbild"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "daily-supplement-reminder",
                "type": "action",
                "time": "08:00",
                "title_de": "Supplements basierend auf Blutwerten",
                "title_en": "Supplements based on blood values",
                "description": "Individuell angepasst an deine Defizite",
                "pillar": "supplements",
                "duration_minutes": 2,
                "condition": "lab_results.deficiencies.length > 0"
            },
            {
                "id": "retest-reminder",
                "type": "reminder",
                "frequency": "once",
                "day": 85,
                "time": "10:00",
                "title_de": "Neues Blutbild fällig",
                "title_en": "New blood panel due",
                "description": "Zeit für Kontroll-Blutbild. Termin buchen!",
                "pillar": "health",
                "duration_minutes": 5
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- =====================================================
-- 11. VERIFICATION
-- =====================================================

SELECT 'Tables created:' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('module_definitions', 'module_instances', 'daily_tracking', 'task_completions', 'lab_results', 'user_mode_state');

SELECT 'Default modules:' AS status;
SELECT slug, name_de, type FROM module_definitions ORDER BY priority_weight DESC;

-- =====================================================
-- NOTES
-- =====================================================
--
-- To add new modules:
-- INSERT INTO module_definitions (slug, name_de, ...) VALUES (...);
--
-- To activate a module for a user:
-- INSERT INTO module_instances (user_id, module_id, config) VALUES (...);
--
-- =====================================================
-- =====================================================
-- Migration 013: Phase 2 Modules
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Add Phase 2 modules and 30-Day Plan integration
-- =====================================================

-- =====================================================
-- 1. ADD SOURCE PLAN REFERENCE TO MODULE INSTANCES
-- =====================================================

-- Allow linking module instances to source plans (for 30-day plan modules)
ALTER TABLE module_instances
ADD COLUMN IF NOT EXISTS source_plan_id UUID,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

COMMENT ON COLUMN module_instances.source_plan_id IS 'Reference to plans table for converted 30-day plans';
COMMENT ON COLUMN module_instances.source_type IS 'manual=user activated, converted=from 30-day plan, auto=system activated';

-- =====================================================
-- 2. 30-DAY LONGEVITY PLAN MODULE
-- =====================================================

INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    '30-day-longevity',
    '30-Tage Longevity Plan',
    '30-Day Longevity Plan',
    'Dein personalisierter 30-Tage Plan basierend auf deinem Health Profile.',
    'Your personalized 30-day plan based on your health profile.',
    '🎯',
    'one-time',
    30,
    'general',
    ARRAY['sleep', 'nutrition', 'movement', 'stress', 'supplements'],
    100, -- Highest priority
    ARRAY['sick'],
    '{
        "plan_id": {"type": "string", "hidden": true},
        "start_date": {"type": "date", "label_de": "Startdatum"},
        "focus_pillars": {
            "type": "array",
            "items": ["sleep", "nutrition", "movement", "stress", "mental"],
            "label_de": "Fokus-Säulen"
        }
    }'::jsonb,
    '{
        "dynamic": true,
        "source": "plan_days",
        "tasks": []
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    priority_weight = EXCLUDED.priority_weight,
    updated_at = NOW();

-- =====================================================
-- 3. ENHANCED FASTING MODULES
-- =====================================================

-- 5:2 Fasting Module
INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'fasting-5-2',
    'Intervallfasten 5:2',
    'Intermittent Fasting 5:2',
    '5 Tage normal essen, 2 Tage stark reduziert (500-600 kcal).',
    '5 days normal eating, 2 days restricted (500-600 kcal).',
    '🍽️',
    'continuous',
    NULL,
    'nutrition',
    ARRAY['nutrition', 'metabolic'],
    65,
    ARRAY['sick', 'travel'],
    '{
        "properties": {
            "fasting_days": {
                "type": "array",
                "title": "Fastentage",
                "items": {"type": "string", "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]},
                "default": ["monday", "thursday"],
                "minItems": 2,
                "maxItems": 2
            },
            "calorie_limit": {
                "type": "integer",
                "title": "Kalorien an Fastentagen",
                "default": 500,
                "minimum": 400,
                "maximum": 800
            }
        },
        "required": ["fasting_days"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "fasting-day-start",
                "type": "info",
                "frequency": "weekly",
                "days": "{{config.fasting_days}}",
                "time": "07:00",
                "title_de": "🍽️ Heute ist Fastentag",
                "title_en": "🍽️ Today is a fasting day",
                "description": "Max {{config.calorie_limit}} kcal. Fokus auf Protein & Gemüse.",
                "pillar": "nutrition",
                "duration_minutes": 0
            },
            {
                "id": "fasting-day-meal",
                "type": "action",
                "frequency": "weekly",
                "days": "{{config.fasting_days}}",
                "time": "18:00",
                "title_de": "Fastentag-Mahlzeit planen",
                "title_en": "Plan fasting day meal",
                "description": "Eine proteinreiche, sättigende Mahlzeit",
                "pillar": "nutrition",
                "duration_minutes": 5
            },
            {
                "id": "hydration-reminder",
                "type": "reminder",
                "frequency": "weekly",
                "days": "{{config.fasting_days}}",
                "time": "12:00",
                "title_de": "💧 Extra Hydration an Fastentagen",
                "title_en": "💧 Extra hydration on fasting days",
                "description": "Mindestens 2.5L Wasser, Tee oder schwarzer Kaffee",
                "pillar": "nutrition",
                "duration_minutes": 1
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- OMAD (One Meal A Day) Module
INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'fasting-omad',
    'OMAD - Eine Mahlzeit',
    'OMAD - One Meal A Day',
    'Fortgeschrittenes Fasten: Eine nährstoffreiche Mahlzeit pro Tag.',
    'Advanced fasting: One nutrient-dense meal per day.',
    '🥗',
    'continuous',
    NULL,
    'nutrition',
    ARRAY['nutrition', 'metabolic', 'autophagy'],
    55,
    ARRAY['sick', 'travel', 'deep_work'],
    '{
        "properties": {
            "meal_time": {
                "type": "string",
                "format": "time",
                "title": "Mahlzeit-Zeit",
                "default": "18:00"
            },
            "eating_window_minutes": {
                "type": "integer",
                "title": "Essensfenster (Minuten)",
                "default": 60,
                "minimum": 30,
                "maximum": 120
            }
        },
        "required": ["meal_time"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-electrolytes",
                "type": "action",
                "time": "07:00",
                "title_de": "Elektrolyte (Salz + Wasser)",
                "title_en": "Electrolytes (salt + water)",
                "description": "1/4 TL Salz in Wasser für Energie",
                "pillar": "nutrition",
                "duration_minutes": 1
            },
            {
                "id": "omad-meal-prep",
                "type": "reminder",
                "time": "{{config.meal_time}}-60min",
                "title_de": "OMAD-Mahlzeit vorbereiten",
                "title_en": "Prepare OMAD meal",
                "description": "Protein, gesunde Fette, viel Gemüse",
                "pillar": "nutrition",
                "duration_minutes": 30
            },
            {
                "id": "omad-meal",
                "type": "action",
                "time": "{{config.meal_time}}",
                "title_de": "🍽️ OMAD-Mahlzeit",
                "title_en": "🍽️ OMAD meal",
                "description": "Langsam essen, gut kauen, genießen",
                "pillar": "nutrition",
                "duration_minutes": 45
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- Extended Water Fast Module (24-72h)
INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, is_premium, config_schema, task_template
) VALUES (
    'fasting-extended',
    'Extended Fast (24-72h)',
    'Extended Fast (24-72h)',
    'Tiefgreifende Autophagie durch längeres Fasten. Nur mit ärztlicher Beratung.',
    'Deep autophagy through extended fasting. Only with medical consultation.',
    '⚡',
    'one-time',
    3,
    'nutrition',
    ARRAY['nutrition', 'metabolic', 'autophagy', 'longevity'],
    40,
    ARRAY['sick', 'travel', 'deep_work'],
    true,
    '{
        "properties": {
            "duration_hours": {
                "type": "integer",
                "title": "Fasten-Dauer (Stunden)",
                "enum": [24, 36, 48, 72],
                "enumLabels": {"24": "24h", "36": "36h", "48": "48h", "72": "72h"},
                "default": 24
            },
            "start_time": {
                "type": "string",
                "format": "time",
                "title": "Startzeit",
                "default": "20:00"
            },
            "has_medical_clearance": {
                "type": "boolean",
                "title": "Ärztliche Freigabe",
                "description": "Ich habe mit einem Arzt gesprochen",
                "default": false
            }
        },
        "required": ["duration_hours", "has_medical_clearance"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "fast-start",
                "type": "action",
                "frequency": "once",
                "day": 1,
                "time": "{{config.start_time}}",
                "title_de": "🚀 Fast beginnt jetzt",
                "title_en": "🚀 Fast starts now",
                "description": "Letzte leichte Mahlzeit. Viel Wasser bereitstellen.",
                "pillar": "nutrition",
                "duration_minutes": 5
            },
            {
                "id": "electrolyte-morning",
                "type": "action",
                "time": "08:00",
                "title_de": "Elektrolyte Morgen",
                "title_en": "Morning electrolytes",
                "description": "Salz, Kalium, Magnesium in Wasser",
                "pillar": "nutrition",
                "duration_minutes": 2
            },
            {
                "id": "electrolyte-evening",
                "type": "action",
                "time": "18:00",
                "title_de": "Elektrolyte Abend",
                "title_en": "Evening electrolytes",
                "description": "Besonders wichtig ab 24h+",
                "pillar": "nutrition",
                "duration_minutes": 2
            },
            {
                "id": "gentle-movement",
                "type": "action",
                "time": "10:00",
                "title_de": "Leichte Bewegung (Spaziergang)",
                "title_en": "Light movement (walk)",
                "description": "Kein intensives Training während Extended Fast",
                "pillar": "movement",
                "duration_minutes": 20
            },
            {
                "id": "fast-end",
                "type": "action",
                "frequency": "once",
                "day": "{{config.duration_hours / 24}}",
                "time": "{{config.start_time}}",
                "title_de": "🎉 Fast beenden - Refeeding",
                "title_en": "🎉 Break fast - Refeeding",
                "description": "Langsam mit Brühe oder leichtem Essen beginnen",
                "pillar": "nutrition",
                "duration_minutes": 30
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- =====================================================
-- 4. ENHANCED CIRCADIAN MODULE
-- =====================================================

-- Update existing circadian-light module with more tasks
UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-light",
            "type": "action",
            "time": "{{config.wake_time}}+15min",
            "title_de": "☀️ Morgenlicht holen (10 min)",
            "title_en": "☀️ Get morning light (10 min)",
            "description": "Direkt nach dem Aufwachen nach draußen. Keine Sonnenbrille.",
            "pillar": "sleep",
            "duration_minutes": 10
        },
        {
            "id": "caffeine-cutoff",
            "type": "reminder",
            "time": "14:00",
            "title_de": "☕ Koffein-Stopp",
            "title_en": "☕ Caffeine cutoff",
            "description": "Letzter Kaffee des Tages für optimalen Schlaf",
            "pillar": "sleep",
            "duration_minutes": 0
        },
        {
            "id": "sunset-light",
            "type": "action",
            "time": "{{config.target_bedtime}}-180min",
            "title_de": "🌅 Abendsonne genießen",
            "title_en": "🌅 Enjoy sunset light",
            "description": "Rotes/oranges Licht signalisiert dem Körper: bald Schlafenszeit",
            "pillar": "sleep",
            "duration_minutes": 10
        },
        {
            "id": "blue-light-cutoff",
            "type": "action",
            "time": "{{config.target_bedtime}}-120min",
            "title_de": "📱 Blaulicht reduzieren",
            "title_en": "📱 Reduce blue light",
            "description": "Night Shift/Dark Mode aktivieren, Blaulichtbrille aufsetzen",
            "pillar": "sleep",
            "duration_minutes": 1
        },
        {
            "id": "dim-lights",
            "type": "action",
            "time": "{{config.target_bedtime}}-60min",
            "title_de": "💡 Lichter dimmen",
            "title_en": "💡 Dim lights",
            "description": "Nur warmes, gedimmtes Licht. Kein Deckenlicht.",
            "pillar": "sleep",
            "duration_minutes": 1
        },
        {
            "id": "bedroom-prep",
            "type": "action",
            "time": "{{config.target_bedtime}}-30min",
            "title_de": "🛏️ Schlafzimmer vorbereiten",
            "title_en": "🛏️ Prepare bedroom",
            "description": "Kühl (18°C), dunkel, ruhig",
            "pillar": "sleep",
            "duration_minutes": 5
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "wake_time": {
            "type": "string",
            "format": "time",
            "title": "Aufwachzeit",
            "default": "07:00"
        },
        "target_bedtime": {
            "type": "string",
            "format": "time",
            "title": "Ziel-Schlafenszeit",
            "default": "22:30"
        }
    },
    "required": ["wake_time", "target_bedtime"]
}'::jsonb,
updated_at = NOW()
WHERE slug = 'circadian-light';

-- =====================================================
-- 5. ENHANCED SUPPLEMENT TIMING MODULE
-- =====================================================

UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-supplements-fat",
            "type": "action",
            "time": "{{config.wake_time}}+30min",
            "title_de": "💊 Morgen-Supplements (mit Fett)",
            "title_en": "💊 Morning supplements (with fat)",
            "description": "Vitamin D3+K2, Omega-3 — mit Frühstück/Fett",
            "pillar": "supplements",
            "duration_minutes": 2,
            "condition": "config.supplements.includes(''vitamin_d'') || config.supplements.includes(''omega3'')"
        },
        {
            "id": "morning-supplements-empty",
            "type": "action",
            "time": "{{config.wake_time}}",
            "title_de": "💊 Supplements (nüchtern)",
            "title_en": "💊 Supplements (empty stomach)",
            "description": "B-Komplex, Probiotika — vor dem Essen",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''b_complex'') || config.supplements.includes(''probiotics'')"
        },
        {
            "id": "midday-supplements",
            "type": "action",
            "time": "12:00",
            "title_de": "💊 Mittag-Supplements",
            "title_en": "💊 Midday supplements",
            "description": "Vitamin C, Eisen (falls supplementiert)",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''vitamin_c'') || config.supplements.includes(''iron'')"
        },
        {
            "id": "evening-magnesium",
            "type": "action",
            "time": "{{config.bedtime}}-60min",
            "title_de": "💊 Magnesium (Abend)",
            "title_en": "💊 Magnesium (evening)",
            "description": "Magnesium Glycinat oder Threonat für besseren Schlaf",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''magnesium'')"
        },
        {
            "id": "evening-zinc",
            "type": "action",
            "time": "{{config.bedtime}}-30min",
            "title_de": "💊 Zink (Abend)",
            "title_en": "💊 Zinc (evening)",
            "description": "Zink für Immunsystem und Schlaf",
            "pillar": "supplements",
            "duration_minutes": 1,
            "condition": "config.supplements.includes(''zinc'')"
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "supplements": {
            "type": "array",
            "title": "Deine Supplements",
            "items": {
                "type": "string",
                "enum": ["vitamin_d", "omega3", "magnesium", "zinc", "b_complex", "vitamin_c", "iron", "probiotics", "creatine", "collagen"]
            },
            "enumLabels": {
                "vitamin_d": "Vitamin D3+K2",
                "omega3": "Omega-3",
                "magnesium": "Magnesium",
                "zinc": "Zink",
                "b_complex": "B-Komplex",
                "vitamin_c": "Vitamin C",
                "iron": "Eisen",
                "probiotics": "Probiotika",
                "creatine": "Kreatin",
                "collagen": "Kollagen"
            },
            "default": ["vitamin_d", "magnesium", "omega3"]
        },
        "wake_time": {
            "type": "string",
            "format": "time",
            "title": "Aufwachzeit",
            "default": "07:00"
        },
        "bedtime": {
            "type": "string",
            "format": "time",
            "title": "Schlafenszeit",
            "default": "22:30"
        }
    },
    "required": ["supplements", "wake_time", "bedtime"]
}'::jsonb,
updated_at = NOW()
WHERE slug = 'supplement-timing';

-- =====================================================
-- 6. ENHANCED YEARLY PLAN MODULE
-- =====================================================

UPDATE module_definitions
SET task_template = '{
    "tasks": [
        {
            "id": "morning-intention",
            "type": "action",
            "time": "{{config.wake_time}}+15min",
            "title_de": "🎯 Tages-Intention setzen",
            "title_en": "🎯 Set daily intention",
            "description": "1 Satz: Was ist heute am wichtigsten?",
            "pillar": "mindset",
            "duration_minutes": 2
        },
        {
            "id": "weekly-review",
            "type": "check-in",
            "frequency": "weekly",
            "day": "{{config.review_day}}",
            "time": "19:00",
            "title_de": "📊 Wochen-Review",
            "title_en": "📊 Weekly review",
            "description": "Was lief gut? Was verbessern? Nächste Woche planen.",
            "pillar": "mindset",
            "duration_minutes": 10
        },
        {
            "id": "monthly-metrics",
            "type": "check-in",
            "frequency": "monthly",
            "day": 1,
            "time": "10:00",
            "title_de": "📈 Monats-Metriken",
            "title_en": "📈 Monthly metrics",
            "description": "Gewicht, Energie (1-10), Schlafqualität, Stimmung notieren",
            "pillar": "health",
            "duration_minutes": 5
        },
        {
            "id": "quarterly-deep-review",
            "type": "check-in",
            "frequency": "quarterly",
            "time": "14:00",
            "title_de": "🔬 Quartals-Deep-Review",
            "title_en": "🔬 Quarterly deep review",
            "description": "Blutbild, Körperkomposition, Ziel-Anpassung",
            "pillar": "health",
            "duration_minutes": 30
        },
        {
            "id": "yearly-planning",
            "type": "check-in",
            "frequency": "yearly",
            "month": 1,
            "day": 1,
            "time": "10:00",
            "title_de": "🎆 Jahres-Planung",
            "title_en": "🎆 Yearly planning",
            "description": "Große Gesundheitsziele für das Jahr setzen",
            "pillar": "mindset",
            "duration_minutes": 60
        }
    ]
}'::jsonb,
config_schema = '{
    "properties": {
        "wake_time": {
            "type": "string",
            "format": "time",
            "title": "Aufwachzeit",
            "default": "07:00"
        },
        "review_day": {
            "type": "string",
            "title": "Wöchentlicher Review-Tag",
            "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            "enumLabels": {
                "monday": "Montag",
                "tuesday": "Dienstag",
                "wednesday": "Mittwoch",
                "thursday": "Donnerstag",
                "friday": "Freitag",
                "saturday": "Samstag",
                "sunday": "Sonntag"
            },
            "default": "sunday"
        },
        "focus_areas": {
            "type": "array",
            "title": "Fokus-Bereiche",
            "items": {
                "type": "string",
                "enum": ["longevity", "performance", "recovery", "metabolic", "mental", "strength", "flexibility"]
            },
            "enumLabels": {
                "longevity": "Longevity",
                "performance": "Performance",
                "recovery": "Recovery",
                "metabolic": "Metabolisch",
                "mental": "Mental",
                "strength": "Kraft",
                "flexibility": "Flexibilität"
            },
            "default": ["longevity", "recovery"]
        }
    },
    "required": ["review_day"]
}'::jsonb,
description_de = 'Tägliche Intentionen, wöchentliche Reviews, monatliche Metriken und Quartals-Checkups für langfristigen Erfolg.',
description_en = 'Daily intentions, weekly reviews, monthly metrics and quarterly checkups for long-term success.',
updated_at = NOW()
WHERE slug = 'yearly-optimization';

-- =====================================================
-- 7. NEW: COLD EXPOSURE MODULE
-- =====================================================

INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'cold-exposure',
    'Kälte-Protokoll',
    'Cold Exposure Protocol',
    'Schrittweise Gewöhnung an Kälte für Stoffwechsel und Resilienz.',
    'Gradual cold adaptation for metabolism and resilience.',
    '🧊',
    'continuous',
    NULL,
    'health',
    ARRAY['recovery', 'metabolic', 'mental'],
    45,
    ARRAY['sick'],
    '{
        "properties": {
            "intensity": {
                "type": "string",
                "title": "Intensität",
                "enum": ["beginner", "intermediate", "advanced"],
                "enumLabels": {
                    "beginner": "Anfänger (kalt duschen)",
                    "intermediate": "Fortgeschritten (Eisbad 1-2 min)",
                    "advanced": "Profi (Eisbad 3-5 min)"
                },
                "default": "beginner"
            },
            "preferred_time": {
                "type": "string",
                "title": "Bevorzugte Zeit",
                "enum": ["morning", "post_workout", "evening"],
                "enumLabels": {
                    "morning": "Morgens (Energie-Boost)",
                    "post_workout": "Nach dem Training",
                    "evening": "Abends (nicht <2h vor Schlaf)"
                },
                "default": "morning"
            }
        },
        "required": ["intensity"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "cold-exposure-session",
                "type": "action",
                "time": "07:30",
                "title_de": "🧊 Kälte-Session",
                "title_en": "🧊 Cold exposure session",
                "description": "Ende der Dusche: 30 Sek kalt (Anfänger), aufbauend",
                "pillar": "recovery",
                "duration_minutes": 5,
                "condition": "config.intensity === ''beginner''"
            },
            {
                "id": "cold-exposure-intermediate",
                "type": "action",
                "time": "07:30",
                "title_de": "🧊 Eisbad (1-2 min)",
                "title_en": "🧊 Ice bath (1-2 min)",
                "description": "10-15°C Wasser, kontrollierte Atmung",
                "pillar": "recovery",
                "duration_minutes": 10,
                "condition": "config.intensity === ''intermediate''"
            },
            {
                "id": "cold-exposure-advanced",
                "type": "action",
                "time": "07:30",
                "title_de": "🧊 Eisbad (3-5 min)",
                "title_en": "🧊 Ice bath (3-5 min)",
                "description": "5-10°C Wasser, Wim Hof Breathing vorher",
                "pillar": "recovery",
                "duration_minutes": 15,
                "condition": "config.intensity === ''advanced''"
            },
            {
                "id": "warmup-after",
                "type": "reminder",
                "time": "07:45",
                "title_de": "☀️ Natürlich aufwärmen",
                "title_en": "☀️ Warm up naturally",
                "description": "Keine heiße Dusche! Körper selbst aufwärmen lassen.",
                "pillar": "recovery",
                "duration_minutes": 0
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- =====================================================
-- 8. NEW: BREATHWORK MODULE
-- =====================================================

INSERT INTO module_definitions (
    slug, name_de, name_en, description_de, description_en, icon,
    type, duration_days, category, pillars, priority_weight,
    affected_by_modes, config_schema, task_template
) VALUES (
    'breathwork',
    'Atemübungen',
    'Breathwork Protocol',
    'Tägliche Atemübungen für Stressabbau und Fokus.',
    'Daily breathing exercises for stress relief and focus.',
    '🌬️',
    'continuous',
    NULL,
    'mindset',
    ARRAY['stress', 'mental', 'energy'],
    55,
    ARRAY[]::text[],
    '{
        "properties": {
            "technique": {
                "type": "string",
                "title": "Haupt-Technik",
                "enum": ["box_breathing", "wim_hof", "478_breathing", "physiological_sigh"],
                "enumLabels": {
                    "box_breathing": "Box Breathing (4-4-4-4)",
                    "wim_hof": "Wim Hof Methode",
                    "478_breathing": "4-7-8 Entspannung",
                    "physiological_sigh": "Physiological Sigh (schnelle Beruhigung)"
                },
                "default": "box_breathing"
            },
            "morning_session": {
                "type": "boolean",
                "title": "Morgen-Session",
                "default": true
            },
            "evening_session": {
                "type": "boolean",
                "title": "Abend-Session",
                "default": true
            }
        },
        "required": ["technique"]
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-breathwork",
                "type": "action",
                "time": "07:00",
                "title_de": "🌬️ Morgen-Atemübung",
                "title_en": "🌬️ Morning breathwork",
                "description": "5 Minuten gewählte Technik",
                "pillar": "stress",
                "duration_minutes": 5,
                "condition": "config.morning_session"
            },
            {
                "id": "stress-reset",
                "type": "action",
                "time": "14:00",
                "title_de": "😮‍💨 Physiological Sigh",
                "title_en": "😮‍💨 Physiological sigh",
                "description": "2x tief einatmen, lang ausatmen. Sofortige Beruhigung.",
                "pillar": "stress",
                "duration_minutes": 1
            },
            {
                "id": "evening-breathwork",
                "type": "action",
                "time": "21:00",
                "title_de": "🌬️ Abend-Atemübung (4-7-8)",
                "title_en": "🌬️ Evening breathwork (4-7-8)",
                "description": "Einatmen 4, Halten 7, Ausatmen 8 - für besseren Schlaf",
                "pillar": "sleep",
                "duration_minutes": 5,
                "condition": "config.evening_session"
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    task_template = EXCLUDED.task_template,
    config_schema = EXCLUDED.config_schema,
    updated_at = NOW();

-- =====================================================
-- 9. VERIFICATION
-- =====================================================

SELECT 'Phase 2 Modules Added:' AS status;
SELECT slug, name_de, type, duration_days, is_premium
FROM module_definitions
ORDER BY priority_weight DESC;

-- =====================================================
-- =====================================================
-- Migration 014: Phase 3 Advanced Features
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Blood Check OCR, Wearables, Readiness, Analytics, Notifications
-- =====================================================

-- =====================================================
-- 1. ENHANCED LAB RESULTS FOR OCR
-- =====================================================

-- Add OCR-specific columns to lab_results
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS ocr_raw_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS ocr_provider TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS parsing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS parsing_errors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS source_file_type TEXT;

COMMENT ON COLUMN lab_results.ocr_raw_text IS 'Raw text extracted from OCR';
COMMENT ON COLUMN lab_results.ocr_confidence IS 'OCR confidence score 0-100';
COMMENT ON COLUMN lab_results.ocr_provider IS 'OCR service used: manual, google_vision, tesseract, claude';
COMMENT ON COLUMN lab_results.parsing_status IS 'pending, processing, parsed, failed, verified';

-- Biomarker reference ranges
CREATE TABLE IF NOT EXISTS biomarker_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name_de TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,

    -- Reference ranges
    optimal_min DECIMAL(10,3),
    optimal_max DECIMAL(10,3),
    normal_min DECIMAL(10,3),
    normal_max DECIMAL(10,3),

    -- Context
    gender_specific BOOLEAN DEFAULT false,
    male_optimal_min DECIMAL(10,3),
    male_optimal_max DECIMAL(10,3),
    female_optimal_min DECIMAL(10,3),
    female_optimal_max DECIMAL(10,3),

    -- Supplements/Actions
    low_recommendations JSONB DEFAULT '[]',
    high_recommendations JSONB DEFAULT '[]',

    -- Parsing helpers
    aliases TEXT[] DEFAULT '{}',

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_category CHECK (category IN (
        'vitamins', 'minerals', 'hormones', 'lipids', 'metabolic',
        'inflammation', 'thyroid', 'liver', 'kidney', 'blood_cells', 'other'
    ))
);

COMMENT ON TABLE biomarker_references IS 'Reference ranges for blood biomarkers';

-- =====================================================
-- 2. WEARABLE DATA INTEGRATION
-- =====================================================

-- Wearable connections
CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    provider TEXT NOT NULL,
    provider_user_id TEXT,

    -- OAuth
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],

    -- Status
    status TEXT DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    sync_errors JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_provider CHECK (provider IN (
        'apple_health', 'google_fit', 'fitbit', 'garmin',
        'whoop', 'oura', 'withings', 'polar', 'eight_sleep'
    )),
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'expired', 'revoked')),
    UNIQUE(user_id, provider)
);

-- Wearable data points
CREATE TABLE IF NOT EXISTS wearable_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    connection_id UUID REFERENCES wearable_connections(id) ON DELETE CASCADE,

    -- Data point
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    metric_unit TEXT,

    -- Time
    recorded_at TIMESTAMPTZ NOT NULL,
    source_provider TEXT NOT NULL,

    -- Metadata
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_metric_type CHECK (metric_type IN (
        'hrv', 'resting_hr', 'sleep_score', 'sleep_duration', 'deep_sleep', 'rem_sleep',
        'steps', 'active_calories', 'total_calories', 'vo2_max', 'respiratory_rate',
        'body_battery', 'stress_score', 'recovery_score', 'readiness_score',
        'blood_oxygen', 'skin_temp', 'weight', 'body_fat', 'muscle_mass'
    ))
);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_date ON wearable_data(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_wearable_data_metric ON wearable_data(user_id, metric_type, recorded_at);

-- =====================================================
-- 3. READINESS SCORE & TASK SWAPPING
-- =====================================================

-- Daily readiness score
CREATE TABLE IF NOT EXISTS daily_readiness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Readiness Score (0-100)
    overall_score INTEGER NOT NULL,

    -- Contributing factors
    sleep_score INTEGER,
    recovery_score INTEGER,
    hrv_score INTEGER,
    stress_score INTEGER,

    -- Manual inputs
    energy_level INTEGER, -- 1-10
    mood_level INTEGER, -- 1-10
    soreness_level INTEGER, -- 1-10

    -- Source
    primary_source TEXT DEFAULT 'manual',
    data_sources JSONB DEFAULT '[]',

    -- Task recommendations
    recommended_intensity TEXT DEFAULT 'normal',
    task_adjustments JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_scores CHECK (
        overall_score >= 0 AND overall_score <= 100 AND
        (sleep_score IS NULL OR (sleep_score >= 0 AND sleep_score <= 100)) AND
        (energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 10))
    ),
    CONSTRAINT valid_intensity CHECK (recommended_intensity IN (
        'rest', 'light', 'normal', 'high', 'peak'
    )),
    UNIQUE(user_id, date)
);

COMMENT ON TABLE daily_readiness IS 'Daily readiness scores for task intensity adjustment';

-- =====================================================
-- 4. PROGRESS ANALYTICS
-- =====================================================

-- Weekly/Monthly aggregates
CREATE TABLE IF NOT EXISTS progress_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Period
    period_type TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Task metrics
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,

    -- Time metrics
    total_time_minutes INTEGER DEFAULT 0,
    avg_daily_time_minutes DECIMAL(5,1) DEFAULT 0,

    -- Streak
    longest_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,

    -- Pillar breakdown
    pillar_breakdown JSONB DEFAULT '{}',

    -- Module breakdown
    module_breakdown JSONB DEFAULT '{}',

    -- Trends
    completion_trend DECIMAL(5,2), -- % change from previous period

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_period_type CHECK (period_type IN ('week', 'month', 'quarter', 'year')),
    UNIQUE(user_id, period_type, period_start)
);

-- Milestone achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    achievement_type TEXT NOT NULL,
    achievement_value INTEGER,

    -- Context
    module_slug TEXT,
    pillar TEXT,

    earned_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_achievement CHECK (achievement_type IN (
        'streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_90',
        'tasks_10', 'tasks_50', 'tasks_100', 'tasks_500', 'tasks_1000',
        'module_completed', 'perfect_day', 'perfect_week',
        'first_blood_check', 'blood_check_improved',
        'wearable_connected', 'readiness_streak'
    ))
);

-- =====================================================
-- 5. NOTIFICATION ENGINE
-- =====================================================

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Channels
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    sms_enabled BOOLEAN DEFAULT false,

    -- Timing
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    timezone TEXT DEFAULT 'Europe/Vienna',

    -- Notification types
    task_reminders BOOLEAN DEFAULT true,
    streak_alerts BOOLEAN DEFAULT true,
    weekly_summary BOOLEAN DEFAULT true,
    module_updates BOOLEAN DEFAULT true,
    blood_check_reminders BOOLEAN DEFAULT true,
    achievement_alerts BOOLEAN DEFAULT true,

    -- Frequency
    reminder_minutes_before INTEGER DEFAULT 15,
    max_daily_notifications INTEGER DEFAULT 8,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification queue
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Content
    type TEXT NOT NULL,
    title_de TEXT NOT NULL,
    title_en TEXT,
    body_de TEXT,
    body_en TEXT,
    action_url TEXT,

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    error_message TEXT,

    -- Context
    source_module TEXT,
    task_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_notif_type CHECK (type IN (
        'task_reminder', 'streak_warning', 'streak_milestone',
        'weekly_summary', 'blood_check_due', 'achievement',
        'module_reminder', 'readiness_check', 'custom'
    )),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'opened', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id, status);

-- =====================================================
-- 6. SEED: BIOMARKER REFERENCES
-- =====================================================

INSERT INTO biomarker_references (code, name_de, name_en, category, unit, optimal_min, optimal_max, normal_min, normal_max, aliases, low_recommendations, high_recommendations)
VALUES
    ('vitamin_d', 'Vitamin D (25-OH)', 'Vitamin D (25-OH)', 'vitamins', 'ng/mL', 40, 60, 30, 100,
     ARRAY['25-hydroxyvitamin d', 'calcidiol', '25-oh-d3', 'vitamin d3'],
     '[{"de": "Vitamin D3 supplementieren (4000-5000 IU/Tag)", "en": "Supplement Vitamin D3 (4000-5000 IU/day)"}]'::jsonb,
     '[{"de": "Supplementierung reduzieren, Blutwerte kontrollieren", "en": "Reduce supplementation, monitor blood levels"}]'::jsonb),

    ('b12', 'Vitamin B12', 'Vitamin B12', 'vitamins', 'pg/mL', 500, 900, 200, 900,
     ARRAY['cobalamin', 'methylcobalamin'],
     '[{"de": "B12 supplementieren (Methylcobalamin bevorzugt)", "en": "Supplement B12 (methylcobalamin preferred)"}]'::jsonb,
     '[]'::jsonb),

    ('ferritin', 'Ferritin', 'Ferritin', 'minerals', 'ng/mL', 50, 150, 20, 200,
     ARRAY['speichereisen', 'iron storage'],
     '[{"de": "Eisenreiche Ernährung, evtl. Eisen-Bisglycinat", "en": "Iron-rich diet, consider iron bisglycinate"}]'::jsonb,
     '[{"de": "Entzündungsmarker prüfen, Eisen reduzieren", "en": "Check inflammation markers, reduce iron"}]'::jsonb),

    ('tsh', 'TSH', 'TSH', 'thyroid', 'mIU/L', 1.0, 2.5, 0.4, 4.0,
     ARRAY['thyroid stimulating hormone', 'thyrotropin'],
     '[{"de": "Schilddrüsenfunktion überprüfen lassen", "en": "Have thyroid function checked"}]'::jsonb,
     '[{"de": "Schilddrüsenunterfunktion möglich, ärztlich abklären", "en": "Possible hypothyroidism, consult doctor"}]'::jsonb),

    ('hba1c', 'HbA1c', 'HbA1c', 'metabolic', '%', 4.5, 5.3, 4.0, 5.7,
     ARRAY['glykohämoglobin', 'glycated hemoglobin', 'a1c'],
     '[]'::jsonb,
     '[{"de": "Kohlenhydrate reduzieren, Bewegung erhöhen", "en": "Reduce carbs, increase exercise"}]'::jsonb),

    ('crp', 'CRP (hsCRP)', 'CRP (hsCRP)', 'inflammation', 'mg/L', 0, 1.0, 0, 3.0,
     ARRAY['c-reactive protein', 'hochsensitives crp', 'hs-crp'],
     '[]'::jsonb,
     '[{"de": "Entzündungsquellen identifizieren, Omega-3 erhöhen", "en": "Identify inflammation sources, increase Omega-3"}]'::jsonb),

    ('homocysteine', 'Homocystein', 'Homocysteine', 'metabolic', 'µmol/L', 5, 9, 5, 15,
     ARRAY['homocystein'],
     '[]'::jsonb,
     '[{"de": "B-Vitamine (B6, B12, Folat) supplementieren", "en": "Supplement B vitamins (B6, B12, folate)"}]'::jsonb),

    ('ldl', 'LDL-Cholesterin', 'LDL Cholesterol', 'lipids', 'mg/dL', 70, 100, 0, 130,
     ARRAY['ldl-c', 'low density lipoprotein'],
     '[]'::jsonb,
     '[{"de": "Ballaststoffe erhöhen, gesättigte Fette reduzieren", "en": "Increase fiber, reduce saturated fats"}]'::jsonb),

    ('hdl', 'HDL-Cholesterin', 'HDL Cholesterol', 'lipids', 'mg/dL', 60, 100, 40, 100,
     ARRAY['hdl-c', 'high density lipoprotein'],
     '[{"de": "Bewegung erhöhen, Omega-3 supplementieren", "en": "Increase exercise, supplement Omega-3"}]'::jsonb,
     '[]'::jsonb),

    ('triglycerides', 'Triglyceride', 'Triglycerides', 'lipids', 'mg/dL', 50, 100, 0, 150,
     ARRAY['tg', 'triacylglyceride'],
     '[]'::jsonb,
     '[{"de": "Zucker und Alkohol reduzieren, Omega-3 erhöhen", "en": "Reduce sugar and alcohol, increase Omega-3"}]'::jsonb)

ON CONFLICT (code) DO UPDATE SET
    optimal_min = EXCLUDED.optimal_min,
    optimal_max = EXCLUDED.optimal_max,
    low_recommendations = EXCLUDED.low_recommendations,
    high_recommendations = EXCLUDED.high_recommendations;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE biomarker_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Public read for biomarker references
CREATE POLICY "Anyone can view biomarkers" ON biomarker_references FOR SELECT USING (is_active = true);

-- User-specific policies
CREATE POLICY "Users can manage own wearable connections" ON wearable_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wearable data" ON wearable_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own readiness" ON daily_readiness FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON progress_aggregates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notification prefs" ON notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notification_queue FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

SELECT 'Phase 3 Tables Created:' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'biomarker_references', 'wearable_connections', 'wearable_data',
    'daily_readiness', 'progress_aggregates', 'user_achievements',
    'notification_preferences', 'notification_queue'
);

SELECT 'Biomarker References:' AS status;
SELECT code, name_de, category FROM biomarker_references ORDER BY category, code;
-- =====================================================
-- Migration 015: Active Protocol Packs
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Persistent storage for One-Tap Protocol Packs (Immune Shield, Deep Work, etc.)
-- Ref: v0.4.0 Protocol Intelligence Layer
-- =====================================================

-- =====================================================
-- 1. ACTIVE PROTOCOLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS active_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Protocol Identification
    protocol_id TEXT NOT NULL,
    protocol_name TEXT NOT NULL,
    protocol_icon TEXT DEFAULT '🎯',
    protocol_category TEXT,

    -- Activation State
    status TEXT DEFAULT 'active',
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,

    -- Protocol Tasks
    tasks JSONB NOT NULL DEFAULT '[]',

    -- Task Completion Status
    -- Structure: { "task_id": { "completed": true, "completed_at": "timestamp" } }
    task_completion_status JSONB DEFAULT '{}',

    -- Progress Metrics
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Duration & Impact
    duration_hours INTEGER NOT NULL,
    impact_score INTEGER,

    -- Science Reference
    science_ref TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_protocol_status CHECK (status IN ('active', 'completed', 'deactivated', 'expired')),
    CONSTRAINT valid_impact_score CHECK (impact_score IS NULL OR (impact_score >= 0 AND impact_score <= 10)),
    CONSTRAINT valid_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

COMMENT ON TABLE active_protocols IS 'One-Tap Protocol Packs that override daily plans for acute problems';
COMMENT ON COLUMN active_protocols.protocol_id IS 'Reference to PROTOCOL_PACKS constant (e.g., immune_shield, deep_work)';
COMMENT ON COLUMN active_protocols.tasks IS 'Array of protocol tasks with metadata';
COMMENT ON COLUMN active_protocols.task_completion_status IS 'Track completion status for each task in the protocol';

-- =====================================================
-- 2. USER CIRCADIAN PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_circadian_prefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Location (for sunrise/sunset calculation)
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    timezone TEXT DEFAULT 'Europe/Berlin',
    location_name TEXT,

    -- Custom Overrides (optional)
    custom_wake_time TIME,
    custom_sleep_time TIME,

    -- Circadian Intelligence Settings
    enable_morning_light_window BOOLEAN DEFAULT true,
    enable_blue_light_cutoff BOOLEAN DEFAULT true,
    enable_adaptive_melatonin_guard BOOLEAN DEFAULT true,

    -- Morning Light Window Offset (minutes after sunrise)
    morning_light_window_offset INTEGER DEFAULT 60,

    -- Blue Light Cutoff Offset (minutes before sunset)
    blue_light_cutoff_offset INTEGER DEFAULT 120,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_circadian_prefs IS 'User preferences for Circadian Intelligence Engine';
COMMENT ON COLUMN user_circadian_prefs.latitude IS 'User location for sunrise/sunset calculation (null = use defaults)';
COMMENT ON COLUMN user_circadian_prefs.morning_light_window_offset IS 'Minutes after sunrise for optimal morning light window';
COMMENT ON COLUMN user_circadian_prefs.blue_light_cutoff_offset IS 'Minutes before sunset to reduce blue light';

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_active_protocols_user ON active_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_active_protocols_status ON active_protocols(status);
CREATE INDEX IF NOT EXISTS idx_active_protocols_user_status ON active_protocols(user_id, status);
CREATE INDEX IF NOT EXISTS idx_active_protocols_expires ON active_protocols(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_protocols_protocol_id ON active_protocols(protocol_id);

CREATE INDEX IF NOT EXISTS idx_user_circadian_prefs_user ON user_circadian_prefs(user_id);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE active_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_circadian_prefs ENABLE ROW LEVEL SECURITY;

-- Active Protocols: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own protocols" ON active_protocols;
CREATE POLICY "Users can view own protocols"
    ON active_protocols FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own protocols" ON active_protocols;
CREATE POLICY "Users can insert own protocols"
    ON active_protocols FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own protocols" ON active_protocols;
CREATE POLICY "Users can update own protocols"
    ON active_protocols FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own protocols" ON active_protocols;
CREATE POLICY "Users can delete own protocols"
    ON active_protocols FOR DELETE
    USING (auth.uid() = user_id);

-- Circadian Prefs: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own circadian prefs" ON user_circadian_prefs;
CREATE POLICY "Users can view own circadian prefs"
    ON user_circadian_prefs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own circadian prefs" ON user_circadian_prefs;
CREATE POLICY "Users can insert own circadian prefs"
    ON user_circadian_prefs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own circadian prefs" ON user_circadian_prefs;
CREATE POLICY "Users can update own circadian prefs"
    ON user_circadian_prefs FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Update timestamp trigger for active_protocols
DROP TRIGGER IF EXISTS update_active_protocols_updated_at ON active_protocols;
CREATE TRIGGER update_active_protocols_updated_at
    BEFORE UPDATE ON active_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for user_circadian_prefs
DROP TRIGGER IF EXISTS update_user_circadian_prefs_updated_at ON user_circadian_prefs;
CREATE TRIGGER update_user_circadian_prefs_updated_at
    BEFORE UPDATE ON user_circadian_prefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update completion percentage on task status change
CREATE OR REPLACE FUNCTION update_protocol_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate completion percentage based on task_completion_status
    IF NEW.tasks_total > 0 THEN
        NEW.completion_percentage := (NEW.tasks_completed::DECIMAL / NEW.tasks_total::DECIMAL) * 100;
    ELSE
        NEW.completion_percentage := 0;
    END IF;

    -- Auto-mark as completed if all tasks done
    IF NEW.tasks_completed >= NEW.tasks_total AND NEW.tasks_total > 0 THEN
        NEW.status := 'completed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_protocol_completion ON active_protocols;
CREATE TRIGGER trigger_update_protocol_completion
    BEFORE UPDATE OF tasks_completed ON active_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_protocol_completion();

-- Auto-expire protocols past their expiration date
CREATE OR REPLACE FUNCTION auto_expire_protocols()
RETURNS void AS $$
BEGIN
    UPDATE active_protocols
    SET status = 'expired',
        deactivated_at = NOW(),
        deactivation_reason = 'Auto-expired after duration'
    WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. SEED DATA: Default Circadian Preferences
-- =====================================================

-- Default location: Berlin (for fallback)
-- Users will override this with their actual location

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

SELECT 'Migration 015 completed:' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('active_protocols', 'user_circadian_prefs');

-- =====================================================
-- NOTES
-- =====================================================
--
-- To activate a protocol for a user:
-- INSERT INTO active_protocols (user_id, protocol_id, protocol_name, tasks, expires_at, duration_hours, tasks_total)
-- VALUES (
--   'user-uuid',
--   'immune_shield',
--   'Immune Shield',
--   '[...]'::jsonb,
--   NOW() + INTERVAL '24 hours',
--   24,
--   4
-- );
--
-- To check for active protocols:
-- SELECT * FROM active_protocols WHERE user_id = 'user-uuid' AND status = 'active';
--
-- To mark a task complete:
-- UPDATE active_protocols
-- SET task_completion_status = jsonb_set(task_completion_status, '{task_id}', '{"completed": true, "completed_at": "timestamp"}'::jsonb),
--     tasks_completed = tasks_completed + 1
-- WHERE id = 'protocol-uuid';
--
-- To run protocol expiration check (can be scheduled):
-- SELECT auto_expire_protocols();
--
-- =====================================================
-- =====================================================
-- Migration 016: Mental Health Modules
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Add evidence-based mental health tracking modules
-- Research: Harvard longevity study (gratitude), CBT effectiveness, PHQ-9 validation
-- =====================================================

-- Gratitude Journal Module (Harvard 2024: 9% lower mortality risk)
INSERT INTO module_definitions (
    slug,
    name_de,
    name_en,
    description_de,
    description_en,
    icon,
    type,
    duration_days,
    category,
    pillars,
    priority_weight,
    affected_by_modes,
    config_schema,
    task_template
) VALUES (
    'gratitude-journal',
    'Dankbarkeits-Tagebuch',
    'Gratitude Journal',
    '3 Dinge täglich, für die du dankbar bist. Harvard-Studie: 9% niedrigeres Sterberisiko, bessere Herz-Gesundheit.',
    '3 things you''re grateful for daily. Harvard study: 9% lower mortality risk, better cardiovascular health.',
    '💛',
    'continuous',
    NULL,
    'mindset',
    ARRAY['mindset', 'mental', 'connection'],
    90,
    ARRAY[]::text[],
    '{
        "reminder_time": {"type": "time", "default": "20:00", "label_de": "Erinnerung"},
        "reflection_depth": {"type": "select", "options": ["quick", "detailed"], "default": "quick", "label_de": "Tiefe"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "gratitude-evening",
                "type": "check-in",
                "time": "{{config.reminder_time}}",
                "title_de": "3 Dinge, für die ich dankbar bin",
                "title_en": "3 things I''m grateful for",
                "description": "Was lief heute gut? Wofür bin ich dankbar? (Menschen, Momente, Fortschritte)",
                "pillar": "mindset",
                "duration_minutes": 3,
                "prompts": [
                    "1. Person oder Moment heute",
                    "2. Etwas Kleines, das Freude brachte",
                    "3. Eine eigene Stärke, die ich genutzt habe"
                ]
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- CBT Thought Record Module (Evidence-based cognitive restructuring)
INSERT INTO module_definitions (
    slug,
    name_de,
    name_en,
    description_de,
    description_en,
    icon,
    type,
    duration_days,
    category,
    pillars,
    priority_weight,
    affected_by_modes,
    is_premium,
    config_schema,
    task_template
) VALUES (
    'cbt-thought-record',
    'Gedanken-Protokoll (CBT)',
    'CBT Thought Record',
    'Identifiziere & challengte negative Gedankenmuster. Klinisch bewährte Cognitive Behavioral Therapy.',
    'Identify & challenge negative thought patterns. Clinically proven Cognitive Behavioral Therapy.',
    '🧩',
    'continuous',
    NULL,
    'mindset',
    ARRAY['mindset', 'mental', 'stress'],
    85,
    ARRAY['sick']::text[],
    true,
    '{
        "trigger_reminder": {"type": "boolean", "default": true, "label_de": "Erinnerung bei Stress-Trigger"},
        "evening_review": {"type": "boolean", "default": true, "label_de": "Abend-Review"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "cbt-morning-intention",
                "type": "check-in",
                "time": "08:00",
                "title_de": "Gedanken-Awareness Check",
                "title_en": "Thought Awareness Check",
                "description": "Beobachte heute deine automatischen Gedanken. Welche Muster erkennst du?",
                "pillar": "mindset",
                "duration_minutes": 2
            },
            {
                "id": "cbt-thought-record",
                "type": "action",
                "time": "20:00",
                "title_de": "Gedanken-Protokoll",
                "title_en": "Thought Record",
                "description": "CBT 5-Spalten: Situation → Gedanke → Gefühl → Evidenz → Alternative",
                "pillar": "mental",
                "duration_minutes": 7,
                "prompts": [
                    "Situation: Was ist passiert?",
                    "Automatischer Gedanke: Was dachte ich?",
                    "Gefühl: Was fühlte ich? (0-10)",
                    "Evidenz: Ist dieser Gedanke wahr?",
                    "Alternative: Realistischere Sichtweise?"
                ]
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Mood Check-In Module (PHQ-9 based, clinical validation)
INSERT INTO module_definitions (
    slug,
    name_de,
    name_en,
    description_de,
    description_en,
    icon,
    type,
    duration_days,
    category,
    pillars,
    priority_weight,
    affected_by_modes,
    config_schema,
    task_template
) VALUES (
    'mood-check-in',
    'Stimmungs-Check',
    'Mood Check-In',
    'Tägliches Mood-Tracking zur Früherkennung von Mustern. PHQ-9 validiert, 2 Min täglich.',
    'Daily mood tracking for early pattern detection. PHQ-9 validated, 2 min daily.',
    '📊',
    'continuous',
    NULL,
    'mindset',
    ARRAY['mindset', 'mental'],
    75,
    ARRAY[]::text[],
    '{
        "check_in_times": {
            "type": "array",
            "options": ["morning", "evening", "both"],
            "default": "evening",
            "label_de": "Check-In Zeitpunkt"
        },
        "include_triggers": {"type": "boolean", "default": true, "label_de": "Trigger tracken"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "mood-morning",
                "type": "check-in",
                "time": "08:30",
                "title_de": "Morgen Mood-Check",
                "title_en": "Morning Mood Check",
                "description": "Wie fühlst du dich heute Morgen? (0-10)",
                "pillar": "mindset",
                "duration_minutes": 1,
                "condition": "config.check_in_times === ''morning'' || config.check_in_times === ''both''",
                "metrics": [
                    {"id": "energy", "label": "Energie", "scale": "0-10"},
                    {"id": "mood", "label": "Stimmung", "scale": "0-10"}
                ]
            },
            {
                "id": "mood-evening",
                "type": "check-in",
                "time": "21:00",
                "title_de": "Abend Mood-Check",
                "title_en": "Evening Mood Check",
                "description": "Wie war dein Tag emotional? Was waren Trigger?",
                "pillar": "mental",
                "duration_minutes": 2,
                "metrics": [
                    {"id": "mood", "label": "Stimmung", "scale": "0-10"},
                    {"id": "stress", "label": "Stress", "scale": "0-10"},
                    {"id": "anxiety", "label": "Angst", "scale": "0-10"}
                ],
                "prompts": [
                    "Haupttrigger heute? (optional)",
                    "Was half, die Stimmung zu heben?"
                ]
            },
            {
                "id": "mood-weekly-review",
                "type": "check-in",
                "frequency": "weekly",
                "day": "sunday",
                "time": "19:00",
                "title_de": "Wochen-Mood-Analyse",
                "title_en": "Weekly Mood Analysis",
                "description": "Review: Wie war die Woche insgesamt? Muster erkannt?",
                "pillar": "mental",
                "duration_minutes": 5
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    description_de = EXCLUDED.description_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Mental Health Modules added:' AS status;
SELECT slug, name_de, category, is_premium FROM module_definitions
WHERE slug IN ('gratitude-journal', 'cbt-thought-record', 'mood-check-in')
ORDER BY priority_weight DESC;

-- =====================================================
-- NOTES
-- =====================================================
--
-- Research Sources:
-- - Harvard JAMA Psychiatry 2024: Gratitude & Longevity (9% lower mortality)
-- - Meta-analysis 64 RCTs: Gratitude interventions improve life satisfaction 6.86%
-- - CBT apps clinical trials: Significant reduction in anxiety/depression symptoms
-- - PHQ-9: Gold standard for depression screening, validated across populations
--
-- =====================================================
-- Migration 017: Biological Inventory & Fulfillment Bridge (v0.8.0)
-- Purpose: Track supplement inventory and predict depletion
-- Axiom: AX-3 Real-World Execution - Reduce cognitive load by automating supply management

-- User Supplement Inventory
CREATE TABLE IF NOT EXISTS user_supplement_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_name TEXT NOT NULL,
    supplement_slug TEXT NOT NULL, -- e.g. 'magnesium', 'vitamin_d3'
    dosage_unit TEXT NOT NULL, -- 'capsules', 'ml', 'tablets', 'grams'
    current_stock NUMERIC NOT NULL DEFAULT 0, -- Current quantity in stock
    daily_consumption_rate NUMERIC DEFAULT 0, -- Auto-calculated based on protocols
    reorder_threshold NUMERIC DEFAULT 7, -- Days of supply before warning
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, supplement_slug)
);

-- Consumption History (for compliance tracking & prediction refinement)
CREATE TABLE IF NOT EXISTS supplement_consumption_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_slug TEXT NOT NULL,
    consumed_amount NUMERIC NOT NULL,
    consumed_at TIMESTAMPTZ DEFAULT NOW(),
    protocol_id TEXT, -- Optional: which protocol triggered this consumption
    compliance BOOLEAN DEFAULT TRUE -- Did user actually take it?
);

-- Reorder History (for supply chain analytics)
CREATE TABLE IF NOT EXISTS supplement_reorder_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_slug TEXT NOT NULL,
    ordered_quantity NUMERIC NOT NULL,
    ordered_at TIMESTAMPTZ DEFAULT NOW(),
    expected_arrival TIMESTAMPTZ,
    fulfilled BOOLEAN DEFAULT FALSE,
    fulfillment_method TEXT -- 'whatsapp', 'email', 'manual'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_supplement_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_user_date ON supplement_consumption_log(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reorder_user ON supplement_reorder_log(user_id, ordered_at DESC);

-- RLS Policies
ALTER TABLE user_supplement_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_consumption_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_reorder_log ENABLE ROW LEVEL SECURITY;

-- Inventory policies
CREATE POLICY "Users can view own inventory" ON user_supplement_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own inventory" ON user_supplement_inventory
    FOR ALL USING (auth.uid() = user_id);

-- Consumption log policies
CREATE POLICY "Users can view own consumption log" ON supplement_consumption_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can log own consumption" ON supplement_consumption_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reorder log policies
CREATE POLICY "Users can view own reorder log" ON supplement_reorder_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reorder log" ON supplement_reorder_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reorder log" ON supplement_reorder_log
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_timestamp
    BEFORE UPDATE ON user_supplement_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_timestamp();

-- NOTE: Default inventory is initialized per-user via inventoryService.initializeInventory()
-- Seed data cannot be added here because auth.uid() is NULL during migration

COMMENT ON TABLE user_supplement_inventory IS 'v0.8.0: Tracks user supplement inventory for predictive reordering';
COMMENT ON TABLE supplement_consumption_log IS 'v0.8.0: Logs actual supplement consumption for compliance tracking';
COMMENT ON TABLE supplement_reorder_log IS 'v0.8.0: Tracks reorder history for supply chain optimization';
-- Email System Database Migration
-- Version: 018
-- Created: 2026-02-04

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT,
  status TEXT DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Add email preferences to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "transactional": true,
  "nudges": true,
  "weekly_summary": true,
  "marketing": false
}'::jsonb;

-- Add email verification status
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- RLS Policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert email logs
CREATE POLICY "Service role can insert email logs"
  ON email_logs
  FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE email_logs IS 'Tracks all emails sent via Resend API';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: welcome, plan_delivery, daily_nudge, weekly_summary, password_reset';
COMMENT ON COLUMN email_logs.resend_id IS 'Resend API email ID for tracking';
COMMENT ON COLUMN email_logs.status IS 'Email status: sent, delivered, opened, clicked, bounced, failed';
COMMENT ON COLUMN user_profiles.email_preferences IS 'User email notification preferences';
-- ============================================================================
-- Lab Snapshot System - Database Schema
-- Migration 020: Biomarker Results & Lab Upload Tracking
-- ============================================================================
-- 
-- This migration creates the database schema for the Lab Snapshot Lite feature.
-- Focuses on 10 key biomarkers with OCR extraction and user verification.
--
-- Key Tables:
-- 1. biomarker_results: Stores individual biomarker values from lab tests
-- 2. lab_uploads: Tracks lab report uploads and OCR processing status
--
-- ============================================================================

-- ============================================================================
-- TABLE: lab_uploads
-- ============================================================================
-- Tracks lab report uploads and OCR processing status
-- NOTE: Created FIRST because biomarker_results references it

CREATE TABLE IF NOT EXISTS lab_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- File Information
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'jpg', 'png'
    file_size INTEGER, -- bytes
    storage_path TEXT NOT NULL, -- Supabase Storage path
    
    -- OCR Processing
    ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'manual_review')),
    ocr_started_at TIMESTAMPTZ,
    ocr_completed_at TIMESTAMPTZ,
    ocr_error TEXT,
    ocr_provider TEXT DEFAULT 'claude_vision', -- 'claude_vision', 'google_vision', 'manual'
    
    -- Extraction Results
    biomarkers_detected INTEGER DEFAULT 0,
    biomarkers_verified INTEGER DEFAULT 0,
    average_confidence NUMERIC,
    
    -- Test Information
    test_date DATE,
    lab_name TEXT,
    lab_location TEXT,
    
    -- User Actions
    user_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB, -- Store raw OCR response, detected text, etc.
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: biomarker_results
-- ============================================================================
-- Stores individual biomarker values extracted from lab reports
-- NOTE: Created AFTER lab_uploads because it references lab_uploads(id)

CREATE TABLE IF NOT EXISTS biomarker_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lab_upload_id UUID REFERENCES lab_uploads(id) ON DELETE CASCADE,
    
    -- Biomarker Information
    biomarker_name TEXT NOT NULL,
    biomarker_category TEXT, -- e.g., 'vitamins', 'hormones', 'metabolic', 'inflammation'
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'ng/ml', 'mg/dL', 'mmol/L'
    
    -- Reference Ranges
    reference_min NUMERIC,
    reference_max NUMERIC,
    reference_range_text TEXT, -- Original text from lab (e.g., "20-50 ng/ml")
    optimal_min NUMERIC, -- Optimal range (may differ from lab reference)
    optimal_max NUMERIC,
    
    -- Status
    status TEXT CHECK (status IN ('optimal', 'borderline', 'low', 'high', 'critical')),
    
    -- Test Information
    test_date DATE NOT NULL,
    lab_name TEXT,
    test_method TEXT, -- e.g., 'ELISA', 'LC-MS/MS'
    
    -- OCR Metadata
    ocr_confidence NUMERIC CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
    manually_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- biomarker_results indexes
CREATE INDEX IF NOT EXISTS idx_biomarker_results_user_id ON biomarker_results(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_biomarker_name ON biomarker_results(biomarker_name);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_test_date ON biomarker_results(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_status ON biomarker_results(status);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_user_biomarker ON biomarker_results(user_id, biomarker_name, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_lab_upload ON biomarker_results(lab_upload_id);

-- lab_uploads indexes
CREATE INDEX IF NOT EXISTS idx_lab_uploads_user_id ON lab_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_ocr_status ON lab_uploads(ocr_status);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_created_at ON lab_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_test_date ON lab_uploads(test_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE biomarker_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_uploads ENABLE ROW LEVEL SECURITY;

-- biomarker_results policies
CREATE POLICY "Users can view their own biomarker results"
    ON biomarker_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biomarker results"
    ON biomarker_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biomarker results"
    ON biomarker_results FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biomarker results"
    ON biomarker_results FOR DELETE
    USING (auth.uid() = user_id);

-- lab_uploads policies
CREATE POLICY "Users can view their own lab uploads"
    ON lab_uploads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lab uploads"
    ON lab_uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lab uploads"
    ON lab_uploads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lab uploads"
    ON lab_uploads FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate biomarker status
CREATE OR REPLACE FUNCTION calculate_biomarker_status(
    p_value NUMERIC,
    p_reference_min NUMERIC,
    p_reference_max NUMERIC,
    p_optimal_min NUMERIC,
    p_optimal_max NUMERIC
)
RETURNS TEXT AS $$
BEGIN
    -- Critical: Way outside reference range
    IF p_reference_min IS NOT NULL AND p_value < p_reference_min * 0.5 THEN
        RETURN 'critical';
    END IF;
    IF p_reference_max IS NOT NULL AND p_value > p_reference_max * 1.5 THEN
        RETURN 'critical';
    END IF;
    
    -- Low: Below reference range
    IF p_reference_min IS NOT NULL AND p_value < p_reference_min THEN
        RETURN 'low';
    END IF;
    
    -- High: Above reference range
    IF p_reference_max IS NOT NULL AND p_value > p_reference_max THEN
        RETURN 'high';
    END IF;
    
    -- Optimal: Within optimal range (if defined)
    IF p_optimal_min IS NOT NULL AND p_optimal_max IS NOT NULL THEN
        IF p_value >= p_optimal_min AND p_value <= p_optimal_max THEN
            RETURN 'optimal';
        ELSE
            RETURN 'borderline';
        END IF;
    END IF;
    
    -- Default: Within reference range
    RETURN 'optimal';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update biomarker status automatically
CREATE OR REPLACE FUNCTION update_biomarker_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status := calculate_biomarker_status(
        NEW.value,
        NEW.reference_min,
        NEW.reference_max,
        NEW.optimal_min,
        NEW.optimal_max
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate status on insert/update
CREATE TRIGGER biomarker_results_status_trigger
    BEFORE INSERT OR UPDATE ON biomarker_results
    FOR EACH ROW
    EXECUTE FUNCTION update_biomarker_status();

-- Function to update lab_upload statistics
CREATE OR REPLACE FUNCTION update_lab_upload_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lab_uploads
    SET 
        biomarkers_detected = (
            SELECT COUNT(*) 
            FROM biomarker_results 
            WHERE lab_upload_id = NEW.lab_upload_id
        ),
        biomarkers_verified = (
            SELECT COUNT(*) 
            FROM biomarker_results 
            WHERE lab_upload_id = NEW.lab_upload_id 
            AND manually_verified = TRUE
        ),
        average_confidence = (
            SELECT AVG(ocr_confidence) 
            FROM biomarker_results 
            WHERE lab_upload_id = NEW.lab_upload_id 
            AND ocr_confidence IS NOT NULL
        ),
        updated_at = NOW()
    WHERE id = NEW.lab_upload_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update lab_upload stats when biomarker results change
CREATE TRIGGER biomarker_results_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON biomarker_results
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_upload_stats();

-- ============================================================================
-- REFERENCE DATA: Standard Biomarkers
-- ============================================================================

-- Table for standard biomarker definitions (optional, for UI consistency)
CREATE TABLE IF NOT EXISTS biomarker_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    common_units TEXT[], -- Array of common units
    typical_reference_min NUMERIC,
    typical_reference_max NUMERIC,
    optimal_min NUMERIC,
    optimal_max NUMERIC,
    interpretation_low TEXT,
    interpretation_high TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 10 key biomarkers for Lab Snapshot Lite
INSERT INTO biomarker_definitions (name, display_name, category, description, common_units, typical_reference_min, typical_reference_max, optimal_min, optimal_max, interpretation_low, interpretation_high)
VALUES
    ('vitamin_d', 'Vitamin D (25-OH)', 'vitamins', 'Vitamin D status indicator', ARRAY['ng/ml', 'nmol/L'], 20, 50, 40, 80, 'Deficiency - Supplement with 5000 IU/day', 'Excess - Reduce supplementation'),
    ('vitamin_b12', 'Vitamin B12', 'vitamins', 'B12 status and neurological health', ARRAY['pg/ml', 'pmol/L'], 200, 900, 400, 800, 'Deficiency - Consider B12 supplementation', 'Excess - Usually not concerning'),
    ('ferritin', 'Ferritin', 'minerals', 'Iron storage indicator', ARRAY['ng/ml', 'μg/L'], 30, 400, 50, 150, 'Low iron stores - Increase iron intake', 'High - Check for inflammation or hemochromatosis'),
    ('tsh', 'TSH (Thyroid Stimulating Hormone)', 'hormones', 'Thyroid function indicator', ARRAY['mIU/L', 'μIU/ml'], 0.4, 4.0, 1.0, 2.5, 'Hyperthyroidism - Consult endocrinologist', 'Hypothyroidism - Consult endocrinologist'),
    ('hba1c', 'HbA1c (Glycated Hemoglobin)', 'metabolic', 'Long-term blood sugar control', ARRAY['%', 'mmol/mol'], 4.0, 5.6, 4.0, 5.4, 'Hypoglycemia - Monitor blood sugar', 'Prediabetes/Diabetes - Consult physician'),
    ('total_cholesterol', 'Total Cholesterol', 'lipids', 'Overall cholesterol level', ARRAY['mg/dL', 'mmol/L'], 125, 200, 150, 180, 'Low - Usually not concerning', 'High - Consider diet and lifestyle changes'),
    ('triglycerides', 'Triglycerides', 'lipids', 'Blood fat level', ARRAY['mg/dL', 'mmol/L'], 0, 150, 0, 100, 'Low - Usually not concerning', 'High - Reduce sugar and alcohol intake'),
    ('crp', 'CRP (C-Reactive Protein)', 'inflammation', 'Inflammation marker', ARRAY['mg/L', 'mg/dL'], 0, 3.0, 0, 1.0, 'Low - Good', 'High - Inflammation present'),
    ('glucose_fasting', 'Fasting Glucose', 'metabolic', 'Blood sugar level (fasting)', ARRAY['mg/dL', 'mmol/L'], 70, 100, 75, 90, 'Hypoglycemia - Monitor and adjust diet', 'Prediabetes - Reduce carb intake'),
    ('creatinine', 'Creatinine', 'kidney', 'Kidney function indicator', ARRAY['mg/dL', 'μmol/L'], 0.6, 1.2, 0.7, 1.0, 'Low - Usually not concerning', 'High - Check kidney function')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Latest biomarker results per user
CREATE OR REPLACE VIEW latest_biomarker_results AS
SELECT DISTINCT ON (user_id, biomarker_name)
    id,
    user_id,
    biomarker_name,
    value,
    unit,
    status,
    test_date,
    lab_name,
    ocr_confidence,
    manually_verified,
    created_at
FROM biomarker_results
ORDER BY user_id, biomarker_name, test_date DESC, created_at DESC;

-- View: Biomarker trends (last 3 results per biomarker)
CREATE OR REPLACE VIEW biomarker_trends AS
SELECT 
    user_id,
    biomarker_name,
    ARRAY_AGG(value ORDER BY test_date DESC) FILTER (WHERE rn <= 3) AS values,
    ARRAY_AGG(test_date ORDER BY test_date DESC) FILTER (WHERE rn <= 3) AS dates,
    ARRAY_AGG(status ORDER BY test_date DESC) FILTER (WHERE rn <= 3) AS statuses
FROM (
    SELECT 
        user_id,
        biomarker_name,
        value,
        test_date,
        status,
        ROW_NUMBER() OVER (PARTITION BY user_id, biomarker_name ORDER BY test_date DESC) AS rn
    FROM biomarker_results
) ranked
WHERE rn <= 3
GROUP BY user_id, biomarker_name;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE biomarker_results IS 'Stores individual biomarker values from lab tests';
COMMENT ON TABLE lab_uploads IS 'Tracks lab report uploads and OCR processing status';
COMMENT ON TABLE biomarker_definitions IS 'Reference data for standard biomarker definitions';

COMMENT ON COLUMN biomarker_results.ocr_confidence IS 'Confidence score from OCR (0-1), null if manually entered';
COMMENT ON COLUMN biomarker_results.status IS 'Calculated status: optimal, borderline, low, high, critical';
COMMENT ON COLUMN lab_uploads.ocr_status IS 'OCR processing status: pending, processing, completed, failed, manual_review';

-- ============================================================================
-- GRANTS (if needed for service role)
-- ============================================================================

-- Grant access to authenticated users (handled by RLS policies)
-- No additional grants needed

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration: 020_lab_snapshot_system.sql
-- Created: 2026-02-05
-- Description: Lab Snapshot Lite - Biomarker tracking with OCR extraction
-- Tables: biomarker_results, lab_uploads, biomarker_definitions
-- Features: RLS policies, auto-status calculation, statistics tracking
-- ============================================================================
-- Recovery Tracking System - Database Schema
-- Migration 021: Recovery Scores (No-Wearable Version)
-- ============================================================================
-- 
-- This migration creates the database schema for the Recovery Score feature.
-- Tracks daily recovery scores based on 3 morning questions:
-- 1. Sleep duration
-- 2. Wake-ups during night
-- 3. Subjective feeling
--
-- ============================================================================

-- ============================================================================
-- TABLE: recovery_scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS recovery_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Overall Score
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level TEXT NOT NULL CHECK (level IN ('poor', 'moderate', 'good', 'excellent')),
    
    -- Score Breakdown
    sleep_hours NUMERIC NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    sleep_quality_score INTEGER CHECK (sleep_quality_score >= 0 AND sleep_quality_score <= 30),
    feeling_score INTEGER CHECK (feeling_score >= 0 AND feeling_score <= 30),
    
    -- Raw Answers
    wake_ups INTEGER CHECK (wake_ups >= 0),
    feeling TEXT CHECK (feeling IN ('exhausted', 'neutral', 'energized')),
    
    -- Recommendations
    recommendations JSONB,
    
    -- Auto-Swap Applied
    tasks_swapped BOOLEAN DEFAULT FALSE,
    swap_count INTEGER DEFAULT 0,
    swap_details JSONB,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_recovery_scores_user_id ON recovery_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_recorded_at ON recovery_scores(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_user_date ON recovery_scores(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_level ON recovery_scores(level);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_score ON recovery_scores(score);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recovery scores"
    ON recovery_scores FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery scores"
    ON recovery_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery scores"
    ON recovery_scores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recovery scores"
    ON recovery_scores FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get today's recovery score
CREATE OR REPLACE FUNCTION get_today_recovery_score(p_user_id UUID)
RETURNS TABLE (
    score INTEGER,
    level TEXT,
    sleep_hours NUMERIC,
    feeling TEXT,
    recorded_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.score,
        rs.level,
        rs.sleep_hours,
        rs.feeling,
        rs.recorded_at
    FROM recovery_scores rs
    WHERE rs.user_id = p_user_id
    AND rs.recorded_at >= CURRENT_DATE
    ORDER BY rs.recorded_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate recovery trend
CREATE OR REPLACE FUNCTION calculate_recovery_trend(p_user_id UUID, p_days INTEGER DEFAULT 14)
RETURNS TABLE (
    trend TEXT,
    recent_average NUMERIC,
    previous_average NUMERIC,
    change NUMERIC,
    percent_change NUMERIC
) AS $$
DECLARE
    v_recent_avg NUMERIC;
    v_previous_avg NUMERIC;
    v_change NUMERIC;
    v_percent_change NUMERIC;
    v_trend TEXT;
BEGIN
    -- Calculate recent average (last 7 days)
    SELECT AVG(score) INTO v_recent_avg
    FROM recovery_scores
    WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE - INTERVAL '7 days'
    AND recorded_at < CURRENT_DATE;
    
    -- Calculate previous average (days 8-14)
    SELECT AVG(score) INTO v_previous_avg
    FROM recovery_scores
    WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE - INTERVAL '14 days'
    AND recorded_at < CURRENT_DATE - INTERVAL '7 days';
    
    -- If not enough data
    IF v_recent_avg IS NULL OR v_previous_avg IS NULL THEN
        RETURN QUERY SELECT 
            'insufficient_data'::TEXT,
            v_recent_avg,
            v_previous_avg,
            0::NUMERIC,
            0::NUMERIC;
        RETURN;
    END IF;
    
    -- Calculate change
    v_change := v_recent_avg - v_previous_avg;
    v_percent_change := (v_change / v_previous_avg) * 100;
    
    -- Determine trend
    IF v_percent_change > 5 THEN
        v_trend := 'improving';
    ELSIF v_percent_change < -5 THEN
        v_trend := 'declining';
    ELSE
        v_trend := 'stable';
    END IF;
    
    RETURN QUERY SELECT 
        v_trend,
        ROUND(v_recent_avg, 1),
        ROUND(v_previous_avg, 1),
        ROUND(v_change, 1),
        ROUND(v_percent_change, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recovery statistics
CREATE OR REPLACE FUNCTION get_recovery_statistics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_entries INTEGER,
    average_score NUMERIC,
    best_score INTEGER,
    worst_score INTEGER,
    poor_days INTEGER,
    moderate_days INTEGER,
    good_days INTEGER,
    excellent_days INTEGER,
    average_sleep_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER AS total_entries,
        ROUND(AVG(score), 1) AS average_score,
        MAX(score) AS best_score,
        MIN(score) AS worst_score,
        COUNT(*) FILTER (WHERE level = 'poor')::INTEGER AS poor_days,
        COUNT(*) FILTER (WHERE level = 'moderate')::INTEGER AS moderate_days,
        COUNT(*) FILTER (WHERE level = 'good')::INTEGER AS good_days,
        COUNT(*) FILTER (WHERE level = 'excellent')::INTEGER AS excellent_days,
        ROUND(AVG(sleep_hours), 1) AS average_sleep_hours
    FROM recovery_scores
    WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recovery_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recovery_scores_updated_at_trigger
    BEFORE UPDATE ON recovery_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_scores_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Latest recovery scores (last 30 days)
CREATE OR REPLACE VIEW recent_recovery_scores AS
SELECT 
    id,
    user_id,
    score,
    level,
    sleep_hours,
    wake_ups,
    feeling,
    tasks_swapped,
    swap_count,
    recorded_at::DATE AS date,
    recorded_at
FROM recovery_scores
WHERE recorded_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY recorded_at DESC;

-- View: Recovery score summary by user
CREATE OR REPLACE VIEW recovery_score_summary AS
SELECT 
    user_id,
    COUNT(*) AS total_entries,
    ROUND(AVG(score), 1) AS average_score,
    MAX(score) AS best_score,
    MIN(score) AS worst_score,
    ROUND(AVG(sleep_hours), 1) AS average_sleep_hours,
    COUNT(*) FILTER (WHERE level = 'poor') AS poor_days,
    COUNT(*) FILTER (WHERE level = 'moderate') AS moderate_days,
    COUNT(*) FILTER (WHERE level = 'good') AS good_days,
    COUNT(*) FILTER (WHERE level = 'excellent') AS excellent_days,
    MAX(recorded_at) AS last_entry
FROM recovery_scores
WHERE recorded_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- NOTE: One recovery score per user per day is enforced in application code
-- PostgreSQL doesn't allow DATE() or ::DATE in unique indexes (not IMMUTABLE)
-- Alternative: Check for existing score before insert in the application

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE recovery_scores IS 'Daily recovery scores based on 3-question morning check-in';
COMMENT ON COLUMN recovery_scores.score IS 'Overall recovery score (0-100)';
COMMENT ON COLUMN recovery_scores.level IS 'Recovery level: poor, moderate, good, excellent';
COMMENT ON COLUMN recovery_scores.sleep_hours IS 'Hours slept (from user input)';
COMMENT ON COLUMN recovery_scores.wake_ups IS 'Number of times woken up during night';
COMMENT ON COLUMN recovery_scores.feeling IS 'Subjective feeling: exhausted, neutral, energized';
COMMENT ON COLUMN recovery_scores.tasks_swapped IS 'Whether auto-swap was applied (HIIT → Yoga Nidra)';
COMMENT ON COLUMN recovery_scores.swap_count IS 'Number of tasks swapped due to poor recovery';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO recovery_scores (user_id, score, level, sleep_hours, sleep_quality_score, feeling_score, wake_ups, feeling, recorded_at)
VALUES 
    (auth.uid(), 85, 'excellent', 8.0, 30, 30, 0, 'energized', NOW() - INTERVAL '1 day'),
    (auth.uid(), 72, 'good', 7.5, 15, 25, 1, 'energized', NOW() - INTERVAL '2 days'),
    (auth.uid(), 45, 'poor', 5.5, 0, 15, 4, 'exhausted', NOW() - INTERVAL '3 days'),
    (auth.uid(), 68, 'moderate', 7.0, 15, 20, 2, 'neutral', NOW() - INTERVAL '4 days');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration: 021_recovery_tracking.sql
-- Created: 2026-02-05
-- Description: Recovery Score tracking with 3-question morning check-in
-- Tables: recovery_scores
-- Features: RLS policies, trend analysis, statistics functions, auto-swap tracking
-- Rollback + Clean Migration: recovery_scores table
-- Date: 2026-02-05
-- Purpose: Drop existing table and recreate with correct schema

-- Step 1: Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS recovery_scores CASCADE;
DROP FUNCTION IF EXISTS update_recovery_scores_updated_at CASCADE;

-- Step 2: Create recovery_scores table with correct schema
CREATE TABLE recovery_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Recovery Score Data
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level TEXT NOT NULL CHECK (level IN ('poor', 'moderate', 'good', 'excellent')),
    
    -- Breakdown
    sleep_hours INTEGER NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 40),
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 0 AND sleep_quality <= 30),
    feeling INTEGER NOT NULL CHECK (feeling >= 0 AND feeling <= 30),
    
    -- Recommendations (JSONB for flexibility)
    recommendations JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_date UNIQUE (user_id, check_in_date)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_recovery_scores_user_id ON recovery_scores(user_id);
CREATE INDEX idx_recovery_scores_recorded_at ON recovery_scores(recorded_at DESC);
CREATE INDEX idx_recovery_scores_user_date ON recovery_scores(user_id, check_in_date);

-- Step 4: Enable Row Level Security
ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
-- Users can only see their own recovery scores
CREATE POLICY "Users can view own recovery scores"
    ON recovery_scores
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own recovery scores
CREATE POLICY "Users can insert own recovery scores"
    ON recovery_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own recovery scores (same day only)
CREATE POLICY "Users can update own recovery scores"
    ON recovery_scores
    FOR UPDATE
    USING (auth.uid() = user_id AND check_in_date = CURRENT_DATE);

-- Users can delete their own recovery scores
CREATE POLICY "Users can delete own recovery scores"
    ON recovery_scores
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_recovery_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recovery_scores_updated_at
    BEFORE UPDATE ON recovery_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_scores_updated_at();

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON recovery_scores TO authenticated;

-- Step 8: Add comments
COMMENT ON TABLE recovery_scores IS 'Daily morning check-in recovery scores for users';
COMMENT ON COLUMN recovery_scores.score IS 'Total recovery score (0-100)';
COMMENT ON COLUMN recovery_scores.level IS 'Recovery level: poor, moderate, good, excellent';
COMMENT ON COLUMN recovery_scores.sleep_hours IS 'Sleep duration score (0-40 points)';
COMMENT ON COLUMN recovery_scores.sleep_quality IS 'Sleep quality score based on wake-ups (0-30 points)';
COMMENT ON COLUMN recovery_scores.feeling IS 'Subjective feeling score (0-30 points)';
COMMENT ON COLUMN recovery_scores.recommendations IS 'Personalized recommendations (JSONB array)';
COMMENT ON COLUMN recovery_scores.check_in_date IS 'Date of check-in (YYYY-MM-DD)';
COMMENT ON COLUMN recovery_scores.recorded_at IS 'Timestamp when check-in was recorded';
-- Migration: 023_lab_results_schema.sql
-- Description: Creates tables for lab results and biomarkers, plus storage bucket.

-- 1. Create a private storage bucket for lab reports (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the lab_results table (Robust: Create if missing, then ensure columns exist)
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist (idempotent for re-runs on existing tables)
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS test_date DATE;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add check constraint if not exists (Postgres doesn't support IF NOT EXISTS for constraints easily in one line, so we DROP first to be safe or ignore)
DO $$ BEGIN
    ALTER TABLE public.lab_results DROP CONSTRAINT IF EXISTS lab_results_status_check;
    ALTER TABLE public.lab_results ADD CONSTRAINT lab_results_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- 3. Create the biomarkers table (The individual data points)
CREATE TABLE IF NOT EXISTS public.biomarkers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id UUID REFERENCES public.lab_results(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Denormalized for performance
    name TEXT NOT NULL,          -- e.g., 'Vitamin D, 25-Hydroxy'
    slug TEXT NOT NULL,          -- e.g., 'vitamin_d_25_oh' (for trend matching)
    value NUMERIC NOT NULL,      -- e.g., 45.5
    unit TEXT,                   -- e.g., 'ng/mL'
    ref_range_low NUMERIC,       -- e.g., 30.0
    ref_range_high NUMERIC,      -- e.g., 100.0
    category TEXT,               -- e.g., 'Vitamins', 'Lipids', 'Hormones'
    is_out_of_range BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Indexes for Dashboard Performance
CREATE INDEX IF NOT EXISTS idx_lab_results_user_id ON public.lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_date ON public.lab_results(test_date);
CREATE INDEX IF NOT EXISTS idx_biomarkers_user_id ON public.biomarkers(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_result_id ON public.biomarkers(result_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_slug ON public.biomarkers(slug); -- Critical for "Show me Vitamin D history"

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies for lab_results
DROP POLICY IF EXISTS "Users can view own lab results" ON public.lab_results;
CREATE POLICY "Users can view own lab results" 
    ON public.lab_results FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lab results" ON public.lab_results;
CREATE POLICY "Users can insert own lab results" 
    ON public.lab_results FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lab results" ON public.lab_results;
CREATE POLICY "Users can update own lab results" 
    ON public.lab_results FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lab results" ON public.lab_results;
CREATE POLICY "Users can delete own lab results" 
    ON public.lab_results FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Define RLS Policies for biomarkers
DROP POLICY IF EXISTS "Users can view own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can view own biomarkers" 
    ON public.biomarkers FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can insert own biomarkers" 
    ON public.biomarkers FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can update own biomarkers" 
    ON public.biomarkers FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can delete own biomarkers" 
    ON public.biomarkers FOR DELETE 
    USING (auth.uid() = user_id);

-- 8. Storage Policies (User isolation: 'lab-reports/USER_ID/*')
DROP POLICY IF EXISTS "Users can upload own lab reports" ON storage.objects;
CREATE POLICY "Users can upload own lab reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lab-reports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own lab reports" ON storage.objects;
CREATE POLICY "Users can view own lab reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'lab-reports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own lab reports" ON storage.objects;
CREATE POLICY "Users can delete own lab reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'lab-reports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
-- Migration 024: Fix column mismatch (lab_date vs test_date)
-- Description: Ensures we strictly use 'test_date' and removes 'lab_date' if it exists.

DO $$
BEGIN
    -- 1. If 'lab_date' exists, we need to handle it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'lab_date') THEN
        
        -- If 'test_date' does NOT exist, just rename 'lab_date' -> 'test_date'
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'test_date') THEN
            ALTER TABLE public.lab_results RENAME COLUMN lab_date TO test_date;
        
        ELSE
            -- Both exist. 'lab_date' might have the NOT NULL constraint causing issues.
            -- Copy data if needed
            UPDATE public.lab_results SET test_date = lab_date WHERE test_date IS NULL;
            
            -- Drop the problematic column
            ALTER TABLE public.lab_results DROP COLUMN lab_date;
        END IF;
    END IF;
END $$;

-- 2. Make sure 'test_date' is definitely there
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS test_date DATE;

-- 3. Ensure 'test_date' is NOT NULL (since our logic relies on it being set, usually to current date on upload)
-- Recalculate nulls first to avoid errors
UPDATE public.lab_results SET test_date = CURRENT_DATE WHERE test_date IS NULL;
ALTER TABLE public.lab_results ALTER COLUMN test_date SET NOT NULL;
-- ============================================================================
-- ExtensioVitae: Migration 025 - Pre-Migration Cleanup
-- Purpose: Drop/rename conflicting tables before applying 025_integrated_systems
-- Date: 2026-02-06
-- ============================================================================

-- This migration prepares the database for the new partitioned tables
-- by backing up and dropping existing non-partitioned versions

BEGIN;

-- ============================================================================
-- BACKUP EXISTING DATA (Optional - comment out if not needed)
-- ============================================================================

-- Backup task_completions to a temporary table
CREATE TABLE IF NOT EXISTS task_completions_backup_20260206 AS
SELECT * FROM task_completions;

COMMENT ON TABLE task_completions_backup_20260206 IS 'Backup of task_completions before migration 025 (2026-02-06)';

-- ============================================================================
-- DROP CONFLICTING TABLES
-- ============================================================================

-- Drop task_completions (will be recreated as partitioned table)
DROP TABLE IF EXISTS task_completions CASCADE;

-- Drop tasks if it exists (will be recreated with new schema)
DROP TABLE IF EXISTS tasks CASCADE;

-- Drop wearable tables if they exist
DROP TABLE IF EXISTS wearable_data CASCADE;
DROP TABLE IF EXISTS wearable_connections CASCADE;

-- Drop recovery tables if they exist
DROP TABLE IF EXISTS recovery_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_recovery_baseline CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Pre-migration cleanup completed';
  RAISE NOTICE 'Dropped tables: tasks, task_completions, wearable_connections, wearable_data, recovery_metrics';
  RAISE NOTICE 'Backup created: task_completions_backup_20260206';
  RAISE NOTICE 'Ready to apply migration 025_integrated_systems.sql';
END $$;

COMMIT;
-- ============================================================================
-- ExtensioVitae: Integrated Systems Migration
-- Task Management + Recovery Tracking + Wearable Integration
-- Version: 1.0
-- Date: 2026-02-06
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: tasks
-- Purpose: Master list of user's recurring or one-time tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'exercise',
    'nutrition',
    'supplements',
    'recovery',
    'cognitive',
    'social',
    'custom'
  )),

  -- Difficulty & scheduling
  base_difficulty INTEGER DEFAULT 5 CHECK (base_difficulty BETWEEN 1 AND 10),
  duration_minutes INTEGER,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  optimal_time_of_day TEXT[], -- e.g. ['morning', 'afternoon']

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {type: 'daily' | 'weekly', days: [0,1,2,3,4,5,6]}

  -- Streak tracking (denormalized for performance)
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  total_completions INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_user_active
  ON tasks(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tasks_category
  ON tasks(category);

CREATE INDEX IF NOT EXISTS idx_tasks_user_last_completed
  ON tasks(user_id, last_completed_at DESC NULLS LAST);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: task_completions (Partitioned)
-- Purpose: Historical record of every task completion (append-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Completion details
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_actual_minutes INTEGER,
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 10),
  notes TEXT,

  -- Context at completion
  recovery_score_at_completion INTEGER,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (id, completed_at)
) PARTITION BY RANGE (completed_at);

-- Create partitions for 2026 (extend as needed)
CREATE TABLE IF NOT EXISTS task_completions_2026_01 PARTITION OF task_completions
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_02 PARTITION OF task_completions
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_03 PARTITION OF task_completions
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_04 PARTITION OF task_completions
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_05 PARTITION OF task_completions
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_06 PARTITION OF task_completions
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_07 PARTITION OF task_completions
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_08 PARTITION OF task_completions
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_09 PARTITION OF task_completions
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_10 PARTITION OF task_completions
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_11 PARTITION OF task_completions
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_12 PARTITION OF task_completions
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date
  ON task_completions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_completions_task
  ON task_completions(task_id, completed_at DESC);

-- ============================================================================
-- TABLE: wearable_connections
-- Purpose: Store OAuth tokens and sync status for connected devices
-- ============================================================================

CREATE TABLE IF NOT EXISTS wearable_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Device info
  device_type TEXT NOT NULL CHECK (device_type IN (
    'oura',
    'whoop',
    'apple_health',
    'garmin',
    'fitbit'
  )),
  device_id TEXT, -- Device-specific identifier

  -- OAuth credentials (encrypted at rest via Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync status
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'disconnected')),
  sync_error_message TEXT,
  sync_retry_count INTEGER DEFAULT 0,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false, -- If multiple wearables, which is primary?

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_type) -- One connection per device type per user
);

CREATE INDEX IF NOT EXISTS idx_wearable_connections_user
  ON wearable_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_wearable_connections_status
  ON wearable_connections(sync_status, last_sync_at);

CREATE TRIGGER update_wearable_connections_updated_at BEFORE UPDATE ON wearable_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: wearable_data (Partitioned)
-- Purpose: Raw time-series data from wearables (high-volume, partitioned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wearable_data (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES wearable_connections(id) ON DELETE CASCADE,

  -- Temporal
  measurement_timestamp TIMESTAMPTZ NOT NULL,
  measurement_date DATE NOT NULL, -- For partitioning

  -- Source
  source_device TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'hrv',
    'heart_rate',
    'sleep_stage',
    'activity',
    'temperature',
    'respiratory_rate',
    'readiness',
    'sleep_summary'
  )),

  -- Data payload (flexible JSON for device-specific fields)
  data JSONB NOT NULL,
  /* Example structures:
     HRV: {rmssd: 45, sdnn: 67, lf_hf_ratio: 2.1, samples: 120}
     Sleep Stage: {stage: 'deep', duration_minutes: 87}
     Heart Rate: {bpm: 58, confidence: 'high'}
     Temperature: {celsius: 36.7, deviation: 0.2}
     Sleep Summary: {total_min: 456, deep_min: 102, rem_min: 98, light_min: 234, awake_min: 22, efficiency: 0.95}
  */

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (id, measurement_date),
  UNIQUE(user_id, source_device, measurement_timestamp, data_type, measurement_date) -- Deduplication (includes partition key)
) PARTITION BY RANGE (measurement_date);

-- Create partitions for 2026
CREATE TABLE IF NOT EXISTS wearable_data_2026_01 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_02 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_03 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_04 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_05 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_06 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_07 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_08 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_09 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_10 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_11 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_12 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Indexes for wearable_data
CREATE INDEX IF NOT EXISTS idx_wearable_data_user_date
  ON wearable_data(user_id, measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_wearable_data_type_timestamp
  ON wearable_data(data_type, measurement_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_type_date
  ON wearable_data(user_id, data_type, measurement_date DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_wearable_data_jsonb
  ON wearable_data USING GIN (data);

-- ============================================================================
-- TABLE: recovery_metrics
-- Purpose: Daily aggregated recovery scores (one row per user per day)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recovery_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Core metrics (aggregated from wearable_data)
  hrv_rmssd DECIMAL(6,2), -- ms
  hrv_sdnn DECIMAL(6,2),
  hrv_lf_hf_ratio DECIMAL(5,2),
  rhr_bpm INTEGER, -- Resting heart rate

  -- Sleep (from previous night)
  sleep_total_minutes INTEGER,
  sleep_deep_minutes INTEGER,
  sleep_rem_minutes INTEGER,
  sleep_light_minutes INTEGER,
  sleep_awake_minutes INTEGER,
  sleep_efficiency DECIMAL(4,2), -- 0.00 - 1.00
  time_in_bed_minutes INTEGER,
  sleep_onset_latency_minutes INTEGER, -- Time to fall asleep

  -- Activity
  activity_calories INTEGER,
  steps INTEGER,
  active_minutes INTEGER,

  -- Temperature
  body_temperature_celsius DECIMAL(4,2),
  temperature_deviation DECIMAL(3,2), -- vs baseline

  -- Respiratory
  respiratory_rate DECIMAL(4,1), -- breaths per minute

  -- Calculated scores (0-100)
  recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),
  hrv_score INTEGER CHECK (hrv_score BETWEEN 0 AND 100),
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
  rhr_score INTEGER CHECK (rhr_score BETWEEN 0 AND 100),

  -- Readiness state (derived from recovery_score)
  readiness_state TEXT CHECK (readiness_state IN ('optimal', 'moderate', 'low')),

  -- Baselines (rolling averages for comparison)
  hrv_7day_baseline DECIMAL(6,2),
  rhr_7day_baseline DECIMAL(5,2),
  sleep_7day_baseline DECIMAL(6,2),

  -- Metadata
  data_source TEXT DEFAULT 'wearable', -- 'wearable' or 'manual'
  calculation_version TEXT DEFAULT 'v1.0', -- Track algorithm changes
  notes TEXT, -- User notes about the day

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_recovery_metrics_user_date
  ON recovery_metrics(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_metrics_state
  ON recovery_metrics(readiness_state, date DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_metrics_score
  ON recovery_metrics(recovery_score DESC, date DESC);

CREATE TRIGGER update_recovery_metrics_updated_at BEFORE UPDATE ON recovery_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEW: user_recovery_baseline
-- Purpose: Pre-computed rolling baselines for fast queries
-- Refresh: Nightly via cron (see Edge Function)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_recovery_baseline AS
WITH recent_metrics AS (
  SELECT
    user_id,
    date,
    hrv_rmssd,
    rhr_bpm,
    sleep_total_minutes,
    recovery_score,

    -- Calculate time windows
    CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END AS is_7d,
    CASE WHEN date >= CURRENT_DATE - INTERVAL '14 days' THEN 1 ELSE 0 END AS is_14d,
    CASE WHEN date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END AS is_30d
  FROM recovery_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    AND recovery_score IS NOT NULL
)
SELECT
  user_id,

  -- 7-day rolling averages
  AVG(hrv_rmssd) FILTER (WHERE is_7d = 1) AS hrv_7day_avg,
  STDDEV_POP(hrv_rmssd) FILTER (WHERE is_7d = 1) AS hrv_7day_stddev,
  AVG(rhr_bpm) FILTER (WHERE is_7d = 1) AS rhr_7day_avg,
  AVG(sleep_total_minutes) FILTER (WHERE is_7d = 1) AS sleep_7day_avg,
  AVG(recovery_score) FILTER (WHERE is_7d = 1) AS recovery_7day_avg,

  -- 14-day rolling averages (for Oura-style balance)
  AVG(hrv_rmssd) FILTER (WHERE is_14d = 1) AS hrv_14day_avg,
  AVG(recovery_score) FILTER (WHERE is_14d = 1) AS recovery_14day_avg,

  -- 30-day for long-term trends
  AVG(hrv_rmssd) FILTER (WHERE is_30d = 1) AS hrv_30day_avg,
  STDDEV_POP(hrv_rmssd) FILTER (WHERE is_30d = 1) AS hrv_30day_stddev,
  AVG(recovery_score) FILTER (WHERE is_30d = 1) AS recovery_30day_avg,

  -- Overtraining detection: days with low recovery in last 14 days
  COUNT(*) FILTER (WHERE is_14d = 1 AND recovery_score < 40) AS low_recovery_days_14d,

  -- Trend direction (comparing 7d to 14d)
  CASE
    WHEN AVG(recovery_score) FILTER (WHERE is_7d = 1) > AVG(recovery_score) FILTER (WHERE is_14d = 1) + 5 THEN 'improving'
    WHEN AVG(recovery_score) FILTER (WHERE is_7d = 1) < AVG(recovery_score) FILTER (WHERE is_14d = 1) - 5 THEN 'declining'
    ELSE 'stable'
  END AS recovery_trend,

  MAX(date) AS last_metric_date,
  COUNT(*) FILTER (WHERE is_7d = 1) AS days_with_data_7d,
  COUNT(*) FILTER (WHERE is_30d = 1) AS days_with_data_30d

FROM recent_metrics
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_baseline_user
  ON user_recovery_baseline(user_id);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- Purpose: Ensure users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS tasks_user_isolation ON tasks;
DROP POLICY IF EXISTS task_completions_user_isolation ON task_completions;
DROP POLICY IF EXISTS wearable_connections_user_isolation ON wearable_connections;
DROP POLICY IF EXISTS wearable_data_user_isolation ON wearable_data;
DROP POLICY IF EXISTS recovery_metrics_user_isolation ON recovery_metrics;

-- Create policies: Users can only access their own data
CREATE POLICY tasks_user_isolation ON tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY task_completions_user_isolation ON task_completions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY wearable_connections_user_isolation ON wearable_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY wearable_data_user_isolation ON wearable_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recovery_metrics_user_isolation ON recovery_metrics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS: Business Logic
-- ============================================================================

-- Function: Calculate current streak for a task
-- Uses window functions for performance
CREATE OR REPLACE FUNCTION calculate_task_streak(p_task_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_completed DATE
) AS $$
WITH daily_completions AS (
  SELECT DISTINCT DATE(completed_at) AS completion_date
  FROM task_completions
  WHERE task_id = p_task_id
  ORDER BY completion_date DESC
),
streak_groups AS (
  SELECT
    completion_date,
    completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC))::INTEGER AS streak_group
  FROM daily_completions
),
streak_lengths AS (
  SELECT
    COUNT(*) AS streak_length,
    MIN(completion_date) AS streak_start,
    MAX(completion_date) AS streak_end
  FROM streak_groups
  GROUP BY streak_group
  ORDER BY streak_end DESC
)
SELECT
  CASE
    -- Current streak only counts if it includes today or yesterday (redemption)
    WHEN (SELECT MAX(completion_date) FROM daily_completions) >= CURRENT_DATE - INTERVAL '1 day'
    THEN COALESCE((SELECT streak_length FROM streak_lengths LIMIT 1), 0)
    ELSE 0
  END AS current_streak,
  COALESCE((SELECT MAX(streak_length) FROM streak_lengths), 0) AS longest_streak,
  (SELECT MAX(completion_date) FROM daily_completions) AS last_completed;
$$ LANGUAGE SQL STABLE;

-- Function: Get tasks adjusted for recovery state
-- Returns tasks with difficulty adjusted based on current recovery
CREATE OR REPLACE FUNCTION get_adjusted_tasks(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  category TEXT,
  base_difficulty INTEGER,
  adjusted_difficulty INTEGER,
  duration_minutes INTEGER,
  adjusted_duration INTEGER,
  intensity TEXT,
  suggested_intensity TEXT,
  current_streak INTEGER,
  recommendation TEXT,
  optimal_for_time BOOLEAN
) AS $$
DECLARE
  v_recovery_state TEXT;
  v_intensity_multiplier DECIMAL;
  v_duration_multiplier DECIMAL;
  v_current_hour INTEGER;
BEGIN
  -- Get today's recovery state
  SELECT readiness_state INTO v_recovery_state
  FROM recovery_metrics
  WHERE user_id = p_user_id AND date = p_date;

  -- Default to 'moderate' if no data
  v_recovery_state := COALESCE(v_recovery_state, 'moderate');

  -- Get current hour for time-of-day filtering
  v_current_hour := EXTRACT(HOUR FROM NOW());

  -- Set multipliers based on recovery state
  CASE v_recovery_state
    WHEN 'optimal' THEN
      v_intensity_multiplier := 1.1;
      v_duration_multiplier := 1.0;
    WHEN 'moderate' THEN
      v_intensity_multiplier := 1.0;
      v_duration_multiplier := 0.9;
    WHEN 'low' THEN
      v_intensity_multiplier := 0.7;
      v_duration_multiplier := 0.7;
  END CASE;

  RETURN QUERY
  SELECT
    t.id AS task_id,
    t.title,
    t.category,
    t.base_difficulty,
    LEAST(10, GREATEST(1, ROUND(t.base_difficulty * v_intensity_multiplier)))::INTEGER AS adjusted_difficulty,
    t.duration_minutes,
    ROUND(t.duration_minutes * v_duration_multiplier)::INTEGER AS adjusted_duration,
    t.intensity,
    -- Suggest intensity downgrade if low recovery
    CASE
      WHEN v_recovery_state = 'low' AND t.intensity = 'high' THEN 'low'
      WHEN v_recovery_state = 'low' AND t.intensity = 'medium' THEN 'low'
      WHEN v_recovery_state = 'optimal' AND t.intensity = 'medium' THEN 'high'
      ELSE t.intensity
    END AS suggested_intensity,
    t.current_streak,
    -- Provide contextual recommendation
    CASE v_recovery_state
      WHEN 'optimal' THEN 'Push your limits today'
      WHEN 'moderate' THEN 'Steady effort, listen to your body'
      WHEN 'low' THEN 'Active recovery focus - prioritize rest'
    END AS recommendation,
    -- Check if task is optimal for current time of day
    CASE
      WHEN t.optimal_time_of_day IS NULL THEN true
      WHEN v_current_hour BETWEEN 6 AND 10 AND 'morning' = ANY(t.optimal_time_of_day) THEN true
      WHEN v_current_hour BETWEEN 10 AND 14 AND 'midday' = ANY(t.optimal_time_of_day) THEN true
      WHEN v_current_hour BETWEEN 14 AND 18 AND 'afternoon' = ANY(t.optimal_time_of_day) THEN true
      WHEN v_current_hour BETWEEN 18 AND 22 AND 'evening' = ANY(t.optimal_time_of_day) THEN true
      ELSE false
    END AS optimal_for_time
  FROM tasks t
  WHERE t.user_id = p_user_id
    AND t.is_active = true
    AND t.id NOT IN (
      -- Exclude already completed today
      SELECT task_id
      FROM task_completions
      WHERE user_id = p_user_id
        AND DATE(completed_at) = p_date
    )
  ORDER BY
    -- Prioritize: (1) Active streaks, (2) Optimal timing, (3) Category
    t.current_streak DESC,
    optimal_for_time DESC,
    t.category;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Trigger to update task streak on completion
CREATE OR REPLACE FUNCTION update_task_streak_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_data RECORD;
BEGIN
  -- Calculate new streak
  SELECT * INTO v_streak_data
  FROM calculate_task_streak(NEW.task_id);

  -- Update tasks table
  UPDATE tasks
  SET
    current_streak = v_streak_data.current_streak,
    longest_streak = GREATEST(longest_streak, v_streak_data.current_streak),
    last_completed_at = NEW.completed_at,
    total_completions = total_completions + 1,
    updated_at = NOW()
  WHERE id = NEW.task_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_streak_on_completion
  AFTER INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_task_streak_on_completion();

-- ============================================================================
-- SEED DATA (Optional - for development/testing)
-- ============================================================================

-- Example: Insert sample task categories for new users
-- (This would typically be done via application code, not migration)

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE tasks IS 'Master list of user tasks with streak tracking';
COMMENT ON TABLE task_completions IS 'Historical append-only log of task completions, partitioned by month';
COMMENT ON TABLE wearable_connections IS 'OAuth connections to wearable devices (Oura, Whoop, Apple Health, etc.)';
COMMENT ON TABLE wearable_data IS 'Raw time-series data from wearables, partitioned by date for performance';
COMMENT ON TABLE recovery_metrics IS 'Daily aggregated recovery scores calculated from wearable data';
COMMENT ON MATERIALIZED VIEW user_recovery_baseline IS 'Pre-computed rolling baselines (7d, 14d, 30d) for fast recovery comparisons';

COMMENT ON FUNCTION calculate_task_streak IS 'Calculate current and longest streak for a given task using window functions';
COMMENT ON FUNCTION get_adjusted_tasks IS 'Get user tasks with difficulty/duration adjusted based on recovery state and time of day';
COMMENT ON FUNCTION update_task_streak_on_completion IS 'Trigger function to automatically update task streaks on completion';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'ExtensioVitae Integrated Systems migration completed successfully';
  RAISE NOTICE 'Tables created: tasks, task_completions, wearable_connections, wearable_data, recovery_metrics';
  RAISE NOTICE 'Materialized view created: user_recovery_baseline';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'Business logic functions created for streak calculation and task adjustment';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy Edge Functions for wearable sync';
  RAISE NOTICE '  2. Set up nightly cron to refresh user_recovery_baseline materialized view';
  RAISE NOTICE '  3. Implement frontend services and React components';
END $$;
