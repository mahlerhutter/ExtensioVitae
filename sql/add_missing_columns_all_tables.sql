-- Fix Existing Tables: Add Missing Columns
-- Run this in Supabase SQL Editor
-- This adds columns that might be missing without recreating tables

-- =============================================
-- INTAKE_RESPONSES - Check and add columns
-- =============================================
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='name') THEN
        ALTER TABLE intake_responses ADD COLUMN name TEXT NOT NULL DEFAULT 'Unknown';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='age') THEN
        ALTER TABLE intake_responses ADD COLUMN age INTEGER NOT NULL DEFAULT 30;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='gender') THEN
        ALTER TABLE intake_responses ADD COLUMN gender TEXT NOT NULL DEFAULT 'other';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='primary_goal') THEN
        ALTER TABLE intake_responses ADD COLUMN primary_goal TEXT NOT NULL DEFAULT 'general_health';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='daily_time_budget') THEN
        ALTER TABLE intake_responses ADD COLUMN daily_time_budget INTEGER NOT NULL DEFAULT 15;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='sleep_hours_bucket') THEN
        ALTER TABLE intake_responses ADD COLUMN sleep_hours_bucket TEXT NOT NULL DEFAULT '7-8';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='stress_1_10') THEN
        ALTER TABLE intake_responses ADD COLUMN stress_1_10 INTEGER NOT NULL DEFAULT 5;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='training_frequency') THEN
        ALTER TABLE intake_responses ADD COLUMN training_frequency TEXT NOT NULL DEFAULT 'rarely';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='equipment_access') THEN
        ALTER TABLE intake_responses ADD COLUMN equipment_access TEXT NOT NULL DEFAULT 'none';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='diet_pattern') THEN
        ALTER TABLE intake_responses ADD COLUMN diet_pattern JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='submitted_at') THEN
        ALTER TABLE intake_responses ADD COLUMN submitted_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_responses' AND column_name='created_at') THEN
        ALTER TABLE intake_responses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =============================================
-- DAILY_PROGRESS - Check structure
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_progress' AND column_name='plan_id') THEN
        ALTER TABLE daily_progress ADD COLUMN plan_id UUID REFERENCES plans(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_progress' AND column_name='tasks_completed') THEN
        ALTER TABLE daily_progress ADD COLUMN tasks_completed INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_progress' AND column_name='created_at') THEN
        ALTER TABLE daily_progress ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =============================================
-- PLANS - Check structure
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='user_id') THEN
        ALTER TABLE plans ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='plan_data') THEN
        ALTER TABLE plans ADD COLUMN plan_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='status') THEN
        ALTER TABLE plans ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='created_at') THEN
        ALTER TABLE plans ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

SELECT 'Missing columns added successfully!' as status;

-- Now show what we have
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('intake_responses', 'daily_progress', 'plans', 'feedback')
ORDER BY table_name, ordinal_position;
