/**
 * Chat Service - RAG + Chat API Integration
 * Handles communication with chat-api, state-api, and conversation history
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Send a message to the chat API
 * @param {string} userId - User UUID
 * @param {string} message - User message
 * @returns {Promise<{success: boolean, response: string}>}
 */
export async function sendMessage(userId, message) {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-api`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId, message }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send message');
        }

        return await response.json();
    } catch (error) {
        console.error('Chat API error:', error);
        throw error;
    }
}

/**
 * Get conversation history for a user
 * @param {string} userId - User UUID
 * @param {number} limit - Max messages to fetch
 * @returns {Promise<Array>}
 */
export async function getConversationHistory(userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('conversation_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Failed to load conversation history:', error);
        throw error;
    }
}

/**
 * Get user state from state-api
 * @param {string} userId - User UUID
 * @returns {Promise<Object>}
 */
export async function getUserState(userId) {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/state-api`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'get_state', user_id: userId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get user state');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('State API error:', error);
        throw error;
    }
}

/**
 * Search canon entries
 * @param {string} query - Search query
 * @param {number} topK - Number of results
 * @param {string} domain - Optional domain filter
 * @returns {Promise<Array>}
 */
export async function searchCanon(query, topK = 3, domain = null) {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/canon-api`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'semantic_search',
                query,
                top_k: topK,
                domain,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to search canon');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('Canon API error:', error);
        throw error;
    }
}

/**
 * Subscribe to new messages in real-time
 * @param {string} userId - User UUID
 * @param {Function} callback - Called when new message arrives
 * @returns {Function} Unsubscribe function
 */
export function subscribeToMessages(userId, callback) {
    const subscription = supabase
        .channel('conversation_history')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'conversation_history',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}
