-- Migration 015: Active Protocols Architecture
-- Supports persistent "One-Tap" protocol packs with task tracking

CREATE TABLE IF NOT EXISTS active_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_id TEXT NOT NULL, -- e.g., 'immune-shield', 'deep-work'
    protocol_name TEXT NOT NULL,
    protocol_icon TEXT,
    protocol_category TEXT,
    
    -- Snapshot of protocol state
    tasks JSONB NOT NULL DEFAULT '[]',
    task_completion_status JSONB NOT NULL DEFAULT '{}', -- maps task_id -> {completed: bool, completed_at: timestamp}
    
    -- Metadata
    duration_hours INTEGER NOT NULL,
    impact_score INTEGER,
    science_ref TEXT,
    
    -- Stats
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    
    -- Lifecycle
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deactivated', 'expired')),
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_active_protocols_user ON active_protocols(user_id, status);
CREATE INDEX IF NOT EXISTS idx_active_protocols_expiry ON active_protocols(expires_at);

-- RLS Policies
ALTER TABLE active_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own protocols"
    ON active_protocols FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own protocols"
    ON active_protocols FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own protocols"
    ON active_protocols FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_active_protocols_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_active_protocols_updated_at
BEFORE UPDATE ON active_protocols
FOR EACH ROW
EXECUTE FUNCTION update_active_protocols_updated_at();
