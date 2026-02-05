-- ============================================================================
-- Recovery Tracking System - Database Schema
-- Migration 021: Recovery Scores (No-Wearable Version)
-- ============================================================================
-- 
-- This migration creates the database schema for the Recovery Score feature.
-- Tracks daily recovery scores based on 3 morning questions:
-- 1. Sleep duration
-- 2. Wake-ups during night
-- 3. Subjective feeling
--
-- ============================================================================

-- ============================================================================
-- TABLE: recovery_scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS recovery_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Overall Score
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level TEXT NOT NULL CHECK (level IN ('poor', 'moderate', 'good', 'excellent')),
    
    -- Score Breakdown
    sleep_hours NUMERIC NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    sleep_quality_score INTEGER CHECK (sleep_quality_score >= 0 AND sleep_quality_score <= 30),
    feeling_score INTEGER CHECK (feeling_score >= 0 AND feeling_score <= 30),
    
    -- Raw Answers
    wake_ups INTEGER CHECK (wake_ups >= 0),
    feeling TEXT CHECK (feeling IN ('exhausted', 'neutral', 'energized')),
    
    -- Recommendations
    recommendations JSONB,
    
    -- Auto-Swap Applied
    tasks_swapped BOOLEAN DEFAULT FALSE,
    swap_count INTEGER DEFAULT 0,
    swap_details JSONB,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_recovery_scores_user_id ON recovery_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_recorded_at ON recovery_scores(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_user_date ON recovery_scores(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_level ON recovery_scores(level);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_score ON recovery_scores(score);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recovery scores"
    ON recovery_scores FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery scores"
    ON recovery_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery scores"
    ON recovery_scores FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recovery scores"
    ON recovery_scores FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get today's recovery score
CREATE OR REPLACE FUNCTION get_today_recovery_score(p_user_id UUID)
RETURNS TABLE (
    score INTEGER,
    level TEXT,
    sleep_hours NUMERIC,
    feeling TEXT,
    recorded_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.score,
        rs.level,
        rs.sleep_hours,
        rs.feeling,
        rs.recorded_at
    FROM recovery_scores rs
    WHERE rs.user_id = p_user_id
    AND rs.recorded_at >= CURRENT_DATE
    ORDER BY rs.recorded_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate recovery trend
CREATE OR REPLACE FUNCTION calculate_recovery_trend(p_user_id UUID, p_days INTEGER DEFAULT 14)
RETURNS TABLE (
    trend TEXT,
    recent_average NUMERIC,
    previous_average NUMERIC,
    change NUMERIC,
    percent_change NUMERIC
) AS $$
DECLARE
    v_recent_avg NUMERIC;
    v_previous_avg NUMERIC;
    v_change NUMERIC;
    v_percent_change NUMERIC;
    v_trend TEXT;
BEGIN
    -- Calculate recent average (last 7 days)
    SELECT AVG(score) INTO v_recent_avg
    FROM recovery_scores
    WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE - INTERVAL '7 days'
    AND recorded_at < CURRENT_DATE;
    
    -- Calculate previous average (days 8-14)
    SELECT AVG(score) INTO v_previous_avg
    FROM recovery_scores
    WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE - INTERVAL '14 days'
    AND recorded_at < CURRENT_DATE - INTERVAL '7 days';
    
    -- If not enough data
    IF v_recent_avg IS NULL OR v_previous_avg IS NULL THEN
        RETURN QUERY SELECT 
            'insufficient_data'::TEXT,
            v_recent_avg,
            v_previous_avg,
            0::NUMERIC,
            0::NUMERIC;
        RETURN;
    END IF;
    
    -- Calculate change
    v_change := v_recent_avg - v_previous_avg;
    v_percent_change := (v_change / v_previous_avg) * 100;
    
    -- Determine trend
    IF v_percent_change > 5 THEN
        v_trend := 'improving';
    ELSIF v_percent_change < -5 THEN
        v_trend := 'declining';
    ELSE
        v_trend := 'stable';
    END IF;
    
    RETURN QUERY SELECT 
        v_trend,
        ROUND(v_recent_avg, 1),
        ROUND(v_previous_avg, 1),
        ROUND(v_change, 1),
        ROUND(v_percent_change, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recovery statistics
CREATE OR REPLACE FUNCTION get_recovery_statistics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_entries INTEGER,
    average_score NUMERIC,
    best_score INTEGER,
    worst_score INTEGER,
    poor_days INTEGER,
    moderate_days INTEGER,
    good_days INTEGER,
    excellent_days INTEGER,
    average_sleep_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER AS total_entries,
        ROUND(AVG(score), 1) AS average_score,
        MAX(score) AS best_score,
        MIN(score) AS worst_score,
        COUNT(*) FILTER (WHERE level = 'poor')::INTEGER AS poor_days,
        COUNT(*) FILTER (WHERE level = 'moderate')::INTEGER AS moderate_days,
        COUNT(*) FILTER (WHERE level = 'good')::INTEGER AS good_days,
        COUNT(*) FILTER (WHERE level = 'excellent')::INTEGER AS excellent_days,
        ROUND(AVG(sleep_hours), 1) AS average_sleep_hours
    FROM recovery_scores
    WHERE user_id = p_user_id
    AND recorded_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recovery_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recovery_scores_updated_at_trigger
    BEFORE UPDATE ON recovery_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_scores_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Latest recovery scores (last 30 days)
CREATE OR REPLACE VIEW recent_recovery_scores AS
SELECT 
    id,
    user_id,
    score,
    level,
    sleep_hours,
    wake_ups,
    feeling,
    tasks_swapped,
    swap_count,
    recorded_at::DATE AS date,
    recorded_at
FROM recovery_scores
WHERE recorded_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY recorded_at DESC;

-- View: Recovery score summary by user
CREATE OR REPLACE VIEW recovery_score_summary AS
SELECT 
    user_id,
    COUNT(*) AS total_entries,
    ROUND(AVG(score), 1) AS average_score,
    MAX(score) AS best_score,
    MIN(score) AS worst_score,
    ROUND(AVG(sleep_hours), 1) AS average_sleep_hours,
    COUNT(*) FILTER (WHERE level = 'poor') AS poor_days,
    COUNT(*) FILTER (WHERE level = 'moderate') AS moderate_days,
    COUNT(*) FILTER (WHERE level = 'good') AS good_days,
    COUNT(*) FILTER (WHERE level = 'excellent') AS excellent_days,
    MAX(recorded_at) AS last_entry
FROM recovery_scores
WHERE recorded_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- NOTE: One recovery score per user per day is enforced in application code
-- PostgreSQL doesn't allow DATE() or ::DATE in unique indexes (not IMMUTABLE)
-- Alternative: Check for existing score before insert in the application

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE recovery_scores IS 'Daily recovery scores based on 3-question morning check-in';
COMMENT ON COLUMN recovery_scores.score IS 'Overall recovery score (0-100)';
COMMENT ON COLUMN recovery_scores.level IS 'Recovery level: poor, moderate, good, excellent';
COMMENT ON COLUMN recovery_scores.sleep_hours IS 'Hours slept (from user input)';
COMMENT ON COLUMN recovery_scores.wake_ups IS 'Number of times woken up during night';
COMMENT ON COLUMN recovery_scores.feeling IS 'Subjective feeling: exhausted, neutral, energized';
COMMENT ON COLUMN recovery_scores.tasks_swapped IS 'Whether auto-swap was applied (HIIT → Yoga Nidra)';
COMMENT ON COLUMN recovery_scores.swap_count IS 'Number of tasks swapped due to poor recovery';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO recovery_scores (user_id, score, level, sleep_hours, sleep_quality_score, feeling_score, wake_ups, feeling, recorded_at)
VALUES 
    (auth.uid(), 85, 'excellent', 8.0, 30, 30, 0, 'energized', NOW() - INTERVAL '1 day'),
    (auth.uid(), 72, 'good', 7.5, 15, 25, 1, 'energized', NOW() - INTERVAL '2 days'),
    (auth.uid(), 45, 'poor', 5.5, 0, 15, 4, 'exhausted', NOW() - INTERVAL '3 days'),
    (auth.uid(), 68, 'moderate', 7.0, 15, 20, 2, 'neutral', NOW() - INTERVAL '4 days');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration: 021_recovery_tracking.sql
-- Created: 2026-02-05
-- Description: Recovery Score tracking with 3-question morning check-in
-- Tables: recovery_scores
-- Features: RLS policies, trend analysis, statistics functions, auto-swap tracking
