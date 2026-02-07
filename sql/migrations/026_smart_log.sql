-- ============================================================================
-- ExtensioVitae: Migration 026 — Smart Log (AI Activity Tracking)
-- Purpose: Freitext-Aktivitäten via AI in Longevity-Pillars klassifizieren
-- Date: 2026-02-07
-- ============================================================================

-- TABLE: activity_logs
-- Stores user's free-text activity inputs with AI classification
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User Input
  raw_input TEXT NOT NULL,

  -- AI Classification
  pillar TEXT NOT NULL CHECK (pillar IN (
    'sleep', 'movement', 'nutrition', 'stress', 'connection', 'environment'
  )),
  secondary_pillar TEXT CHECK (secondary_pillar IS NULL OR secondary_pillar IN (
    'sleep', 'movement', 'nutrition', 'stress', 'connection', 'environment'
  )),
  activity TEXT NOT NULL,
  duration_minutes INTEGER,
  intensity TEXT CHECK (intensity IS NULL OR intensity IN ('low', 'medium', 'high')),
  context TEXT CHECK (context IS NULL OR context IN ('indoor', 'outdoor', 'social', 'digital')),
  display_emoji TEXT DEFAULT '📝',
  display_text TEXT,
  longevity_impact INTEGER DEFAULT 5 CHECK (longevity_impact BETWEEN 1 AND 10),
  confidence DECIMAL(3,2) DEFAULT 0.80,

  -- Temporal
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
  ON activity_logs(user_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_pillar
  ON activity_logs(user_id, pillar, log_date DESC);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_logs_user_isolation ON activity_logs;
CREATE POLICY activity_logs_user_isolation ON activity_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permissions
GRANT SELECT, INSERT, DELETE ON activity_logs TO authenticated;

-- Comments
COMMENT ON TABLE activity_logs IS 'AI-classified free-text activity logs for longevity tracking';
COMMENT ON COLUMN activity_logs.raw_input IS 'Original user input, e.g. "1h joggen im Park"';
COMMENT ON COLUMN activity_logs.pillar IS 'Primary longevity pillar (AI-classified)';
COMMENT ON COLUMN activity_logs.secondary_pillar IS 'Optional secondary pillar for multi-domain activities';
COMMENT ON COLUMN activity_logs.confidence IS 'AI classification confidence (0.00-1.00)';
