-- TEMPORARY: Disable RLS for Testing
-- This will help us identify if RLS is the problem
-- Run this in Supabase SQL Editor

ALTER TABLE intake_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS DISABLED on all tables - Please test now!' as status;

-- After testing, if it works, we know RLS was the problem
-- Then we can re-enable with proper policies
