-- =====================================================
-- CHAT SYSTEM: Conversation History
-- =====================================================
-- Created: 2026-02-08
-- Purpose: Store chat messages between users and AI coach
-- =====================================================

-- Create conversation_history table
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  intent TEXT CHECK (intent IN ('state_update', 'question', 'feedback', 'command')),
  state_updates JSONB DEFAULT '{}'::jsonb,
  canon_entries_used UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id 
  ON conversation_history(user_id, created_at DESC);

-- Create index for intent filtering
CREATE INDEX IF NOT EXISTS idx_conversation_history_intent 
  ON conversation_history(intent) WHERE intent IS NOT NULL;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own conversation history
CREATE POLICY "Users can read own conversation history"
  ON conversation_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON conversation_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for chat-api)
CREATE POLICY "Service role has full access"
  ON conversation_history
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get conversation history for a user (last N messages)
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  message TEXT,
  role TEXT,
  intent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ch.id,
    ch.message,
    ch.role,
    ch.intent,
    ch.created_at
  FROM conversation_history ch
  WHERE ch.user_id = p_user_id
  ORDER BY ch.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Get conversation stats for a user
CREATE OR REPLACE FUNCTION get_conversation_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_messages', COUNT(*),
    'user_messages', COUNT(*) FILTER (WHERE role = 'user'),
    'assistant_messages', COUNT(*) FILTER (WHERE role = 'assistant'),
    'state_updates', COUNT(*) FILTER (WHERE intent = 'state_update'),
    'questions', COUNT(*) FILTER (WHERE intent = 'question'),
    'first_message_at', MIN(created_at),
    'last_message_at', MAX(created_at)
  )
  INTO v_stats
  FROM conversation_history
  WHERE user_id = p_user_id;

  RETURN v_stats;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE conversation_history IS 'Stores chat conversation history between users and AI coach';
COMMENT ON COLUMN conversation_history.role IS 'Message sender: user or assistant';
COMMENT ON COLUMN conversation_history.intent IS 'Classified intent: state_update, question, feedback, command';
COMMENT ON COLUMN conversation_history.state_updates IS 'Extracted state updates from message (if intent=state_update)';
COMMENT ON COLUMN conversation_history.canon_entries_used IS 'Array of canon entry IDs used in response generation';
