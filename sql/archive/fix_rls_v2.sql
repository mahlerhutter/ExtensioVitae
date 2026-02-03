-- =============================================
-- EXTENSIOVITAE RLS FIX (From AUDIT.md)
-- Run this in Supabase SQL Editor to enable RLS
-- =============================================

-- 1. RLS für intake_responses
-- =============================================
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own intake" ON intake_responses;
CREATE POLICY "Users can view own intake" ON intake_responses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own intake" ON intake_responses;
CREATE POLICY "Users can insert own intake" ON intake_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own intake" ON intake_responses;
CREATE POLICY "Users can update own intake" ON intake_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. RLS für plans
-- =============================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plans" ON plans;
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON plans;
CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. RLS für daily_progress
-- =============================================
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;
CREATE POLICY "Users can view own progress" ON daily_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON daily_progress;
CREATE POLICY "Users can insert own progress" ON daily_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON daily_progress;
CREATE POLICY "Users can update own progress" ON daily_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. RLS für user_profiles
-- =============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. RLS für health_profiles
-- =============================================
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own health profile" ON health_profiles;
CREATE POLICY "Users can view own health profile" ON health_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own health profile" ON health_profiles;
CREATE POLICY "Users can insert own health profile" ON health_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own health profile" ON health_profiles;
CREATE POLICY "Users can update own health profile" ON health_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. RLS für feedback (User können eigenes sehen, Admins alles)
-- =============================================
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. RLS für plan_snapshots
-- =============================================
ALTER TABLE plan_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own snapshots" ON plan_snapshots;
CREATE POLICY "Users can view own snapshots" ON plan_snapshots
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own snapshots" ON plan_snapshots;
CREATE POLICY "Users can insert own snapshots" ON plan_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
