-- =====================================================
-- ExtensioVitae - Complete Database Setup
-- =====================================================
-- Version: 2.1.2
-- Date: 2026-02-04
-- Purpose: Fresh Supabase database initialization
-- Note: Admin policies use auth.jwt() to avoid recursion
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. TABLES
-- =====================================================

-- -----------------------------------------------------
-- 2.1 User Profiles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    language TEXT DEFAULT 'de',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Notification preferences (JSON)
    notification_preferences JSONB DEFAULT '{"email": true, "telegram": false, "sms": false}'::jsonb,
    telegram_connected BOOLEAN DEFAULT false,
    telegram_chat_id TEXT,
    
    CONSTRAINT valid_language CHECK (language IN ('de', 'en'))
);

COMMENT ON TABLE user_profiles IS 'User profile data and preferences';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'Stores Email, Telegram, SMS preferences as JSON';

-- -----------------------------------------------------
-- 2.2 Intake Responses
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS intake_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Info
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    
    -- Goals & Lifestyle
    primary_goal TEXT NOT NULL,
    daily_time_budget INTEGER NOT NULL,
    sleep_hours_bucket TEXT NOT NULL,
    stress_1_10 INTEGER NOT NULL,
    training_frequency TEXT NOT NULL,
    equipment_access TEXT NOT NULL,
    
    -- Diet & Health
    diet_pattern JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_age CHECK (age >= 18 AND age <= 120),
    CONSTRAINT valid_stress CHECK (stress_1_10 >= 1 AND stress_1_10 <= 10),
    CONSTRAINT valid_time_budget CHECK (daily_time_budget >= 5 AND daily_time_budget <= 120)
);

COMMENT ON TABLE intake_responses IS 'User questionnaire responses for plan generation';

-- -----------------------------------------------------
-- 2.3 Health Profiles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Lifestyle
    is_smoker BOOLEAN DEFAULT false,
    smoking_frequency TEXT DEFAULT 'never',
    alcohol_frequency TEXT DEFAULT 'rarely',
    
    -- Medical
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    injuries_limitations JSONB DEFAULT '[]'::jsonb,
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    
    -- Women's Health
    menopause_status TEXT DEFAULT 'not_applicable',
    
    -- Medications
    takes_medications BOOLEAN DEFAULT false,
    medication_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_smoking CHECK (smoking_frequency IN ('never', 'former', 'occasional', 'daily')),
    CONSTRAINT valid_alcohol CHECK (alcohol_frequency IN ('never', 'rarely', 'weekly', 'daily')),
    CONSTRAINT valid_menopause CHECK (menopause_status IN ('not_applicable', 'pre', 'peri', 'post'))
);

COMMENT ON TABLE health_profiles IS 'Extended health information for personalized plan constraints';

-- -----------------------------------------------------
-- 2.4 Plans
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    intake_id UUID REFERENCES intake_responses(id) ON DELETE SET NULL,
    
    -- Plan Metadata
    user_name TEXT NOT NULL,
    plan_summary TEXT,
    primary_focus_pillars JSONB DEFAULT '[]'::jsonb,
    
    -- Plan Data (Full 30-day structure)
    plan_data JSONB NOT NULL,
    
    -- Generation Info
    generation_method TEXT DEFAULT 'algorithm',
    llm_provider TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Plan Lifecycle
    status TEXT DEFAULT 'active',
    start_date DATE DEFAULT CURRENT_DATE,
    current_day INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'inactive', 'cancelled', 'paused')),
    CONSTRAINT valid_generation_method CHECK (generation_method IN ('algorithm', 'llm', 'llm-proxy', 'hybrid')),
    CONSTRAINT valid_current_day CHECK (current_day >= 1 AND current_day <= 30)
);

COMMENT ON TABLE plans IS '30-day longevity plans generated for users';
COMMENT ON COLUMN plans.plan_data IS 'Full plan structure with days and tasks as JSON';

-- -----------------------------------------------------
-- 2.5 Daily Progress
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    day INTEGER NOT NULL,
    task_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_day CHECK (day >= 1 AND day <= 30),
    UNIQUE(plan_id, day, task_id)
);

COMMENT ON TABLE daily_progress IS 'Task completion tracking for each plan day';

-- -----------------------------------------------------
-- 2.6 Plan Snapshots
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
    
    snapshot_data JSONB NOT NULL,
    snapshot_type TEXT DEFAULT 'renewal',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_snapshot_type CHECK (snapshot_type IN ('creation', 'renewal', 'completion', 'manual'))
);

COMMENT ON TABLE plan_snapshots IS 'Historical snapshots of plans for tracking changes over time';

-- -----------------------------------------------------
-- 2.7 Feedback
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    
    feedback_type TEXT NOT NULL,
    rating INTEGER,
    comment TEXT,
    context JSONB,
    
    reviewed BOOLEAN DEFAULT false,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('initial_plan', 'general', 'task_micro', 'bug_report', 'feature_request')),
    CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

COMMENT ON TABLE feedback IS 'User feedback on plans, tasks, and general experience';

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- User Profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Intake Responses
CREATE INDEX idx_intake_user_id ON intake_responses(user_id);
CREATE INDEX idx_intake_submitted_at ON intake_responses(submitted_at DESC);

-- Health Profiles
CREATE INDEX idx_health_profiles_user_id ON health_profiles(user_id);

-- Plans
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plans_created_at ON plans(created_at DESC);
CREATE INDEX idx_plans_user_status ON plans(user_id, status);

-- Daily Progress
CREATE INDEX idx_progress_plan_id ON daily_progress(plan_id);
CREATE INDEX idx_progress_user_id ON daily_progress(user_id);
CREATE INDEX idx_progress_plan_day ON daily_progress(plan_id, day);

-- Plan Snapshots
CREATE INDEX idx_snapshots_user_id ON plan_snapshots(user_id);
CREATE INDEX idx_snapshots_plan_id ON plan_snapshots(plan_id);
CREATE INDEX idx_snapshots_created_at ON plan_snapshots(created_at DESC);

-- Feedback
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_plan_id ON feedback(plan_id);
CREATE INDEX idx_feedback_reviewed ON feedback(reviewed);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);

-- =====================================================
-- 4. ADMIN CONFIGURATION TABLE
-- =====================================================
-- IMPORTANT: Must be created BEFORE RLS policies that reference it

-- Create admin config table
CREATE TABLE IF NOT EXISTS admin_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin emails (CHANGE THIS!)
INSERT INTO admin_config (key, value)
VALUES ('admin_emails', '["admin@extensiovitae.com"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create index for admin_config
CREATE INDEX idx_admin_config_key ON admin_config(key);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 5.1 User Profiles Policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all profiles (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- -----------------------------------------------------
-- 4.2 Intake Responses Policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own intake" ON intake_responses;
CREATE POLICY "Users can view own intake" ON intake_responses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own intake" ON intake_responses;
CREATE POLICY "Users can insert own intake" ON intake_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own intake" ON intake_responses;
CREATE POLICY "Users can update own intake" ON intake_responses
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all intake responses (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view all intake" ON intake_responses;
CREATE POLICY "Admins can view all intake" ON intake_responses
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- -----------------------------------------------------
-- 4.3 Health Profiles Policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own health profile" ON health_profiles;
CREATE POLICY "Users can view own health profile" ON health_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own health profile" ON health_profiles;
CREATE POLICY "Users can insert own health profile" ON health_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own health profile" ON health_profiles;
CREATE POLICY "Users can update own health profile" ON health_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all health profiles (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view all health profiles" ON health_profiles;
CREATE POLICY "Admins can view all health profiles" ON health_profiles
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- -----------------------------------------------------
-- 4.4 Plans Policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own plans" ON plans;
CREATE POLICY "Users can view own plans" ON plans
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plans" ON plans;
CREATE POLICY "Users can insert own plans" ON plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON plans;
CREATE POLICY "Users can update own plans" ON plans
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plans" ON plans;
CREATE POLICY "Users can delete own plans" ON plans
    FOR DELETE USING (auth.uid() = user_id);

-- Admin can view all plans (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view all plans" ON plans;
CREATE POLICY "Admins can view all plans" ON plans
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- Admin can delete any plan (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can delete any plan" ON plans;
CREATE POLICY "Admins can delete any plan" ON plans
    FOR DELETE USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- -----------------------------------------------------
-- 4.5 Daily Progress Policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own progress" ON daily_progress;
CREATE POLICY "Users can view own progress" ON daily_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON daily_progress;
CREATE POLICY "Users can insert own progress" ON daily_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON daily_progress;
CREATE POLICY "Users can update own progress" ON daily_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all progress (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view all progress" ON daily_progress;
CREATE POLICY "Admins can view all progress" ON daily_progress
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- -----------------------------------------------------
-- 4.6 Plan Snapshots Policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own snapshots" ON plan_snapshots;
CREATE POLICY "Users can view own snapshots" ON plan_snapshots
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own snapshots" ON plan_snapshots;
CREATE POLICY "Users can insert own snapshots" ON plan_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can view all snapshots (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view all snapshots" ON plan_snapshots;
CREATE POLICY "Admins can view all snapshots" ON plan_snapshots
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- -----------------------------------------------------
-- 4.7 Feedback Policies
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert feedback" ON feedback;
CREATE POLICY "Users can insert feedback" ON feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can view all feedback (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
CREATE POLICY "Admins can view all feedback" ON feedback
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- Admin can update feedback (mark as reviewed, using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;
CREATE POLICY "Admins can update feedback" ON feedback
    FOR UPDATE USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 5.1 Update Timestamp Trigger Function
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_profiles_updated_at ON health_profiles;
CREATE TRIGGER update_health_profiles_updated_at
    BEFORE UPDATE ON health_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_progress_updated_at ON daily_progress;
CREATE TRIGGER update_daily_progress_updated_at
    BEFORE UPDATE ON daily_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 5.2 Auto-create User Profile on Signup
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 7. ADMIN HELPER FUNCTIONS
-- =====================================================

-- Only admins can read config (using jwt to avoid recursion)
DROP POLICY IF EXISTS "Admins can view config" ON admin_config;
CREATE POLICY "Admins can view config" ON admin_config
    FOR SELECT USING (
        auth.jwt() ->> 'email' IN (
            SELECT jsonb_array_elements_text(value)
            FROM admin_config
            WHERE key = 'admin_emails'
        )
    );

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_config
        WHERE key = 'admin_emails'
        AND value ? check_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check triggers
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Update admin_config table with your admin email (line 271)
-- 2. Deploy Edge Functions (generate-plan-proxy)
-- 3. Update .env.local with new Supabase credentials
-- =====================================================

