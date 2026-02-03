-- Simple Check: Do the tables exist?
-- Run this in Supabase SQL Editor

SELECT 
    t.table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN ('user_profiles', 'intake_responses', 'health_profiles', 'plans', 'daily_progress', 'feedback')
ORDER BY t.table_name;

-- If any table is missing, you need to run: sql/complete_database_setup.sql
