-- Verify conversation history from chat-api tests
SELECT 
    id,
    user_id,
    role,
    LEFT(message, 100) as message_preview,
    intent,
    state_updates,
    canon_entries_used,
    created_at
FROM conversation_history 
WHERE user_id = '5f42bdcb95ea' 
ORDER BY created_at DESC 
LIMIT 10;

-- Count total messages
SELECT 
    role,
    COUNT(*) as count
FROM conversation_history
WHERE user_id = '5f42bdcb95ea'
GROUP BY role;

-- Check which canon entries were used
SELECT 
    UNNEST(canon_entries_used) as canon_entry_id,
    COUNT(*) as usage_count
FROM conversation_history
WHERE user_id = '5f42bdcb95ea'
AND canon_entries_used IS NOT NULL
AND array_length(canon_entries_used, 1) > 0
GROUP BY canon_entry_id
ORDER BY usage_count DESC;
