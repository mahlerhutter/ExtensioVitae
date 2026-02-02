-- =====================================================
-- Migration 005: Separate User Profile and Health Profile
-- =====================================================
-- 
-- SIMPLIFIED VERSION - Run in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE USER_PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Identity (stable, rarely changes)
    name TEXT,
    email TEXT,
    phone_number TEXT,
    
    -- Demographics (constant)
    biological_sex TEXT CHECK (biological_sex IN ('male', 'female', 'diverse')),
    birth_date DATE,
    
    -- Preferences (not plan-relevant)
    whatsapp_opt_in BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "whatsapp": false}'::jsonb,
    preferred_language TEXT DEFAULT 'de',
    timezone TEXT DEFAULT 'Europe/Vienna',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- =====================================================
-- 2. CREATE HEALTH_PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON health_profiles(user_id);

-- =====================================================
-- 3. CREATE PLAN_SNAPSHOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS plan_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    health_profile_snapshot JSONB NOT NULL,
    primary_goal TEXT,
    secondary_goals TEXT[] DEFAULT '{}',
    excluded_activities TEXT[] DEFAULT '{}',
    intensity_cap TEXT,
    generator_version TEXT DEFAULT 'ev-blueprint-js-2.1',
    generation_notes TEXT,
    
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_snapshots_plan_id ON plan_snapshots(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_snapshots_user_id ON plan_snapshots(user_id);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_snapshots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. USER PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. HEALTH PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "health_profiles_select" ON health_profiles;
CREATE POLICY "health_profiles_select" ON health_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_profiles_insert" ON health_profiles;
CREATE POLICY "health_profiles_insert" ON health_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "health_profiles_update" ON health_profiles;
CREATE POLICY "health_profiles_update" ON health_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 7. PLAN SNAPSHOTS POLICIES (simplified with user_id column)
-- =====================================================

DROP POLICY IF EXISTS "plan_snapshots_select" ON plan_snapshots;
CREATE POLICY "plan_snapshots_select" ON plan_snapshots
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "plan_snapshots_insert" ON plan_snapshots;
CREATE POLICY "plan_snapshots_insert" ON plan_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Done!
-- =====================================================
