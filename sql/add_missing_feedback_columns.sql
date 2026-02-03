-- Fix: Add Missing Columns to Existing Feedback Table
-- Run this in Supabase SQL Editor

-- Add missing columns (IF NOT EXISTS prevents errors if they already exist)
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5);

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS task_helpful BOOLEAN;

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS what_you_like TEXT;

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS what_to_improve TEXT;

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS general_comment TEXT;

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS task_id TEXT;

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS day_number INTEGER CHECK (day_number >= 1 AND day_number <= 30);

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;
