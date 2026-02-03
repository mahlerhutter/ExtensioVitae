-- COMPLETE Feedback Table Setup
-- Run this if the feedback table doesn't exist or is incomplete
-- This is from migration 003 but can be run standalone

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  
  -- Feedback Type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('initial', 'general', 'micro', 'bug', 'feature')),
  
  -- Ratings
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  task_helpful BOOLEAN,
  
  -- Text Feedback
  what_you_like TEXT,
  what_to_improve TEXT,
  general_comment TEXT,
  
  -- Context
  task_id TEXT,
  day_number INTEGER CHECK (day_number >= 1 AND day_number <= 30),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  
  -- Admin
  reviewed BOOLEAN DEFAULT FALSE,
  admin_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_plan_id ON feedback(plan_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed ON feedback(reviewed);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- Create policies
-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- All authenticated users can view all feedback (admin check in frontend)
CREATE POLICY "Authenticated users can view all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can update feedback (admin check in frontend)
CREATE POLICY "Authenticated users can update feedback"
  ON feedback FOR UPDATE
  TO authenticated
  USING (true);

-- Add comments
COMMENT ON TABLE feedback IS 'User feedback on plans and tasks';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback: initial (after plan creation), general, micro (task-specific), bug, feature';
COMMENT ON COLUMN feedback.overall_rating IS 'Overall satisfaction rating from 1-5 stars';
COMMENT ON COLUMN feedback.task_helpful IS 'Whether a specific task was helpful (for micro-feedback)';
COMMENT ON COLUMN feedback.reviewed IS 'Whether admin has reviewed this feedback';
