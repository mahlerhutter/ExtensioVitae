-- TEMPORARY: Disable RLS Completely for Testing
-- WARNING: This removes all security! Only for debugging!
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables
ALTER TABLE intake_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS DISABLED - All tables are now open!' as status;

-- To re-enable later, run:
-- ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
