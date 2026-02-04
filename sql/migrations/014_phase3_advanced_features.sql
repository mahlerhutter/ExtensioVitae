-- =====================================================
-- Migration 014: Phase 3 Advanced Features
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Blood Check OCR, Wearables, Readiness, Analytics, Notifications
-- =====================================================

-- =====================================================
-- 1. ENHANCED LAB RESULTS FOR OCR
-- =====================================================

-- Add OCR-specific columns to lab_results
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS ocr_raw_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS ocr_provider TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS parsing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS parsing_errors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS source_file_type TEXT;

COMMENT ON COLUMN lab_results.ocr_raw_text IS 'Raw text extracted from OCR';
COMMENT ON COLUMN lab_results.ocr_confidence IS 'OCR confidence score 0-100';
COMMENT ON COLUMN lab_results.ocr_provider IS 'OCR service used: manual, google_vision, tesseract, claude';
COMMENT ON COLUMN lab_results.parsing_status IS 'pending, processing, parsed, failed, verified';

-- Biomarker reference ranges
CREATE TABLE IF NOT EXISTS biomarker_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name_de TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,

    -- Reference ranges
    optimal_min DECIMAL(10,3),
    optimal_max DECIMAL(10,3),
    normal_min DECIMAL(10,3),
    normal_max DECIMAL(10,3),

    -- Context
    gender_specific BOOLEAN DEFAULT false,
    male_optimal_min DECIMAL(10,3),
    male_optimal_max DECIMAL(10,3),
    female_optimal_min DECIMAL(10,3),
    female_optimal_max DECIMAL(10,3),

    -- Supplements/Actions
    low_recommendations JSONB DEFAULT '[]',
    high_recommendations JSONB DEFAULT '[]',

    -- Parsing helpers
    aliases TEXT[] DEFAULT '{}',

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_category CHECK (category IN (
        'vitamins', 'minerals', 'hormones', 'lipids', 'metabolic',
        'inflammation', 'thyroid', 'liver', 'kidney', 'blood_cells', 'other'
    ))
);

COMMENT ON TABLE biomarker_references IS 'Reference ranges for blood biomarkers';

-- =====================================================
-- 2. WEARABLE DATA INTEGRATION
-- =====================================================

-- Wearable connections
CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    provider TEXT NOT NULL,
    provider_user_id TEXT,

    -- OAuth
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],

    -- Status
    status TEXT DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    sync_errors JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_provider CHECK (provider IN (
        'apple_health', 'google_fit', 'fitbit', 'garmin',
        'whoop', 'oura', 'withings', 'polar', 'eight_sleep'
    )),
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'expired', 'revoked')),
    UNIQUE(user_id, provider)
);

-- Wearable data points
CREATE TABLE IF NOT EXISTS wearable_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    connection_id UUID REFERENCES wearable_connections(id) ON DELETE CASCADE,

    -- Data point
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    metric_unit TEXT,

    -- Time
    recorded_at TIMESTAMPTZ NOT NULL,
    source_provider TEXT NOT NULL,

    -- Metadata
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_metric_type CHECK (metric_type IN (
        'hrv', 'resting_hr', 'sleep_score', 'sleep_duration', 'deep_sleep', 'rem_sleep',
        'steps', 'active_calories', 'total_calories', 'vo2_max', 'respiratory_rate',
        'body_battery', 'stress_score', 'recovery_score', 'readiness_score',
        'blood_oxygen', 'skin_temp', 'weight', 'body_fat', 'muscle_mass'
    ))
);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_date ON wearable_data(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_wearable_data_metric ON wearable_data(user_id, metric_type, recorded_at);

-- =====================================================
-- 3. READINESS SCORE & TASK SWAPPING
-- =====================================================

-- Daily readiness score
CREATE TABLE IF NOT EXISTS daily_readiness (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Readiness Score (0-100)
    overall_score INTEGER NOT NULL,

    -- Contributing factors
    sleep_score INTEGER,
    recovery_score INTEGER,
    hrv_score INTEGER,
    stress_score INTEGER,

    -- Manual inputs
    energy_level INTEGER, -- 1-10
    mood_level INTEGER, -- 1-10
    soreness_level INTEGER, -- 1-10

    -- Source
    primary_source TEXT DEFAULT 'manual',
    data_sources JSONB DEFAULT '[]',

    -- Task recommendations
    recommended_intensity TEXT DEFAULT 'normal',
    task_adjustments JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_scores CHECK (
        overall_score >= 0 AND overall_score <= 100 AND
        (sleep_score IS NULL OR (sleep_score >= 0 AND sleep_score <= 100)) AND
        (energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 10))
    ),
    CONSTRAINT valid_intensity CHECK (recommended_intensity IN (
        'rest', 'light', 'normal', 'high', 'peak'
    )),
    UNIQUE(user_id, date)
);

COMMENT ON TABLE daily_readiness IS 'Daily readiness scores for task intensity adjustment';

-- =====================================================
-- 4. PROGRESS ANALYTICS
-- =====================================================

-- Weekly/Monthly aggregates
CREATE TABLE IF NOT EXISTS progress_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Period
    period_type TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Task metrics
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,

    -- Time metrics
    total_time_minutes INTEGER DEFAULT 0,
    avg_daily_time_minutes DECIMAL(5,1) DEFAULT 0,

    -- Streak
    longest_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,

    -- Pillar breakdown
    pillar_breakdown JSONB DEFAULT '{}',

    -- Module breakdown
    module_breakdown JSONB DEFAULT '{}',

    -- Trends
    completion_trend DECIMAL(5,2), -- % change from previous period

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_period_type CHECK (period_type IN ('week', 'month', 'quarter', 'year')),
    UNIQUE(user_id, period_type, period_start)
);

-- Milestone achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    achievement_type TEXT NOT NULL,
    achievement_value INTEGER,

    -- Context
    module_slug TEXT,
    pillar TEXT,

    earned_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_achievement CHECK (achievement_type IN (
        'streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_90',
        'tasks_10', 'tasks_50', 'tasks_100', 'tasks_500', 'tasks_1000',
        'module_completed', 'perfect_day', 'perfect_week',
        'first_blood_check', 'blood_check_improved',
        'wearable_connected', 'readiness_streak'
    ))
);

-- =====================================================
-- 5. NOTIFICATION ENGINE
-- =====================================================

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Channels
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    sms_enabled BOOLEAN DEFAULT false,

    -- Timing
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    timezone TEXT DEFAULT 'Europe/Vienna',

    -- Notification types
    task_reminders BOOLEAN DEFAULT true,
    streak_alerts BOOLEAN DEFAULT true,
    weekly_summary BOOLEAN DEFAULT true,
    module_updates BOOLEAN DEFAULT true,
    blood_check_reminders BOOLEAN DEFAULT true,
    achievement_alerts BOOLEAN DEFAULT true,

    -- Frequency
    reminder_minutes_before INTEGER DEFAULT 15,
    max_daily_notifications INTEGER DEFAULT 8,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification queue
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Content
    type TEXT NOT NULL,
    title_de TEXT NOT NULL,
    title_en TEXT,
    body_de TEXT,
    body_en TEXT,
    action_url TEXT,

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    error_message TEXT,

    -- Context
    source_module TEXT,
    task_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_notif_type CHECK (type IN (
        'task_reminder', 'streak_warning', 'streak_milestone',
        'weekly_summary', 'blood_check_due', 'achievement',
        'module_reminder', 'readiness_check', 'custom'
    )),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'opened', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id, status);

-- =====================================================
-- 6. SEED: BIOMARKER REFERENCES
-- =====================================================

INSERT INTO biomarker_references (code, name_de, name_en, category, unit, optimal_min, optimal_max, normal_min, normal_max, aliases, low_recommendations, high_recommendations)
VALUES
    ('vitamin_d', 'Vitamin D (25-OH)', 'Vitamin D (25-OH)', 'vitamins', 'ng/mL', 40, 60, 30, 100,
     ARRAY['25-hydroxyvitamin d', 'calcidiol', '25-oh-d3', 'vitamin d3'],
     '[{"de": "Vitamin D3 supplementieren (4000-5000 IU/Tag)", "en": "Supplement Vitamin D3 (4000-5000 IU/day)"}]'::jsonb,
     '[{"de": "Supplementierung reduzieren, Blutwerte kontrollieren", "en": "Reduce supplementation, monitor blood levels"}]'::jsonb),

    ('b12', 'Vitamin B12', 'Vitamin B12', 'vitamins', 'pg/mL', 500, 900, 200, 900,
     ARRAY['cobalamin', 'methylcobalamin'],
     '[{"de": "B12 supplementieren (Methylcobalamin bevorzugt)", "en": "Supplement B12 (methylcobalamin preferred)"}]'::jsonb,
     '[]'::jsonb),

    ('ferritin', 'Ferritin', 'Ferritin', 'minerals', 'ng/mL', 50, 150, 20, 200,
     ARRAY['speichereisen', 'iron storage'],
     '[{"de": "Eisenreiche Ernährung, evtl. Eisen-Bisglycinat", "en": "Iron-rich diet, consider iron bisglycinate"}]'::jsonb,
     '[{"de": "Entzündungsmarker prüfen, Eisen reduzieren", "en": "Check inflammation markers, reduce iron"}]'::jsonb),

    ('tsh', 'TSH', 'TSH', 'thyroid', 'mIU/L', 1.0, 2.5, 0.4, 4.0,
     ARRAY['thyroid stimulating hormone', 'thyrotropin'],
     '[{"de": "Schilddrüsenfunktion überprüfen lassen", "en": "Have thyroid function checked"}]'::jsonb,
     '[{"de": "Schilddrüsenunterfunktion möglich, ärztlich abklären", "en": "Possible hypothyroidism, consult doctor"}]'::jsonb),

    ('hba1c', 'HbA1c', 'HbA1c', 'metabolic', '%', 4.5, 5.3, 4.0, 5.7,
     ARRAY['glykohämoglobin', 'glycated hemoglobin', 'a1c'],
     '[]'::jsonb,
     '[{"de": "Kohlenhydrate reduzieren, Bewegung erhöhen", "en": "Reduce carbs, increase exercise"}]'::jsonb),

    ('crp', 'CRP (hsCRP)', 'CRP (hsCRP)', 'inflammation', 'mg/L', 0, 1.0, 0, 3.0,
     ARRAY['c-reactive protein', 'hochsensitives crp', 'hs-crp'],
     '[]'::jsonb,
     '[{"de": "Entzündungsquellen identifizieren, Omega-3 erhöhen", "en": "Identify inflammation sources, increase Omega-3"}]'::jsonb),

    ('homocysteine', 'Homocystein', 'Homocysteine', 'metabolic', 'µmol/L', 5, 9, 5, 15,
     ARRAY['homocystein'],
     '[]'::jsonb,
     '[{"de": "B-Vitamine (B6, B12, Folat) supplementieren", "en": "Supplement B vitamins (B6, B12, folate)"}]'::jsonb),

    ('ldl', 'LDL-Cholesterin', 'LDL Cholesterol', 'lipids', 'mg/dL', 70, 100, 0, 130,
     ARRAY['ldl-c', 'low density lipoprotein'],
     '[]'::jsonb,
     '[{"de": "Ballaststoffe erhöhen, gesättigte Fette reduzieren", "en": "Increase fiber, reduce saturated fats"}]'::jsonb),

    ('hdl', 'HDL-Cholesterin', 'HDL Cholesterol', 'lipids', 'mg/dL', 60, 100, 40, 100,
     ARRAY['hdl-c', 'high density lipoprotein'],
     '[{"de": "Bewegung erhöhen, Omega-3 supplementieren", "en": "Increase exercise, supplement Omega-3"}]'::jsonb,
     '[]'::jsonb),

    ('triglycerides', 'Triglyceride', 'Triglycerides', 'lipids', 'mg/dL', 50, 100, 0, 150,
     ARRAY['tg', 'triacylglyceride'],
     '[]'::jsonb,
     '[{"de": "Zucker und Alkohol reduzieren, Omega-3 erhöhen", "en": "Reduce sugar and alcohol, increase Omega-3"}]'::jsonb)

ON CONFLICT (code) DO UPDATE SET
    optimal_min = EXCLUDED.optimal_min,
    optimal_max = EXCLUDED.optimal_max,
    low_recommendations = EXCLUDED.low_recommendations,
    high_recommendations = EXCLUDED.high_recommendations;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE biomarker_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Public read for biomarker references
CREATE POLICY "Anyone can view biomarkers" ON biomarker_references FOR SELECT USING (is_active = true);

-- User-specific policies
CREATE POLICY "Users can manage own wearable connections" ON wearable_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wearable data" ON wearable_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own readiness" ON daily_readiness FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON progress_aggregates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notification prefs" ON notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notification_queue FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

SELECT 'Phase 3 Tables Created:' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'biomarker_references', 'wearable_connections', 'wearable_data',
    'daily_readiness', 'progress_aggregates', 'user_achievements',
    'notification_preferences', 'notification_queue'
);

SELECT 'Biomarker References:' AS status;
SELECT code, name_de, category FROM biomarker_references ORDER BY category, code;
