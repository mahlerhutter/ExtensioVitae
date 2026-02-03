-- Debug: Check what's actually in the database
-- Run this in Supabase SQL Editor to see the actual table structures

-- Check intake_responses structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'intake_responses'
ORDER BY ordinal_position;

-- Check plans structure  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- Check daily_progress structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'daily_progress'
ORDER BY ordinal_position;

-- Check feedback structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Check if tables exist at all
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('intake_responses', 'plans', 'daily_progress', 'feedback', 'user_profiles', 'health_profiles')
ORDER BY table_name;
