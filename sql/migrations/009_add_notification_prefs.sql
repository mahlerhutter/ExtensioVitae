-- Migration 009: Add Notification Preferences
-- Adds JSONB column to user_profiles to store messaging settings

-- 1. Add column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email": {
    "enabled": true, 
    "types": ["weekly_report", "system"]
  },
  "telegram": {
    "enabled": false, 
    "chat_id": null, 
    "username": null
  },
  "sms": {
    "enabled": false, 
    "phone": null, 
    "types": ["daily_briefing"]
  }
}';

-- 2. Add Telegram verification status (optional but good for UI)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS telegram_connected BOOLEAN DEFAULT FALSE;

-- 3. Comment on column
COMMENT ON COLUMN user_profiles.notification_preferences IS 'Stores settings for Email, Telegram, and SMS channels';
