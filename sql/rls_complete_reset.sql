-- NUCLEAR OPTION: Complete RLS Reset for All Tables
-- This allows authenticated users to do everything
-- Admin check happens in frontend
-- Run this in Supabase SQL Editor

-- =============================================
-- INTAKE_RESPONSES
-- =============================================
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own intake" ON intake_responses;
DROP POLICY IF EXISTS "Users can view own intake" ON intake_responses;
DROP POLICY IF EXISTS "Users can update own intake" ON intake_responses;
DROP POLICY IF EXISTS "Authenticated users can view all intake" ON intake_responses;

-- Allow users to manage their own intake
CREATE POLICY "Users can manage own intake"
  ON intake_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow all authenticated users to view all (for admin)
CREATE POLICY "Authenticated can view all intake"
  ON intake_responses
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- PLANS
-- =============================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plans" ON plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
DROP POLICY IF EXISTS "Users can update own plans" ON plans;
DROP POLICY IF EXISTS "Authenticated users can view all plans" ON plans;
DROP POLICY IF EXISTS "Authenticated users can delete any plan" ON plans;

-- Allow users to manage their own plans
CREATE POLICY "Users can manage own plans"
  ON plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow all authenticated users to view/delete all (for admin)
CREATE POLICY "Authenticated can view all plans"
  ON plans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete any plan"
  ON plans
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- DAILY_PROGRESS
-- =============================================
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON daily_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON daily_progress;
DROP POLICY IF EXISTS "Authenticated users can view all progress" ON daily_progress;
DROP POLICY IF EXISTS "Authenticated users can delete any progress" ON daily_progress;

-- Allow users to manage their own progress
CREATE POLICY "Users can manage own progress"
  ON daily_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = daily_progress.plan_id
      AND plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = daily_progress.plan_id
      AND plans.user_id = auth.uid()
    )
  );

-- Allow all authenticated users to view/delete all (for admin)
CREATE POLICY "Authenticated can view all progress"
  ON daily_progress
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete any progress"
  ON daily_progress
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- FEEDBACK
-- =============================================
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON feedback;

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- All authenticated users can view all feedback
CREATE POLICY "Authenticated can view all feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can update feedback (for admin)
CREATE POLICY "Authenticated can update feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (true);

-- =============================================
-- USER_PROFILES
-- =============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;

-- Users can manage their own profile
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- All authenticated users can view all profiles (for admin)
CREATE POLICY "Authenticated can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- HEALTH_PROFILES
-- =============================================
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own health profile" ON health_profiles;
DROP POLICY IF EXISTS "Users can update own health profile" ON health_profiles;

-- Users can manage their own health profile
CREATE POLICY "Users can manage own health profile"
  ON health_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'Policies created successfully!' as status;
