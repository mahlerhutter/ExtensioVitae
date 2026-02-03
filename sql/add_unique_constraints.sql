-- Fix: Add missing constraints and indexes
-- Run this in Supabase SQL Editor

-- =============================================
-- INTAKE_RESPONSES - Add unique constraint on user_id
-- =============================================
-- Drop existing constraint if it exists
ALTER TABLE intake_responses DROP CONSTRAINT IF EXISTS intake_responses_user_id_key;

-- Add unique constraint (for upsert with on_conflict)
ALTER TABLE intake_responses ADD CONSTRAINT intake_responses_user_id_key UNIQUE (user_id);

-- =============================================
-- USER_PROFILES - Ensure unique constraint exists
-- =============================================
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- =============================================
-- HEALTH_PROFILES - Ensure unique constraint exists
-- =============================================
ALTER TABLE health_profiles DROP CONSTRAINT IF EXISTS health_profiles_user_id_key;
ALTER TABLE health_profiles ADD CONSTRAINT health_profiles_user_id_key UNIQUE (user_id);

-- =============================================
-- DAILY_PROGRESS - Add composite unique constraint
-- =============================================
ALTER TABLE daily_progress DROP CONSTRAINT IF EXISTS daily_progress_plan_day_key;
ALTER TABLE daily_progress ADD CONSTRAINT daily_progress_plan_day_key UNIQUE (plan_id, day_number);

SELECT 'Constraints added successfully!' as status;
