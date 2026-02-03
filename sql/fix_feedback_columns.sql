-- Quick Fix: Check and Add Missing Columns to Feedback Table
-- Run this in Supabase SQL Editor

-- First, check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- If overall_rating is missing, add it:
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feedback'
ORDER BY ordinal_position;
