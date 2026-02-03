-- ============================================
-- EXTENSIOVITAE DATABASE SCHEMA
-- Supabase (PostgreSQL)
-- Updated for Google OAuth + User-based storage
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: user_profiles
-- Stores user profile data (linked to Supabase Auth)
-- ============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile data
    name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    language VARCHAR(10) DEFAULT 'de',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: intake_responses
-- Stores raw intake form submissions
-- ============================================
CREATE TABLE intake_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User identification (legacy: phone-based)
    name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20), -- Now optional for Google Auth users
    
    -- Current form fields (German version)
    age INTEGER CHECK (age >= 18 AND age <= 80),
    sex VARCHAR(10) CHECK (sex IN ('male', 'female')),
    primary_goal VARCHAR(30) NOT NULL CHECK (primary_goal IN ('energy', 'sleep', 'stress', 'fat_loss', 'strength_fitness', 'focus_clarity')),
    sleep_hours_bucket VARCHAR(10) CHECK (sleep_hours_bucket IN ('<6', '6-6.5', '6.5-7', '7-7.5', '7.5-8', '>8')),
    stress_1_10 INTEGER CHECK (stress_1_10 >= 1 AND stress_1_10 <= 10),
    training_frequency VARCHAR(10) CHECK (training_frequency IN ('0', '1-2', '3-4', '5+')),
    diet_pattern TEXT[] DEFAULT '{}',
    height_cm INTEGER CHECK (height_cm >= 130 AND height_cm <= 220),
    weight_kg INTEGER CHECK (weight_kg >= 40 AND weight_kg <= 200),
    daily_time_budget VARCHAR(5) CHECK (daily_time_budget IN ('10', '20', '30')),
    equipment_access VARCHAR(10) CHECK (equipment_access IN ('none', 'basic', 'gym')),
    
    -- Legacy fields (for WhatsApp flow)
    age_range VARCHAR(10),
    wake_time VARCHAR(15),
    exercise_current VARCHAR(15),
    biggest_constraint VARCHAR(20),
    sleep_quality VARCHAR(15),
    stress_level VARCHAR(15),
    diet_preference TEXT[],
    
    -- Consent
    whatsapp_consent BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_intake_user ON intake_responses(user_id);
CREATE INDEX idx_intake_phone ON intake_responses(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX idx_intake_created ON intake_responses(created_at DESC);

-- ============================================
-- TABLE: plans
-- Stores generated 30-day plans
-- ============================================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    intake_id UUID REFERENCES intake_responses(id) ON DELETE SET NULL,
    
    -- Plan metadata
    user_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20), -- Optional for Google Auth users
    
    -- Plan content
    plan_summary TEXT NOT NULL,
    primary_focus_pillars TEXT[] NOT NULL,
    plan_data JSONB NOT NULL, -- Full 30-day plan JSON
    
    -- Generation info
    generation_method VARCHAR(20) DEFAULT 'algorithm' CHECK (generation_method IN ('algorithm', 'llm')),
    llm_provider VARCHAR(20), -- 'openai', 'claude', null
    
    -- Plan lifecycle
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_day INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled', 'inactive')),
    
    -- WhatsApp integration (optional)
    whatsapp_active BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    preferred_nudge_time TIME DEFAULT '07:00:00',
    
    -- Metadata
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plans_user ON plans(user_id);
CREATE INDEX idx_plans_intake ON plans(intake_id);
CREATE INDEX idx_plans_status ON plans(status) WHERE status = 'active';
CREATE INDEX idx_plans_user_active ON plans(user_id, status) WHERE status = 'active';

-- ============================================
-- TABLE: daily_progress
-- Tracks task completion by day
-- ============================================
CREATE TABLE daily_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Day identification
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
    
    -- Task completion (stored as JSONB: { "task_id": true/false })
    tasks_completed JSONB NOT NULL DEFAULT '{}',
    
    -- Completion stats
    total_tasks INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_tasks > 0
        THEN (completed_tasks::DECIMAL / total_tasks * 100)
        ELSE 0 END
    ) STORED,
    
    -- Timestamps
    first_task_completed_at TIMESTAMPTZ,
    last_task_completed_at TIMESTAMPTZ,
    all_tasks_completed_at TIMESTAMPTZ,
    
    -- WhatsApp interaction
    nudge_sent_at TIMESTAMPTZ,
    nudge_acknowledged_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One record per day per plan
    CONSTRAINT unique_plan_day UNIQUE (plan_id, day_number)
);

-- Indexes
CREATE INDEX idx_progress_plan ON daily_progress(plan_id);
CREATE INDEX idx_progress_user ON daily_progress(user_id);
CREATE INDEX idx_progress_plan_day ON daily_progress(plan_id, day_number);

-- ============================================
-- TABLE: whatsapp_messages
-- Log of all WhatsApp messages sent/received
-- ============================================
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Message details
    phone_number VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    message_type VARCHAR(30) NOT NULL,
    template_name VARCHAR(50),
    message_content TEXT,
    
    -- WhatsApp API response
    whatsapp_message_id VARCHAR(100),
    delivery_status VARCHAR(20),
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_plan ON whatsapp_messages(plan_id);
CREATE INDEX idx_messages_user ON whatsapp_messages(user_id);
CREATE INDEX idx_messages_created ON whatsapp_messages(created_at DESC);

-- ============================================
-- TABLE: error_logs
-- System error logging
-- ============================================
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    
    -- Error context
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    
    -- Related entities
    intake_id UUID REFERENCES intake_responses(id),
    plan_id UUID REFERENCES plans(id),
    
    -- Context data
    context_data JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100)
);

-- Indexes
CREATE INDEX idx_errors_user ON error_logs(user_id);
CREATE INDEX idx_errors_created ON error_logs(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_intake_timestamp
    BEFORE UPDATE ON intake_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_plans_timestamp
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_progress_timestamp
    BEFORE UPDATE ON daily_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Intake Responses: Users can only access their own data
CREATE POLICY "Users can view own intake"
    ON intake_responses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intake"
    ON intake_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intake"
    ON intake_responses FOR UPDATE
    USING (auth.uid() = user_id);

-- Plans: Users can only access their own plans
CREATE POLICY "Users can view own plans"
    ON plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
    ON plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
    ON plans FOR UPDATE
    USING (auth.uid() = user_id);

-- Daily Progress: Users can only access their own progress
CREATE POLICY "Users can view own progress"
    ON daily_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON daily_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON daily_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- WhatsApp Messages: Users can view their own messages
CREATE POLICY "Users can view own messages"
    ON whatsapp_messages FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- VIEWS
-- ============================================

-- Active user plan with progress summary
CREATE VIEW v_user_dashboard AS
SELECT
    p.id AS plan_id,
    p.user_id,
    p.user_name,
    p.plan_summary,
    p.primary_focus_pillars,
    p.generation_method,
    p.start_date,
    p.status,
    (CURRENT_DATE - p.start_date + 1) AS current_day,
    COUNT(dp.id) FILTER (WHERE dp.completion_percentage = 100) AS days_completed,
    COALESCE(AVG(dp.completion_percentage), 0) AS avg_completion_percentage
FROM plans p
LEFT JOIN daily_progress dp ON dp.plan_id = p.id
WHERE p.status = 'active'
GROUP BY p.id;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get or create active plan for user
CREATE OR REPLACE FUNCTION get_or_create_plan(
    p_user_id UUID,
    p_user_name VARCHAR(50),
    p_plan_summary TEXT,
    p_focus_pillars TEXT[],
    p_plan_data JSONB,
    p_generation_method VARCHAR(20) DEFAULT 'algorithm',
    p_llm_provider VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_plan_id UUID;
BEGIN
    -- Check for existing active plan
    SELECT id INTO v_plan_id
    FROM plans
    WHERE user_id = p_user_id AND status = 'active'
    LIMIT 1;
    
    -- If exists, return it
    IF v_plan_id IS NOT NULL THEN
        RETURN v_plan_id;
    END IF;
    
    -- Create new plan
    INSERT INTO plans (user_id, user_name, plan_summary, primary_focus_pillars, plan_data, generation_method, llm_provider)
    VALUES (p_user_id, p_user_name, p_plan_summary, p_focus_pillars, p_plan_data, p_generation_method, p_llm_provider)
    RETURNING id INTO v_plan_id;
    
    RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Uncomment to insert sample data:
/*
-- Note: This requires an existing auth.users entry
-- The user profile will be auto-created by the trigger

-- Insert sample intake
INSERT INTO intake_responses (user_id, name, age, sex, primary_goal, sleep_hours_bucket, stress_1_10, training_frequency, daily_time_budget, equipment_access)
VALUES (
    'YOUR-USER-UUID-HERE',
    'Max',
    35,
    'male',
    'energy',
    '6-6.5',
    7,
    '1-2',
    '20',
    'basic'
);
*/
