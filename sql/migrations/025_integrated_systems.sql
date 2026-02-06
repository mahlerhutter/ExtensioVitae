-- ============================================================================
-- ExtensioVitae: Integrated Systems Migration
-- Task Management + Recovery Tracking + Wearable Integration
-- Version: 1.0
-- Date: 2026-02-06
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: tasks
-- Purpose: Master list of user's recurring or one-time tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'exercise',
    'nutrition',
    'supplements',
    'recovery',
    'cognitive',
    'social',
    'custom'
  )),

  -- Difficulty & scheduling
  base_difficulty INTEGER DEFAULT 5 CHECK (base_difficulty BETWEEN 1 AND 10),
  duration_minutes INTEGER,
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  optimal_time_of_day TEXT[], -- e.g. ['morning', 'afternoon']

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {type: 'daily' | 'weekly', days: [0,1,2,3,4,5,6]}

  -- Streak tracking (denormalized for performance)
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  total_completions INTEGER DEFAULT 0,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_user_active
  ON tasks(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tasks_category
  ON tasks(category);

CREATE INDEX IF NOT EXISTS idx_tasks_user_last_completed
  ON tasks(user_id, last_completed_at DESC NULLS LAST);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: task_completions (Partitioned)
-- Purpose: Historical record of every task completion (append-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Completion details
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_actual_minutes INTEGER,
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 10),
  notes TEXT,

  -- Context at completion
  recovery_score_at_completion INTEGER,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (id, completed_at)
) PARTITION BY RANGE (completed_at);

-- Create partitions for 2026 (extend as needed)
CREATE TABLE IF NOT EXISTS task_completions_2026_01 PARTITION OF task_completions
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_02 PARTITION OF task_completions
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_03 PARTITION OF task_completions
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_04 PARTITION OF task_completions
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_05 PARTITION OF task_completions
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_06 PARTITION OF task_completions
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_07 PARTITION OF task_completions
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_08 PARTITION OF task_completions
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_09 PARTITION OF task_completions
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_10 PARTITION OF task_completions
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_11 PARTITION OF task_completions
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS task_completions_2026_12 PARTITION OF task_completions
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date
  ON task_completions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_completions_task
  ON task_completions(task_id, completed_at DESC);

-- ============================================================================
-- TABLE: wearable_connections
-- Purpose: Store OAuth tokens and sync status for connected devices
-- ============================================================================

CREATE TABLE IF NOT EXISTS wearable_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Device info
  device_type TEXT NOT NULL CHECK (device_type IN (
    'oura',
    'whoop',
    'apple_health',
    'garmin',
    'fitbit'
  )),
  device_id TEXT, -- Device-specific identifier

  -- OAuth credentials (encrypted at rest via Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync status
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'disconnected')),
  sync_error_message TEXT,
  sync_retry_count INTEGER DEFAULT 0,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false, -- If multiple wearables, which is primary?

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_type) -- One connection per device type per user
);

CREATE INDEX IF NOT EXISTS idx_wearable_connections_user
  ON wearable_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_wearable_connections_status
  ON wearable_connections(sync_status, last_sync_at);

CREATE TRIGGER update_wearable_connections_updated_at BEFORE UPDATE ON wearable_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: wearable_data (Partitioned)
-- Purpose: Raw time-series data from wearables (high-volume, partitioned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wearable_data (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES wearable_connections(id) ON DELETE CASCADE,

  -- Temporal
  measurement_timestamp TIMESTAMPTZ NOT NULL,
  measurement_date DATE NOT NULL, -- For partitioning

  -- Source
  source_device TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'hrv',
    'heart_rate',
    'sleep_stage',
    'activity',
    'temperature',
    'respiratory_rate',
    'readiness',
    'sleep_summary'
  )),

  -- Data payload (flexible JSON for device-specific fields)
  data JSONB NOT NULL,
  /* Example structures:
     HRV: {rmssd: 45, sdnn: 67, lf_hf_ratio: 2.1, samples: 120}
     Sleep Stage: {stage: 'deep', duration_minutes: 87}
     Heart Rate: {bpm: 58, confidence: 'high'}
     Temperature: {celsius: 36.7, deviation: 0.2}
     Sleep Summary: {total_min: 456, deep_min: 102, rem_min: 98, light_min: 234, awake_min: 22, efficiency: 0.95}
  */

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (id, measurement_date),
  UNIQUE(user_id, source_device, measurement_timestamp, data_type, measurement_date) -- Deduplication (includes partition key)
) PARTITION BY RANGE (measurement_date);

-- Create partitions for 2026
CREATE TABLE IF NOT EXISTS wearable_data_2026_01 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_02 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_03 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_04 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_05 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_06 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_07 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_08 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_09 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_10 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_11 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS wearable_data_2026_12 PARTITION OF wearable_data
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Indexes for wearable_data
CREATE INDEX IF NOT EXISTS idx_wearable_data_user_date
  ON wearable_data(user_id, measurement_date DESC);

CREATE INDEX IF NOT EXISTS idx_wearable_data_type_timestamp
  ON wearable_data(data_type, measurement_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_wearable_data_user_type_date
  ON wearable_data(user_id, data_type, measurement_date DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_wearable_data_jsonb
  ON wearable_data USING GIN (data);

-- ============================================================================
-- TABLE: recovery_metrics
-- Purpose: Daily aggregated recovery scores (one row per user per day)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recovery_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Core metrics (aggregated from wearable_data)
  hrv_rmssd DECIMAL(6,2), -- ms
  hrv_sdnn DECIMAL(6,2),
  hrv_lf_hf_ratio DECIMAL(5,2),
  rhr_bpm INTEGER, -- Resting heart rate

  -- Sleep (from previous night)
  sleep_total_minutes INTEGER,
  sleep_deep_minutes INTEGER,
  sleep_rem_minutes INTEGER,
  sleep_light_minutes INTEGER,
  sleep_awake_minutes INTEGER,
  sleep_efficiency DECIMAL(4,2), -- 0.00 - 1.00
  time_in_bed_minutes INTEGER,
  sleep_onset_latency_minutes INTEGER, -- Time to fall asleep

  -- Activity
  activity_calories INTEGER,
  steps INTEGER,
  active_minutes INTEGER,

  -- Temperature
  body_temperature_celsius DECIMAL(4,2),
  temperature_deviation DECIMAL(3,2), -- vs baseline

  -- Respiratory
  respiratory_rate DECIMAL(4,1), -- breaths per minute

  -- Calculated scores (0-100)
  recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),
  hrv_score INTEGER CHECK (hrv_score BETWEEN 0 AND 100),
  sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
  rhr_score INTEGER CHECK (rhr_score BETWEEN 0 AND 100),

  -- Readiness state (derived from recovery_score)
  readiness_state TEXT CHECK (readiness_state IN ('optimal', 'moderate', 'low')),

  -- Baselines (rolling averages for comparison)
  hrv_7day_baseline DECIMAL(6,2),
  rhr_7day_baseline DECIMAL(5,2),
  sleep_7day_baseline DECIMAL(6,2),

  -- Metadata
  data_source TEXT DEFAULT 'wearable', -- 'wearable' or 'manual'
  calculation_version TEXT DEFAULT 'v1.0', -- Track algorithm changes
  notes TEXT, -- User notes about the day

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_recovery_metrics_user_date
  ON recovery_metrics(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_metrics_state
  ON recovery_metrics(readiness_state, date DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_metrics_score
  ON recovery_metrics(recovery_score DESC, date DESC);

CREATE TRIGGER update_recovery_metrics_updated_at BEFORE UPDATE ON recovery_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEW: user_recovery_baseline
-- Purpose: Pre-computed rolling baselines for fast queries
-- Refresh: Nightly via cron (see Edge Function)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_recovery_baseline AS
WITH recent_metrics AS (
  SELECT
    user_id,
    date,
    hrv_rmssd,
    rhr_bpm,
    sleep_total_minutes,
    recovery_score,

    -- Calculate time windows
    CASE WHEN date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END AS is_7d,
    CASE WHEN date >= CURRENT_DATE - INTERVAL '14 days' THEN 1 ELSE 0 END AS is_14d,
    CASE WHEN date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END AS is_30d
  FROM recovery_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    AND recovery_score IS NOT NULL
)
SELECT
  user_id,

  -- 7-day rolling averages
  AVG(hrv_rmssd) FILTER (WHERE is_7d = 1) AS hrv_7day_avg,
  STDDEV_POP(hrv_rmssd) FILTER (WHERE is_7d = 1) AS hrv_7day_stddev,
  AVG(rhr_bpm) FILTER (WHERE is_7d = 1) AS rhr_7day_avg,
  AVG(sleep_total_minutes) FILTER (WHERE is_7d = 1) AS sleep_7day_avg,
  AVG(recovery_score) FILTER (WHERE is_7d = 1) AS recovery_7day_avg,

  -- 14-day rolling averages (for Oura-style balance)
  AVG(hrv_rmssd) FILTER (WHERE is_14d = 1) AS hrv_14day_avg,
  AVG(recovery_score) FILTER (WHERE is_14d = 1) AS recovery_14day_avg,

  -- 30-day for long-term trends
  AVG(hrv_rmssd) FILTER (WHERE is_30d = 1) AS hrv_30day_avg,
  STDDEV_POP(hrv_rmssd) FILTER (WHERE is_30d = 1) AS hrv_30day_stddev,
  AVG(recovery_score) FILTER (WHERE is_30d = 1) AS recovery_30day_avg,

  -- Overtraining detection: days with low recovery in last 14 days
  COUNT(*) FILTER (WHERE is_14d = 1 AND recovery_score < 40) AS low_recovery_days_14d,

  -- Trend direction (comparing 7d to 14d)
  CASE
    WHEN AVG(recovery_score) FILTER (WHERE is_7d = 1) > AVG(recovery_score) FILTER (WHERE is_14d = 1) + 5 THEN 'improving'
    WHEN AVG(recovery_score) FILTER (WHERE is_7d = 1) < AVG(recovery_score) FILTER (WHERE is_14d = 1) - 5 THEN 'declining'
    ELSE 'stable'
  END AS recovery_trend,

  MAX(date) AS last_metric_date,
  COUNT(*) FILTER (WHERE is_7d = 1) AS days_with_data_7d,
  COUNT(*) FILTER (WHERE is_30d = 1) AS days_with_data_30d

FROM recent_metrics
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_baseline_user
  ON user_recovery_baseline(user_id);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- Purpose: Ensure users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS tasks_user_isolation ON tasks;
DROP POLICY IF EXISTS task_completions_user_isolation ON task_completions;
DROP POLICY IF EXISTS wearable_connections_user_isolation ON wearable_connections;
DROP POLICY IF EXISTS wearable_data_user_isolation ON wearable_data;
DROP POLICY IF EXISTS recovery_metrics_user_isolation ON recovery_metrics;

-- Create policies: Users can only access their own data
CREATE POLICY tasks_user_isolation ON tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY task_completions_user_isolation ON task_completions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY wearable_connections_user_isolation ON wearable_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY wearable_data_user_isolation ON wearable_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recovery_metrics_user_isolation ON recovery_metrics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS: Business Logic
-- ============================================================================

-- Function: Calculate current streak for a task
-- Uses window functions for performance
CREATE OR REPLACE FUNCTION calculate_task_streak(p_task_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_completed DATE
) AS $$
WITH daily_completions AS (
  SELECT DISTINCT DATE(completed_at) AS completion_date
  FROM task_completions
  WHERE task_id = p_task_id
  ORDER BY completion_date DESC
),
streak_groups AS (
  SELECT
    completion_date,
    completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC))::INTEGER AS streak_group
  FROM daily_completions
),
streak_lengths AS (
  SELECT
    COUNT(*) AS streak_length,
    MIN(completion_date) AS streak_start,
    MAX(completion_date) AS streak_end
  FROM streak_groups
  GROUP BY streak_group
  ORDER BY streak_end DESC
)
SELECT
  CASE
    -- Current streak only counts if it includes today or yesterday (redemption)
    WHEN (SELECT MAX(completion_date) FROM daily_completions) >= CURRENT_DATE - INTERVAL '1 day'
    THEN COALESCE((SELECT streak_length FROM streak_lengths LIMIT 1), 0)
    ELSE 0
  END AS current_streak,
  COALESCE((SELECT MAX(streak_length) FROM streak_lengths), 0) AS longest_streak,
  (SELECT MAX(completion_date) FROM daily_completions) AS last_completed;
$$ LANGUAGE SQL STABLE;

-- Function: Get tasks adjusted for recovery state
-- Returns tasks with difficulty adjusted based on current recovery
CREATE OR REPLACE FUNCTION get_adjusted_tasks(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  category TEXT,
  base_difficulty INTEGER,
  adjusted_difficulty INTEGER,
  duration_minutes INTEGER,
  adjusted_duration INTEGER,
  intensity TEXT,
  suggested_intensity TEXT,
  current_streak INTEGER,
  recommendation TEXT,
  optimal_for_time BOOLEAN
) AS $$
DECLARE
  v_recovery_state TEXT;
  v_intensity_multiplier DECIMAL;
  v_duration_multiplier DECIMAL;
  v_current_hour INTEGER;
BEGIN
  -- Get today's recovery state
  SELECT readiness_state INTO v_recovery_state
  FROM recovery_metrics
  WHERE user_id = p_user_id AND date = p_date;

  -- Default to 'moderate' if no data
  v_recovery_state := COALESCE(v_recovery_state, 'moderate');

  -- Get current hour for time-of-day filtering
  v_current_hour := EXTRACT(HOUR FROM NOW());

  -- Set multipliers based on recovery state
  CASE v_recovery_state
    WHEN 'optimal' THEN
      v_intensity_multiplier := 1.1;
      v_duration_multiplier := 1.0;
    WHEN 'moderate' THEN
      v_intensity_multiplier := 1.0;
      v_duration_multiplier := 0.9;
    WHEN 'low' THEN
      v_intensity_multiplier := 0.7;
      v_duration_multiplier := 0.7;
  END CASE;

  RETURN QUERY
  SELECT
    t.id AS task_id,
    t.title,
    t.category,
    t.base_difficulty,
    LEAST(10, GREATEST(1, ROUND(t.base_difficulty * v_intensity_multiplier)))::INTEGER AS adjusted_difficulty,
    t.duration_minutes,
    ROUND(t.duration_minutes * v_duration_multiplier)::INTEGER AS adjusted_duration,
    t.intensity,
    -- Suggest intensity downgrade if low recovery
    CASE
      WHEN v_recovery_state = 'low' AND t.intensity = 'high' THEN 'low'
      WHEN v_recovery_state = 'low' AND t.intensity = 'medium' THEN 'low'
      WHEN v_recovery_state = 'optimal' AND t.intensity = 'medium' THEN 'high'
      ELSE t.intensity
    END AS suggested_intensity,
    t.current_streak,
    -- Provide contextual recommendation
    CASE v_recovery_state
      WHEN 'optimal' THEN 'Push your limits today'
      WHEN 'moderate' THEN 'Steady effort, listen to your body'
      WHEN 'low' THEN 'Active recovery focus - prioritize rest'
    END AS recommendation,
    -- Check if task is optimal for current time of day
    CASE
      WHEN t.optimal_time_of_day IS NULL THEN true
      WHEN v_current_hour BETWEEN 6 AND 10 AND 'morning' = ANY(t.optimal_time_of_day) THEN true
      WHEN v_current_hour BETWEEN 10 AND 14 AND 'midday' = ANY(t.optimal_time_of_day) THEN true
      WHEN v_current_hour BETWEEN 14 AND 18 AND 'afternoon' = ANY(t.optimal_time_of_day) THEN true
      WHEN v_current_hour BETWEEN 18 AND 22 AND 'evening' = ANY(t.optimal_time_of_day) THEN true
      ELSE false
    END AS optimal_for_time
  FROM tasks t
  WHERE t.user_id = p_user_id
    AND t.is_active = true
    AND t.id NOT IN (
      -- Exclude already completed today
      SELECT task_id
      FROM task_completions
      WHERE user_id = p_user_id
        AND DATE(completed_at) = p_date
    )
  ORDER BY
    -- Prioritize: (1) Active streaks, (2) Optimal timing, (3) Category
    t.current_streak DESC,
    optimal_for_time DESC,
    t.category;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Trigger to update task streak on completion
CREATE OR REPLACE FUNCTION update_task_streak_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_data RECORD;
BEGIN
  -- Calculate new streak
  SELECT * INTO v_streak_data
  FROM calculate_task_streak(NEW.task_id);

  -- Update tasks table
  UPDATE tasks
  SET
    current_streak = v_streak_data.current_streak,
    longest_streak = GREATEST(longest_streak, v_streak_data.current_streak),
    last_completed_at = NEW.completed_at,
    total_completions = total_completions + 1,
    updated_at = NOW()
  WHERE id = NEW.task_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_streak_on_completion
  AFTER INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_task_streak_on_completion();

-- ============================================================================
-- SEED DATA (Optional - for development/testing)
-- ============================================================================

-- Example: Insert sample task categories for new users
-- (This would typically be done via application code, not migration)

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE tasks IS 'Master list of user tasks with streak tracking';
COMMENT ON TABLE task_completions IS 'Historical append-only log of task completions, partitioned by month';
COMMENT ON TABLE wearable_connections IS 'OAuth connections to wearable devices (Oura, Whoop, Apple Health, etc.)';
COMMENT ON TABLE wearable_data IS 'Raw time-series data from wearables, partitioned by date for performance';
COMMENT ON TABLE recovery_metrics IS 'Daily aggregated recovery scores calculated from wearable data';
COMMENT ON MATERIALIZED VIEW user_recovery_baseline IS 'Pre-computed rolling baselines (7d, 14d, 30d) for fast recovery comparisons';

COMMENT ON FUNCTION calculate_task_streak IS 'Calculate current and longest streak for a given task using window functions';
COMMENT ON FUNCTION get_adjusted_tasks IS 'Get user tasks with difficulty/duration adjusted based on recovery state and time of day';
COMMENT ON FUNCTION update_task_streak_on_completion IS 'Trigger function to automatically update task streaks on completion';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'ExtensioVitae Integrated Systems migration completed successfully';
  RAISE NOTICE 'Tables created: tasks, task_completions, wearable_connections, wearable_data, recovery_metrics';
  RAISE NOTICE 'Materialized view created: user_recovery_baseline';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'Business logic functions created for streak calculation and task adjustment';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Deploy Edge Functions for wearable sync';
  RAISE NOTICE '  2. Set up nightly cron to refresh user_recovery_baseline materialized view';
  RAISE NOTICE '  3. Implement frontend services and React components';
END $$;
