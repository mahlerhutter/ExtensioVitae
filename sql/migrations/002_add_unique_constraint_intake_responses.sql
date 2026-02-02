-- Migration: Add unique constraint to intake_responses.user_id
-- Date: 2026-02-02
-- Purpose: Fix upsert operation for intake data syncing

-- Add unique constraint on user_id
-- This allows the upsert operation in saveIntakeToSupabase to work correctly
ALTER TABLE intake_responses
ADD CONSTRAINT intake_responses_user_id_key UNIQUE (user_id);

-- Note: This assumes each user should only have ONE intake response
-- If you need to track multiple intake responses per user (history), 
-- you would need to modify the upsert logic instead
