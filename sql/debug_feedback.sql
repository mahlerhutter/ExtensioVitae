-- Debug: Check Feedback Table Status
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'feedback'
) as table_exists;

-- 2. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'feedback';

-- 3. List all policies on feedback table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'feedback';

-- 4. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- 5. Try to insert test feedback (will show exact error)
-- Note: This will fail if you're not authenticated, but will show the error
-- INSERT INTO feedback (user_id, feedback_type, general_comment)
-- VALUES (auth.uid(), 'general', 'Test feedback');
