-- =====================================================
-- Migration 015: Active Protocol Packs
-- =====================================================
-- Date: 2026-02-04
-- Purpose: Persistent storage for One-Tap Protocol Packs (Immune Shield, Deep Work, etc.)
-- Ref: v0.4.0 Protocol Intelligence Layer
-- =====================================================

-- =====================================================
-- 1. ACTIVE PROTOCOLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS active_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Protocol Identification
    protocol_id TEXT NOT NULL,
    protocol_name TEXT NOT NULL,
    protocol_icon TEXT DEFAULT '🎯',
    protocol_category TEXT,

    -- Activation State
    status TEXT DEFAULT 'active',
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,

    -- Protocol Tasks
    tasks JSONB NOT NULL DEFAULT '[]',

    -- Task Completion Status
    -- Structure: { "task_id": { "completed": true, "completed_at": "timestamp" } }
    task_completion_status JSONB DEFAULT '{}',

    -- Progress Metrics
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Duration & Impact
    duration_hours INTEGER NOT NULL,
    impact_score INTEGER,

    -- Science Reference
    science_ref TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_protocol_status CHECK (status IN ('active', 'completed', 'deactivated', 'expired')),
    CONSTRAINT valid_impact_score CHECK (impact_score IS NULL OR (impact_score >= 0 AND impact_score <= 10)),
    CONSTRAINT valid_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

COMMENT ON TABLE active_protocols IS 'One-Tap Protocol Packs that override daily plans for acute problems';
COMMENT ON COLUMN active_protocols.protocol_id IS 'Reference to PROTOCOL_PACKS constant (e.g., immune_shield, deep_work)';
COMMENT ON COLUMN active_protocols.tasks IS 'Array of protocol tasks with metadata';
COMMENT ON COLUMN active_protocols.task_completion_status IS 'Track completion status for each task in the protocol';

-- =====================================================
-- 2. USER CIRCADIAN PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_circadian_prefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Location (for sunrise/sunset calculation)
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    timezone TEXT DEFAULT 'Europe/Berlin',
    location_name TEXT,

    -- Custom Overrides (optional)
    custom_wake_time TIME,
    custom_sleep_time TIME,

    -- Circadian Intelligence Settings
    enable_morning_light_window BOOLEAN DEFAULT true,
    enable_blue_light_cutoff BOOLEAN DEFAULT true,
    enable_adaptive_melatonin_guard BOOLEAN DEFAULT true,

    -- Morning Light Window Offset (minutes after sunrise)
    morning_light_window_offset INTEGER DEFAULT 60,

    -- Blue Light Cutoff Offset (minutes before sunset)
    blue_light_cutoff_offset INTEGER DEFAULT 120,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_circadian_prefs IS 'User preferences for Circadian Intelligence Engine';
COMMENT ON COLUMN user_circadian_prefs.latitude IS 'User location for sunrise/sunset calculation (null = use defaults)';
COMMENT ON COLUMN user_circadian_prefs.morning_light_window_offset IS 'Minutes after sunrise for optimal morning light window';
COMMENT ON COLUMN user_circadian_prefs.blue_light_cutoff_offset IS 'Minutes before sunset to reduce blue light';

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_active_protocols_user ON active_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_active_protocols_status ON active_protocols(status);
CREATE INDEX IF NOT EXISTS idx_active_protocols_user_status ON active_protocols(user_id, status);
CREATE INDEX IF NOT EXISTS idx_active_protocols_expires ON active_protocols(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_protocols_protocol_id ON active_protocols(protocol_id);

CREATE INDEX IF NOT EXISTS idx_user_circadian_prefs_user ON user_circadian_prefs(user_id);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE active_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_circadian_prefs ENABLE ROW LEVEL SECURITY;

-- Active Protocols: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own protocols" ON active_protocols;
CREATE POLICY "Users can view own protocols"
    ON active_protocols FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own protocols" ON active_protocols;
CREATE POLICY "Users can insert own protocols"
    ON active_protocols FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own protocols" ON active_protocols;
CREATE POLICY "Users can update own protocols"
    ON active_protocols FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own protocols" ON active_protocols;
CREATE POLICY "Users can delete own protocols"
    ON active_protocols FOR DELETE
    USING (auth.uid() = user_id);

-- Circadian Prefs: Users can CRUD their own
DROP POLICY IF EXISTS "Users can view own circadian prefs" ON user_circadian_prefs;
CREATE POLICY "Users can view own circadian prefs"
    ON user_circadian_prefs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own circadian prefs" ON user_circadian_prefs;
CREATE POLICY "Users can insert own circadian prefs"
    ON user_circadian_prefs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own circadian prefs" ON user_circadian_prefs;
CREATE POLICY "Users can update own circadian prefs"
    ON user_circadian_prefs FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Update timestamp trigger for active_protocols
DROP TRIGGER IF EXISTS update_active_protocols_updated_at ON active_protocols;
CREATE TRIGGER update_active_protocols_updated_at
    BEFORE UPDATE ON active_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for user_circadian_prefs
DROP TRIGGER IF EXISTS update_user_circadian_prefs_updated_at ON user_circadian_prefs;
CREATE TRIGGER update_user_circadian_prefs_updated_at
    BEFORE UPDATE ON user_circadian_prefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update completion percentage on task status change
CREATE OR REPLACE FUNCTION update_protocol_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate completion percentage based on task_completion_status
    IF NEW.tasks_total > 0 THEN
        NEW.completion_percentage := (NEW.tasks_completed::DECIMAL / NEW.tasks_total::DECIMAL) * 100;
    ELSE
        NEW.completion_percentage := 0;
    END IF;

    -- Auto-mark as completed if all tasks done
    IF NEW.tasks_completed >= NEW.tasks_total AND NEW.tasks_total > 0 THEN
        NEW.status := 'completed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_protocol_completion ON active_protocols;
CREATE TRIGGER trigger_update_protocol_completion
    BEFORE UPDATE OF tasks_completed ON active_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_protocol_completion();

-- Auto-expire protocols past their expiration date
CREATE OR REPLACE FUNCTION auto_expire_protocols()
RETURNS void AS $$
BEGIN
    UPDATE active_protocols
    SET status = 'expired',
        deactivated_at = NOW(),
        deactivation_reason = 'Auto-expired after duration'
    WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. SEED DATA: Default Circadian Preferences
-- =====================================================

-- Default location: Berlin (for fallback)
-- Users will override this with their actual location

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

SELECT 'Migration 015 completed:' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('active_protocols', 'user_circadian_prefs');

-- =====================================================
-- NOTES
-- =====================================================
--
-- To activate a protocol for a user:
-- INSERT INTO active_protocols (user_id, protocol_id, protocol_name, tasks, expires_at, duration_hours, tasks_total)
-- VALUES (
--   'user-uuid',
--   'immune_shield',
--   'Immune Shield',
--   '[...]'::jsonb,
--   NOW() + INTERVAL '24 hours',
--   24,
--   4
-- );
--
-- To check for active protocols:
-- SELECT * FROM active_protocols WHERE user_id = 'user-uuid' AND status = 'active';
--
-- To mark a task complete:
-- UPDATE active_protocols
-- SET task_completion_status = jsonb_set(task_completion_status, '{task_id}', '{"completed": true, "completed_at": "timestamp"}'::jsonb),
--     tasks_completed = tasks_completed + 1
-- WHERE id = 'protocol-uuid';
--
-- To run protocol expiration check (can be scheduled):
-- SELECT auto_expire_protocols();
--
-- =====================================================
