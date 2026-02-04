-- Calendar API Integration - Database Schema
-- Created: 2026-02-04
-- Purpose: Store calendar connections, events, and detections

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: calendar_connections
-- Stores OAuth tokens for calendar providers
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT, -- OAuth scopes granted
  email TEXT, -- Calendar email address
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider) -- One connection per provider per user
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id 
  ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_expires_at 
  ON calendar_connections(expires_at) WHERE is_active = true;

-- =====================================================
-- TABLE: calendar_events
-- Stores synced calendar events
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL, -- Provider's event ID
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional event data
  is_all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, event_id) -- Prevent duplicates
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id 
  ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time 
  ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_connection_id 
  ON calendar_events(connection_id);

-- =====================================================
-- TABLE: calendar_detections
-- Stores detected patterns (flights, focus blocks, etc.)
-- For H3 data collection and analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  detection_type TEXT NOT NULL CHECK (detection_type IN ('flight', 'focus_block', 'busy_week', 'doctor_appointment', 'other')),
  confidence FLOAT CHECK (confidence >= 0.0 AND confidence <= 1.0),
  metadata JSONB DEFAULT '{}'::jsonb, -- Detection-specific data
  mode_activated TEXT, -- Which Emergency Mode was triggered
  mode_activation_time TIMESTAMPTZ, -- When mode was activated
  user_dismissed BOOLEAN DEFAULT false, -- User dismissed auto-activation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_calendar_detections_user_id 
  ON calendar_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_detections_type 
  ON calendar_detections(detection_type);
CREATE INDEX IF NOT EXISTS idx_calendar_detections_created_at 
  ON calendar_detections(created_at);

-- =====================================================
-- TABLE: calendar_settings
-- User preferences for calendar integration
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  auto_activate_travel BOOLEAN DEFAULT true,
  auto_activate_deep_work BOOLEAN DEFAULT true,
  auto_activate_sick BOOLEAN DEFAULT false,
  alert_busy_weeks BOOLEAN DEFAULT true,
  sync_frequency_hours INTEGER DEFAULT 6 CHECK (sync_frequency_hours >= 1 AND sync_frequency_hours <= 24),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES
-- Ensure users can only access their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- calendar_connections policies
CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar connections"
  ON calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar connections"
  ON calendar_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar connections"
  ON calendar_connections FOR DELETE
  USING (auth.uid() = user_id);

-- calendar_events policies
CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- calendar_detections policies
CREATE POLICY "Users can view own calendar detections"
  ON calendar_detections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar detections"
  ON calendar_detections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar detections"
  ON calendar_detections FOR UPDATE
  USING (auth.uid() = user_id);

-- calendar_settings policies
CREATE POLICY "Users can view own calendar settings"
  ON calendar_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar settings"
  ON calendar_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar settings"
  ON calendar_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- Helper functions for calendar operations
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- Documentation for tables and columns
-- =====================================================

COMMENT ON TABLE calendar_connections IS 'OAuth connections to calendar providers (Google, Apple, Outlook)';
COMMENT ON TABLE calendar_events IS 'Synced calendar events from connected providers';
COMMENT ON TABLE calendar_detections IS 'Detected patterns in calendar events (flights, focus blocks, etc.) for H3 analytics';
COMMENT ON TABLE calendar_settings IS 'User preferences for calendar integration and auto-activation';

COMMENT ON COLUMN calendar_connections.access_token IS 'OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN calendar_connections.refresh_token IS 'OAuth refresh token for token renewal';
COMMENT ON COLUMN calendar_detections.confidence IS 'Detection confidence score (0.0 - 1.0)';
COMMENT ON COLUMN calendar_detections.mode_activated IS 'Emergency Mode that was auto-activated (TRAVEL, DEEP_WORK, etc.)';
