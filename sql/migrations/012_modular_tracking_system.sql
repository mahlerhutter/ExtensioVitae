-- =====================================================
-- Migration 012: Modular Tracking System
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Enable continuous daily tracking with pluggable modules
-- Ref: docs/TECHNICAL_CONCEPT_MODULAR_TRACKING.md
-- =====================================================

-- =====================================================
-- 1. MODULE DEFINITIONS (System-wide, admin-managed)
-- =====================================================

CREATE TABLE IF NOT EXISTS module_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    slug TEXT UNIQUE NOT NULL,
    name_de TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_de TEXT,
    description_en TEXT,
    icon TEXT DEFAULT '📋',

    -- Module Type
    type TEXT NOT NULL,
    duration_days INTEGER,

    -- Configuration Schema
    config_schema JSONB DEFAULT '{}',

    -- Task Template
    task_template JSONB NOT NULL DEFAULT '{}',

    -- Context Integration
    affected_by_modes TEXT[] DEFAULT '{}',
    priority_weight INTEGER DEFAULT 50,

    -- Categorization
    category TEXT DEFAULT 'general',
    pillars TEXT[] DEFAULT '{}',

    -- Premium/Pricing
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_module_type CHECK (type IN ('recurring', 'one-time', 'continuous')),
    CONSTRAINT valid_category CHECK (category IN ('general', 'nutrition', 'exercise', 'sleep', 'supplements', 'mindset', 'health'))
);

COMMENT ON TABLE module_definitions IS 'System-wide module definitions that users can activate';
COMMENT ON COLUMN module_definitions.type IS 'recurring=repeats, one-time=single run, continuous=no end date';
COMMENT ON COLUMN module_definitions.affected_by_modes IS 'Module pauses when user is in these modes';

-- =====================================================
-- 2. MODULE INSTANCES (User-activated modules)
-- =====================================================

CREATE TABLE IF NOT EXISTS module_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES module_definitions(id) ON DELETE CASCADE NOT NULL,

    -- Instance State
    status TEXT DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- User Configuration
    config JSONB DEFAULT '{}',

    -- Progress
    current_day INTEGER DEFAULT 1,
    total_days INTEGER,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Context Override
    auto_pause_in_modes TEXT[] DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_instance_status CHECK (status IN ('active', 'paused', 'completed', 'cancelled'))
);

COMMENT ON TABLE module_instances IS 'User-specific instances of activated modules';

-- =====================================================
-- 3. DAILY TRACKING (Central tracking table)
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Date
    tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Context Snapshot
    active_mode TEXT DEFAULT 'normal',
    readiness_score INTEGER,

    -- Aggregated Tasks
    tasks JSONB NOT NULL DEFAULT '[]',

    -- Completion Summary
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- AX-1 Monitoring
    time_spent_seconds INTEGER DEFAULT 0,

    -- User Notes
    notes TEXT,

    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_mode CHECK (active_mode IN ('normal', 'travel', 'sick', 'detox', 'deep_work')),
    CONSTRAINT valid_readiness CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100)),
    UNIQUE(user_id, tracking_date)
);

COMMENT ON TABLE daily_tracking IS 'Daily aggregated view of all tasks from active modules';

-- =====================================================
-- 4. TASK COMPLETIONS (Granular tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    daily_tracking_id UUID REFERENCES daily_tracking(id) ON DELETE CASCADE,
    module_instance_id UUID REFERENCES module_instances(id) ON DELETE SET NULL,

    -- Task Identification
    task_id TEXT NOT NULL,
    task_type TEXT NOT NULL DEFAULT 'action',

    -- Task Content
    title_de TEXT NOT NULL,
    title_en TEXT,
    description TEXT,
    pillar TEXT,
    duration_minutes INTEGER DEFAULT 5,
    scheduled_time TIME,

    -- Completion
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    skipped_reason TEXT,

    -- Source
    source_module TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_task_type CHECK (task_type IN ('action', 'reminder', 'check-in', 'info')),
    CONSTRAINT valid_task_status CHECK (status IN ('pending', 'completed', 'skipped', 'snoozed'))
);

COMMENT ON TABLE task_completions IS 'Individual task completion records';

-- =====================================================
-- 5. LAB RESULTS (For blood check module)
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Lab Info
    lab_date DATE NOT NULL,
    lab_provider TEXT,

    -- Raw Data
    raw_file_url TEXT,
    parsed_data JSONB,

    -- Key Biomarkers
    biomarkers JSONB NOT NULL DEFAULT '{}',

    -- Analysis
    deficiencies JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',

    -- Verification
    verification_status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_verification CHECK (verification_status IN ('pending', 'verified', 'flagged'))
);

COMMENT ON TABLE lab_results IS 'User lab results for blood check module';

-- =====================================================
-- 6. USER MODE STATE (Emergency Modes)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_mode_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Current Mode
    current_mode TEXT DEFAULT 'normal',
    mode_activated_at TIMESTAMPTZ,
    mode_expires_at TIMESTAMPTZ,

    -- Mode History (last 10)
    mode_history JSONB DEFAULT '[]',

    -- Auto-detection Settings
    auto_detect_travel BOOLEAN DEFAULT true,
    auto_detect_sick BOOLEAN DEFAULT true,

    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_user_mode CHECK (current_mode IN ('normal', 'travel', 'sick', 'detox', 'deep_work'))
);

COMMENT ON TABLE user_mode_state IS 'Current emergency mode state for each user';

-- =====================================================
-- 7. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_module_definitions_slug ON module_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_module_definitions_active ON module_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_module_definitions_category ON module_definitions(category);

CREATE INDEX IF NOT EXISTS idx_module_instances_user ON module_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_module_instances_status ON module_instances(status);
CREATE INDEX IF NOT EXISTS idx_module_instances_module ON module_instances(module_id);
CREATE INDEX IF NOT EXISTS idx_module_instances_user_status ON module_instances(user_id, status);

CREATE INDEX IF NOT EXISTS idx_daily_tracking_user_date ON daily_tracking(user_id, tracking_date);
CREATE INDEX IF NOT EXISTS idx_daily_tracking_date ON daily_tracking(tracking_date);

CREATE INDEX IF NOT EXISTS idx_task_completions_daily ON task_completions(daily_tracking_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_status ON task_completions(status);
CREATE INDEX IF NOT EXISTS idx_task_completions_module ON task_completions(module_instance_id);

CREATE INDEX IF NOT EXISTS idx_lab_results_user ON lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_date ON lab_results(lab_date);

CREATE INDEX IF NOT EXISTS idx_user_mode_state_user ON user_mode_state(user_id);

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE module_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mode_state ENABLE ROW LEVEL SECURITY;

-- Module Definitions: Everyone can read active modules
DROP POLICY IF EXISTS "Anyone can view active modules" ON module_definitions;
CREATE POLICY "Anyone can view active modules"
    ON module_definitions FOR SELECT
    USING (is_active = true);

-- Module Instances: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own instances" ON module_instances;
CREATE POLICY "Users can view own instances"
    ON module_instances FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own instances" ON module_instances;
CREATE POLICY "Users can insert own instances"
    ON module_instances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own instances" ON module_instances;
CREATE POLICY "Users can update own instances"
    ON module_instances FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own instances" ON module_instances;
CREATE POLICY "Users can delete own instances"
    ON module_instances FOR DELETE
    USING (auth.uid() = user_id);

-- Daily Tracking: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own tracking" ON daily_tracking;
CREATE POLICY "Users can view own tracking"
    ON daily_tracking FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tracking" ON daily_tracking;
CREATE POLICY "Users can insert own tracking"
    ON daily_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tracking" ON daily_tracking;
CREATE POLICY "Users can update own tracking"
    ON daily_tracking FOR UPDATE
    USING (auth.uid() = user_id);

-- Task Completions: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own completions" ON task_completions;
CREATE POLICY "Users can view own completions"
    ON task_completions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own completions" ON task_completions;
CREATE POLICY "Users can insert own completions"
    ON task_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own completions" ON task_completions;
CREATE POLICY "Users can update own completions"
    ON task_completions FOR UPDATE
    USING (auth.uid() = user_id);

-- Lab Results: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own labs" ON lab_results;
CREATE POLICY "Users can view own labs"
    ON lab_results FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own labs" ON lab_results;
CREATE POLICY "Users can insert own labs"
    ON lab_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own labs" ON lab_results;
CREATE POLICY "Users can update own labs"
    ON lab_results FOR UPDATE
    USING (auth.uid() = user_id);

-- User Mode State: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own mode" ON user_mode_state;
CREATE POLICY "Users can view own mode"
    ON user_mode_state FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mode" ON user_mode_state;
CREATE POLICY "Users can insert own mode"
    ON user_mode_state FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mode" ON user_mode_state;
CREATE POLICY "Users can update own mode"
    ON user_mode_state FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Update timestamp trigger for module_instances
DROP TRIGGER IF EXISTS update_module_instances_updated_at ON module_instances;
CREATE TRIGGER update_module_instances_updated_at
    BEFORE UPDATE ON module_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for daily_tracking
DROP TRIGGER IF EXISTS update_daily_tracking_updated_at ON daily_tracking;
CREATE TRIGGER update_daily_tracking_updated_at
    BEFORE UPDATE ON daily_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for user_mode_state
DROP TRIGGER IF EXISTS update_user_mode_state_updated_at ON user_mode_state;
CREATE TRIGGER update_user_mode_state_updated_at
    BEFORE UPDATE ON user_mode_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. SEED DATA: DEFAULT MODULES
-- =====================================================

-- Fasting Module (16:8)
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'fasting-16-8',
    'Intervallfasten 16:8',
    'Intermittent Fasting 16:8',
    '16 Stunden fasten, 8 Stunden Essensfenster. Ideal für Einsteiger.',
    '16 hours fasting, 8 hours eating window. Ideal for beginners.',
    '🍽️',
    'continuous',
    NULL,
    'nutrition',
    ARRAY['nutrition', 'metabolic'],
    70,
    ARRAY['sick', 'travel'],
    '{
        "eating_window_start": {"type": "time", "default": "12:00", "label_de": "Essensfenster Start"},
        "eating_window_end": {"type": "time", "default": "20:00", "label_de": "Essensfenster Ende"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "fasting-reminder-morning",
                "type": "info",
                "time": "07:00",
                "title_de": "Fastenphase läuft",
                "title_en": "Fasting phase active",
                "description": "Nur Wasser, schwarzer Kaffee oder Tee",
                "pillar": "nutrition",
                "duration_minutes": 0
            },
            {
                "id": "eating-window-start",
                "type": "reminder",
                "time": "{{config.eating_window_start}}",
                "title_de": "Essensfenster öffnet",
                "title_en": "Eating window opens",
                "pillar": "nutrition",
                "duration_minutes": 0
            },
            {
                "id": "eating-window-end",
                "type": "action",
                "time": "{{config.eating_window_end}}",
                "title_de": "Letzte Mahlzeit — Essensfenster schließt",
                "title_en": "Last meal — eating window closes",
                "pillar": "nutrition",
                "duration_minutes": 0
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Circadian Light Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'circadian-light',
    'Lichtprotokoll',
    'Circadian Light Protocol',
    'Optimiere deinen Schlaf-Wach-Rhythmus durch gezieltes Morgenlicht.',
    'Optimize your sleep-wake cycle through targeted morning light exposure.',
    '☀️',
    'continuous',
    NULL,
    'sleep',
    ARRAY['sleep', 'energy'],
    80,
    ARRAY['sick'],
    '{
        "wake_time": {"type": "time", "default": "07:00", "label_de": "Aufwachzeit"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-light",
                "type": "action",
                "time": "{{config.wake_time}}+30min",
                "title_de": "Morgenlicht holen (10 min)",
                "title_en": "Get morning light (10 min)",
                "description": "Geh nach draußen oder ans Fenster. Keine Sonnenbrille.",
                "pillar": "sleep",
                "duration_minutes": 10
            },
            {
                "id": "blue-light-cutoff",
                "type": "reminder",
                "time": "21:00",
                "title_de": "Blaulicht reduzieren",
                "title_en": "Reduce blue light",
                "description": "Night Shift aktivieren, Bildschirmzeit reduzieren",
                "pillar": "sleep",
                "duration_minutes": 0
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Supplement Timing Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'supplement-timing',
    'Supplement-Timing',
    'Supplement Timing',
    'Optimale Einnahmezeiten für deine Supplements.',
    'Optimal timing for your supplements.',
    '💊',
    'continuous',
    NULL,
    'supplements',
    ARRAY['supplements', 'nutrition'],
    60,
    ARRAY[]::text[],
    '{
        "supplements": {
            "type": "array",
            "items": ["vitamin_d", "omega3", "magnesium", "zinc", "b_complex"],
            "default": ["vitamin_d", "magnesium"],
            "label_de": "Deine Supplements"
        },
        "wake_time": {"type": "time", "default": "07:00", "label_de": "Aufwachzeit"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "morning-supplements",
                "type": "action",
                "time": "{{config.wake_time}}+30min",
                "title_de": "Morgen-Supplements",
                "title_en": "Morning supplements",
                "description": "Vitamin D + K2 mit Fett, vor Kaffee",
                "pillar": "supplements",
                "duration_minutes": 2,
                "condition": "config.supplements.includes(''vitamin_d'')"
            },
            {
                "id": "evening-magnesium",
                "type": "action",
                "time": "21:00",
                "title_de": "Magnesium (Abend)",
                "title_en": "Magnesium (evening)",
                "description": "Magnesium Glycinat oder Threonat",
                "pillar": "supplements",
                "duration_minutes": 1,
                "condition": "config.supplements.includes(''magnesium'')"
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Yearly Plan Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, config_schema, task_template)
VALUES (
    'yearly-optimization',
    'Jahres-Optimierung',
    'Yearly Optimization',
    'Quartalsziele und regelmäßige Reviews für langfristigen Erfolg.',
    'Quarterly goals and regular reviews for long-term success.',
    '📆',
    'continuous',
    365,
    'mindset',
    ARRAY['mindset', 'health'],
    30,
    ARRAY[]::text[],
    '{
        "focus_areas": {
            "type": "array",
            "items": ["longevity", "performance", "recovery", "metabolic", "mental"],
            "default": ["longevity"],
            "label_de": "Fokus-Bereiche"
        },
        "review_day": {"type": "weekday", "default": "sunday", "label_de": "Wöchentlicher Review-Tag"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "weekly-review",
                "type": "check-in",
                "frequency": "weekly",
                "day": "{{config.review_day}}",
                "time": "19:00",
                "title_de": "Wochen-Review",
                "title_en": "Weekly review",
                "description": "5 min Reflexion: Was lief gut? Was verbessern?",
                "pillar": "mindset",
                "duration_minutes": 5
            },
            {
                "id": "monthly-check",
                "type": "reminder",
                "frequency": "monthly",
                "day": 1,
                "time": "10:00",
                "title_de": "Monatlicher Health-Check",
                "title_en": "Monthly health check",
                "description": "Gewicht, Energie-Level, Schlafqualität notieren",
                "pillar": "health",
                "duration_minutes": 3
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- Blood Check Module
INSERT INTO module_definitions (slug, name_de, name_en, description_de, description_en, icon, type, duration_days, category, pillars, priority_weight, affected_by_modes, is_premium, config_schema, task_template)
VALUES (
    'blood-check',
    'Blutbild-Optimierung',
    'Blood Panel Optimization',
    '90-Tage Zyklus zur Optimierung deiner Blutwerte.',
    '90-day cycle to optimize your blood markers.',
    '🩸',
    'recurring',
    90,
    'health',
    ARRAY['health', 'supplements'],
    50,
    ARRAY[]::text[],
    true,
    '{
        "target_markers": {
            "type": "array",
            "items": ["vitamin_d", "b12", "ferritin", "tsh", "hba1c", "homocysteine", "crp"],
            "default": ["vitamin_d", "b12", "ferritin"],
            "label_de": "Ziel-Marker"
        },
        "last_lab_date": {"type": "date", "label_de": "Letztes Blutbild"}
    }'::jsonb,
    '{
        "tasks": [
            {
                "id": "daily-supplement-reminder",
                "type": "action",
                "time": "08:00",
                "title_de": "Supplements basierend auf Blutwerten",
                "title_en": "Supplements based on blood values",
                "description": "Individuell angepasst an deine Defizite",
                "pillar": "supplements",
                "duration_minutes": 2,
                "condition": "lab_results.deficiencies.length > 0"
            },
            {
                "id": "retest-reminder",
                "type": "reminder",
                "frequency": "once",
                "day": 85,
                "time": "10:00",
                "title_de": "Neues Blutbild fällig",
                "title_en": "New blood panel due",
                "description": "Zeit für Kontroll-Blutbild. Termin buchen!",
                "pillar": "health",
                "duration_minutes": 5
            }
        ]
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name_de = EXCLUDED.name_de,
    task_template = EXCLUDED.task_template,
    updated_at = NOW();

-- =====================================================
-- 11. VERIFICATION
-- =====================================================

SELECT 'Tables created:' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('module_definitions', 'module_instances', 'daily_tracking', 'task_completions', 'lab_results', 'user_mode_state');

SELECT 'Default modules:' AS status;
SELECT slug, name_de, type FROM module_definitions ORDER BY priority_weight DESC;

-- =====================================================
-- NOTES
-- =====================================================
--
-- To add new modules:
-- INSERT INTO module_definitions (slug, name_de, ...) VALUES (...);
--
-- To activate a module for a user:
-- INSERT INTO module_instances (user_id, module_id, config) VALUES (...);
--
-- =====================================================
