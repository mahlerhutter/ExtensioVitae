-- Fix: Update feedback_type check constraint
-- Run this in Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS valid_feedback_type;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_type_check;
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_feedback_type_check;

-- Create new constraint with all valid types
ALTER TABLE feedback ADD CONSTRAINT valid_feedback_type 
  CHECK (feedback_type IN ('initial', 'general', 'micro', 'bug', 'feature'));

SELECT 'Constraint updated successfully!' as status;
