-- =====================================================
-- Migration 026: RAG User States & Event Sourcing
-- =====================================================
-- Purpose: Add dynamic user state tracking for RAG Decision Engine
-- Dependencies: Requires user_profiles and health_profiles from 005
-- Author: RAG Implementation Phase 1
-- Date: 2026-02-08
-- =====================================================

-- =====================================================
-- 1. CREATE USER_STATES TABLE (Dynamic State)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- ==========================================
    -- SLEEP METRICS
    -- ==========================================
    sleep_debt TEXT CHECK (sleep_debt IN ('none', 'mild', 'moderate', 'severe')) DEFAULT 'none',
    sleep_7day_avg_hours DECIMAL(4,2) CHECK (sleep_7day_avg_hours BETWEEN 0 AND 24),
    sleep_consistency_score INTEGER CHECK (sleep_consistency_score BETWEEN 0 AND 100),
    sleep_efficiency_avg INTEGER CHECK (sleep_efficiency_avg BETWEEN 0 AND 100),

    -- ==========================================
    -- HRV & STRESS METRICS
    -- ==========================================
    stress_load TEXT CHECK (stress_load IN ('baseline', 'elevated', 'high', 'burnout_risk')) DEFAULT 'baseline',
    hrv_rmssd_current INTEGER CHECK (hrv_rmssd_current > 0), -- in milliseconds
    hrv_7day_avg INTEGER CHECK (hrv_7day_avg > 0),
    hrv_30day_baseline INTEGER CHECK (hrv_30day_baseline > 0),
    rhr_current INTEGER CHECK (rhr_current BETWEEN 30 AND 200), -- Resting Heart Rate in BPM
    rhr_7day_avg INTEGER CHECK (rhr_7day_avg BETWEEN 30 AND 200),

    -- ==========================================
    -- RECOVERY STATE
    -- ==========================================
    recovery_state TEXT CHECK (recovery_state IN ('optimal', 'moderate', 'low')) DEFAULT 'moderate',
    recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),

    -- ==========================================
    -- TRAINING LOAD
    -- ==========================================
    training_load TEXT CHECK (training_load IN ('deload', 'maintenance', 'building', 'overreaching')) DEFAULT 'maintenance',
    weekly_training_volume_minutes INTEGER CHECK (weekly_training_volume_minutes >= 0) DEFAULT 0,
    last_hiit_session_date DATE,
    last_strength_session_date DATE,

    -- ==========================================
    -- METABOLIC STATE
    -- ==========================================
    metabolic_flexibility TEXT CHECK (metabolic_flexibility IN ('stable', 'dysregulated')) DEFAULT 'stable',
    fasting_glucose_mg_dl INTEGER CHECK (fasting_glucose_mg_dl BETWEEN 50 AND 300),
    hba1c_percent DECIMAL(3,2) CHECK (hba1c_percent BETWEEN 3.0 AND 15.0),
    post_meal_spike_avg INTEGER CHECK (post_meal_spike_avg >= 0),

    -- ==========================================
    -- ACTIVE CONSTRAINTS (JSONB Array)
    -- ==========================================
    active_constraints JSONB DEFAULT '[]'::jsonb,
    -- Example structure:
    -- [
    --   {
    --     "type": "travel",
    --     "start_date": "2026-02-10",
    --     "end_date": "2026-02-15",
    --     "timezone": "America/New_York",
    --     "impact": ["sleep_disruption", "limited_equipment"]
    --   },
    --   {
    --     "type": "injury",
    --     "location": "knee",
    --     "severity": "mild",
    --     "started_at": "2026-01-28",
    --     "restrictions": ["no_running", "no_jumping"]
    --   }
    -- ]

    -- ==========================================
    -- METADATA
    -- ==========================================
    last_material_change_at TIMESTAMPTZ, -- When last re-evaluation was triggered
    last_hydration_at TIMESTAMPTZ, -- When State Hydration last ran
    calibration_completed BOOLEAN DEFAULT false, -- After 30 days of data
    calibration_start_date DATE, -- When user started tracking

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_states_user_id ON user_states(user_id);

-- Index for calibration queries
CREATE INDEX IF NOT EXISTS idx_user_states_calibration ON user_states(calibration_completed, calibration_start_date);

-- =====================================================
-- 2. CREATE STATE_EVENTS TABLE (Event Sourcing Log)
-- =====================================================

CREATE TABLE IF NOT EXISTS state_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- ==========================================
    -- EVENT DATA
    -- ==========================================
    field TEXT NOT NULL, -- Which state field changed (e.g. "sleep_debt", "stress_load")
    previous_value TEXT, -- Value before change (stored as TEXT for flexibility)
    new_value TEXT NOT NULL, -- Value after change

    -- ==========================================
    -- EVENT METADATA
    -- ==========================================
    source TEXT NOT NULL, -- Data source: 'biosync_hrv', 'biosync_sleep', 'self_report', 'system_derived', 'manual_override'
    triggered_reevaluation BOOLEAN DEFAULT false, -- Whether this event caused a new decision to be generated

    -- ==========================================
    -- ADDITIONAL CONTEXT (Optional JSONB)
    -- ==========================================
    context JSONB DEFAULT '{}'::jsonb,
    -- Example: {"threshold_crossed": "sleep_debt_mild_to_moderate", "baseline_value": 7.5}

    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Composite index for user + time-based queries (most recent events)
CREATE INDEX IF NOT EXISTS idx_state_events_user_time ON state_events(user_id, timestamp DESC);

-- Index for reevaluation queries
CREATE INDEX IF NOT EXISTS idx_state_events_reevaluation ON state_events(user_id, triggered_reevaluation, timestamp DESC)
WHERE triggered_reevaluation = true;

-- Index for field-specific queries (for debugging/analysis)
CREATE INDEX IF NOT EXISTS idx_state_events_field ON state_events(field, timestamp DESC);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on user_states
ALTER TABLE user_states ENABLE ROW LEVEL SECURITY;

-- Users can only read their own state
CREATE POLICY user_states_select_own ON user_states
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only update their own state (via Edge Functions)
CREATE POLICY user_states_update_own ON user_states
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own initial state
CREATE POLICY user_states_insert_own ON user_states
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Enable RLS on state_events
ALTER TABLE state_events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own events
CREATE POLICY state_events_select_own ON state_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only Edge Functions (service role) can insert events
-- Users cannot directly insert events (prevents tampering)
CREATE POLICY state_events_insert_service_role ON state_events
    FOR INSERT
    WITH CHECK (true); -- Service role bypasses RLS anyway, but explicit policy for clarity

-- =====================================================
-- 4. TRIGGER: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_states_updated_at
    BEFORE UPDATE ON user_states
    FOR EACH ROW
    EXECUTE FUNCTION update_user_states_updated_at();

-- =====================================================
-- 5. HELPER FUNCTION: Get User State History
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_state_history(
    p_user_id UUID,
    p_field TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    event_id UUID,
    field TEXT,
    previous_value TEXT,
    new_value TEXT,
    source TEXT,
    triggered_reevaluation BOOLEAN,
    event_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        se.event_id,
        se.field,
        se.previous_value,
        se.new_value,
        se.source,
        se.triggered_reevaluation,
        se.timestamp
    FROM state_events se
    WHERE
        se.user_id = p_user_id
        AND (p_field IS NULL OR se.field = p_field)
    ORDER BY se.timestamp DESC
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- 6. HELPER FUNCTION: Initialize User State
-- =====================================================
-- Creates initial user_states row for new users

CREATE OR REPLACE FUNCTION initialize_user_state(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_state_id UUID;
BEGIN
    -- Check if state already exists
    SELECT id INTO v_state_id
    FROM user_states
    WHERE user_id = p_user_id;

    -- If not, create initial state
    IF v_state_id IS NULL THEN
        INSERT INTO user_states (
            user_id,
            sleep_debt,
            stress_load,
            recovery_state,
            training_load,
            metabolic_flexibility,
            calibration_completed,
            calibration_start_date,
            created_at
        ) VALUES (
            p_user_id,
            'none', -- Default: no sleep debt
            'baseline', -- Default: baseline stress
            'moderate', -- Default: moderate recovery
            'maintenance', -- Default: maintenance training
            'stable', -- Default: stable metabolic
            false, -- Calibration not complete
            CURRENT_DATE, -- Start calibration today
            NOW()
        )
        RETURNING id INTO v_state_id;
    END IF;

    RETURN v_state_id;
END;
$$;

-- =====================================================
-- 7. HELPER FUNCTION: Record State Event
-- =====================================================

CREATE OR REPLACE FUNCTION record_state_event(
    p_user_id UUID,
    p_field TEXT,
    p_previous_value TEXT,
    p_new_value TEXT,
    p_source TEXT,
    p_triggered_reevaluation BOOLEAN DEFAULT false,
    p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Insert event
    INSERT INTO state_events (
        user_id,
        field,
        previous_value,
        new_value,
        source,
        triggered_reevaluation,
        context,
        timestamp
    ) VALUES (
        p_user_id,
        p_field,
        p_previous_value,
        p_new_value,
        p_source,
        p_triggered_reevaluation,
        p_context,
        NOW()
    )
    RETURNING event_id INTO v_event_id;

    -- Update user_states.updated_at
    UPDATE user_states
    SET updated_at = NOW()
    WHERE user_id = p_user_id;

    -- If triggered reevaluation, update last_material_change_at
    IF p_triggered_reevaluation THEN
        UPDATE user_states
        SET last_material_change_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    RETURN v_event_id;
END;
$$;

-- =====================================================
-- 8. COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE user_states IS 'Materialized view of current user dynamic state for RAG Decision Engine. Updated via state_events.';
COMMENT ON TABLE state_events IS 'Immutable event log for all user state changes. Enables audit trails and replay.';

COMMENT ON COLUMN user_states.sleep_debt IS 'Categorical sleep debt: none (<0.5h deficit), mild (0.5-1.5h), moderate (1.5-2.5h), severe (>2.5h)';
COMMENT ON COLUMN user_states.stress_load IS 'Categorical stress based on HRV: baseline (>95% baseline), elevated (85-94%), high (70-84%), burnout_risk (<70%)';
COMMENT ON COLUMN user_states.recovery_state IS 'Daily recovery state: optimal (≥70 score), moderate (50-69), low (<50)';
COMMENT ON COLUMN user_states.training_load IS 'Weekly training load: deload (<50% baseline), maintenance (50-80%), building (80-120%), overreaching (>120%)';
COMMENT ON COLUMN user_states.active_constraints IS 'JSON array of current constraints (travel, injury, illness, calendar events)';
COMMENT ON COLUMN user_states.calibration_completed IS 'TRUE after 30 days of data collection for personal baseline';

COMMENT ON COLUMN state_events.triggered_reevaluation IS 'TRUE if this event crossed a material threshold and triggered new decision generation';
COMMENT ON COLUMN state_events.source IS 'Data source: biosync_hrv, biosync_sleep, biosync_activity, self_report, system_derived, manual_override';

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant service role full access (for Edge Functions)
GRANT ALL ON user_states TO service_role;
GRANT ALL ON state_events TO service_role;

-- Grant authenticated users SELECT on their own rows (via RLS)
GRANT SELECT ON user_states TO authenticated;
GRANT SELECT ON state_events TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_states') THEN
        RAISE NOTICE '✅ user_states table created successfully';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'state_events') THEN
        RAISE NOTICE '✅ state_events table created successfully';
    END IF;

    RAISE NOTICE '✅ Migration 026 completed: RAG User States & Event Sourcing';
END $$;
