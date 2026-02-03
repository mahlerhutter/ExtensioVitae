-- ==============================================================================
-- EXTENSIOVITAE PRODUCTION SETUP SCRIPT (V1)
-- ==============================================================================
-- This script sets up the complete database schema from scratch.
-- It combines the original schema, all migrations (001-008), and latest RLS fixes.
--
-- INSTRUCTIONS:
-- 1. Create a NEW Supabase project (or reset the existing one).
-- 2. Go to the SQL Editor.
-- 3. Run this entire script.
-- ==============================================================================

-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- ==============================================================================

-- Table: user_profiles (From Migration 005)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    name TEXT,
    email TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    
    -- Demographics
    biological_sex TEXT CHECK (biological_sex IN ('male', 'female', 'diverse')),
    birth_date DATE,
    
    -- Preferences
    whatsapp_opt_in BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "whatsapp": false}'::jsonb,
    preferred_language TEXT DEFAULT 'de',
    timezone TEXT DEFAULT 'Europe/Berlin',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: health_profiles (From Migration 005)
CREATE TABLE IF NOT EXISTS health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Table: intake_responses (Legacy/Audit Log)
CREATE TABLE IF NOT EXISTS intake_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User identification
    name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    
    -- Form fields
    age INTEGER,
    sex VARCHAR(10),
    primary_goal VARCHAR(30),
    sleep_hours_bucket VARCHAR(10),
    stress_1_10 INTEGER,
    training_frequency VARCHAR(10),
    diet_pattern TEXT[],
    height_cm INTEGER,
    weight_kg INTEGER,
    daily_time_budget VARCHAR(5),
    equipment_access VARCHAR(10),
    
    -- Metadata
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    intake_id UUID REFERENCES intake_responses(id) ON DELETE SET NULL,
    
    -- Metadata
    user_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    
    -- Content
    plan_summary TEXT NOT NULL,
    primary_focus_pillars TEXT[] NOT NULL,
    plan_data JSONB NOT NULL,
    
    -- Generation info
    generation_method VARCHAR(20) DEFAULT 'algorithm',
    llm_provider VARCHAR(20),
    
    -- Lifecycle
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_day INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled', 'inactive')),
    
    -- Settings
    whatsapp_active BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    preferred_nudge_time TIME DEFAULT '07:00:00',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: daily_progress
CREATE TABLE IF NOT EXISTS daily_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    day_number INTEGER NOT NULL,
    tasks_completed JSONB NOT NULL DEFAULT '{}',
    
    total_tasks INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_tasks > 0 THEN (completed_tasks::DECIMAL / total_tasks * 100) ELSE 0 END
    ) STORED,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_plan_day UNIQUE (plan_id, day_number)
);

-- Table: feedback (From Migration 003)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    
    feedback_type TEXT NOT NULL,
    overall_rating INTEGER,
    task_helpful BOOLEAN,
    
    what_you_like TEXT,
    what_to_improve TEXT,
    general_comment TEXT,
    
    task_id TEXT,
    day_number INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT FALSE,
    admin_notes TEXT
);

-- Table: plan_snapshots (From Migration 005)
CREATE TABLE IF NOT EXISTS plan_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    health_profile_snapshot JSONB NOT NULL,
    primary_goal TEXT,
    
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: whatsapp_messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    phone_number VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    message_type VARCHAR(30) NOT NULL,
    message_content TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: error_logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context_data JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Update Timestamp Function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE OR REPLACE TRIGGER update_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_health_profiles_timestamp BEFORE UPDATE ON health_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_plans_timestamp BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_progress_timestamp BEFORE UPDATE ON daily_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Handle New User (Auto-Create Profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, user_profiles.name),
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Is Admin Helper (Update emails here!)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    admin_emails TEXT[] := ARRAY[
        'manuelmahlerhutter@gmail.com',
        'test-user-db-error@example.com'
    ];
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    RETURN user_email = ANY(admin_emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES (SECURITY)
-- ==============================================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- User Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin Policies
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can view all intake" ON intake_responses FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can view all plans" ON plans FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can view all health profiles" ON health_profiles FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can view all feedback" ON feedback FOR SELECT USING (is_admin_user());
CREATE POLICY "Admins can update all feedback" ON feedback FOR UPDATE USING (is_admin_user());

-- Standard User Policies (Own Data Only)
-- Health Profiles
CREATE POLICY "Users can view own health profile" ON health_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own health profile" ON health_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health profile" ON health_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Plans
CREATE POLICY "Users can view own plans" ON plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON plans FOR UPDATE USING (auth.uid() = user_id);

-- Daily Progress
CREATE POLICY "Users can view own progress" ON daily_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON daily_progress FOR UPDATE USING (auth.uid() = user_id);

-- Intake Responses
CREATE POLICY "Users can view own intake" ON intake_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own intake" ON intake_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback
CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Plan Snapshots
CREATE POLICY "Users can view own snapshots" ON plan_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON plan_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
