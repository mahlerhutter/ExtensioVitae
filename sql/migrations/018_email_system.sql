-- Email System Database Migration
-- Version: 018
-- Created: 2026-02-04

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT,
  status TEXT DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Add email preferences to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "transactional": true,
  "nudges": true,
  "weekly_summary": true,
  "marketing": false
}'::jsonb;

-- Add email verification status
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- RLS Policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert email logs
CREATE POLICY "Service role can insert email logs"
  ON email_logs
  FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE email_logs IS 'Tracks all emails sent via Resend API';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: welcome, plan_delivery, daily_nudge, weekly_summary, password_reset';
COMMENT ON COLUMN email_logs.resend_id IS 'Resend API email ID for tracking';
COMMENT ON COLUMN email_logs.status IS 'Email status: sent, delivered, opened, clicked, bounced, failed';
COMMENT ON COLUMN user_profiles.email_preferences IS 'User email notification preferences';
