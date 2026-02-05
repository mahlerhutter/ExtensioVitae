-- Rollback + Clean Migration: recovery_scores table
-- Date: 2026-02-05
-- Purpose: Drop existing table and recreate with correct schema

-- Step 1: Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS recovery_scores CASCADE;
DROP FUNCTION IF EXISTS update_recovery_scores_updated_at CASCADE;

-- Step 2: Create recovery_scores table with correct schema
CREATE TABLE recovery_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Recovery Score Data
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level TEXT NOT NULL CHECK (level IN ('poor', 'moderate', 'good', 'excellent')),
    
    -- Breakdown
    sleep_hours INTEGER NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 40),
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 0 AND sleep_quality <= 30),
    feeling INTEGER NOT NULL CHECK (feeling >= 0 AND feeling <= 30),
    
    -- Recommendations (JSONB for flexibility)
    recommendations JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_date UNIQUE (user_id, check_in_date)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_recovery_scores_user_id ON recovery_scores(user_id);
CREATE INDEX idx_recovery_scores_recorded_at ON recovery_scores(recorded_at DESC);
CREATE INDEX idx_recovery_scores_user_date ON recovery_scores(user_id, check_in_date);

-- Step 4: Enable Row Level Security
ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
-- Users can only see their own recovery scores
CREATE POLICY "Users can view own recovery scores"
    ON recovery_scores
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own recovery scores
CREATE POLICY "Users can insert own recovery scores"
    ON recovery_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own recovery scores (same day only)
CREATE POLICY "Users can update own recovery scores"
    ON recovery_scores
    FOR UPDATE
    USING (auth.uid() = user_id AND check_in_date = CURRENT_DATE);

-- Users can delete their own recovery scores
CREATE POLICY "Users can delete own recovery scores"
    ON recovery_scores
    FOR DELETE
    USING (auth.uid() = user_id);

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_recovery_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recovery_scores_updated_at
    BEFORE UPDATE ON recovery_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_recovery_scores_updated_at();

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON recovery_scores TO authenticated;

-- Step 8: Add comments
COMMENT ON TABLE recovery_scores IS 'Daily morning check-in recovery scores for users';
COMMENT ON COLUMN recovery_scores.score IS 'Total recovery score (0-100)';
COMMENT ON COLUMN recovery_scores.level IS 'Recovery level: poor, moderate, good, excellent';
COMMENT ON COLUMN recovery_scores.sleep_hours IS 'Sleep duration score (0-40 points)';
COMMENT ON COLUMN recovery_scores.sleep_quality IS 'Sleep quality score based on wake-ups (0-30 points)';
COMMENT ON COLUMN recovery_scores.feeling IS 'Subjective feeling score (0-30 points)';
COMMENT ON COLUMN recovery_scores.recommendations IS 'Personalized recommendations (JSONB array)';
COMMENT ON COLUMN recovery_scores.check_in_date IS 'Date of check-in (YYYY-MM-DD)';
COMMENT ON COLUMN recovery_scores.recorded_at IS 'Timestamp when check-in was recorded';
