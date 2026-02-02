/**
 * Feedback Service
 * Handles user feedback collection and retrieval
 */

import { supabase } from './supabase';

/**
 * Submit user feedback
 * @param {Object} feedbackData - Feedback data
 * @param {string} feedbackData.feedback_type - Type: 'initial', 'general', 'micro', 'bug', 'feature'
 * @param {number} [feedbackData.overall_rating] - Rating 1-5 (for initial feedback)
 * @param {boolean} [feedbackData.task_helpful] - Task helpful? (for micro feedback)
 * @param {string} [feedbackData.what_you_like] - What user likes
 * @param {string} [feedbackData.what_to_improve] - What to improve
 * @param {string} [feedbackData.general_comment] - General comment
 * @param {string} [feedbackData.task_id] - Task ID (for micro feedback)
 * @param {number} [feedbackData.day_number] - Day number
 * @param {string} [feedbackData.plan_id] - Plan ID
 * @returns {Promise<Object>} Created feedback record
 */
export async function submitFeedback(feedbackData) {
    if (!supabase) {
        console.warn('[FeedbackService] Supabase not available');
        return null;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('feedback')
            .insert({
                user_id: user.id,
                ...feedbackData,
                user_agent: navigator.userAgent,
            })
            .select()
            .single();

        if (error) throw error;

        console.log('[FeedbackService] Feedback submitted:', data.id);
        return data;
    } catch (error) {
        console.error('[FeedbackService] Failed to submit feedback:', error);
        throw error;
    }
}

/**
 * Get all feedback for current user
 * @returns {Promise<Array>} User's feedback records
 */
export async function getUserFeedback() {
    if (!supabase) {
        console.warn('[FeedbackService] Supabase not available');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[FeedbackService] Failed to get user feedback:', error);
        return [];
    }
}

/**
 * Check if user has already given specific type of feedback for a plan
 * @param {string} planId - Plan ID
 * @param {string} feedbackType - Feedback type
 * @returns {Promise<boolean>} True if feedback already given
 */
export async function checkIfFeedbackGiven(planId, feedbackType) {
    if (!supabase || !planId) {
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('feedback')
            .select('id')
            .eq('plan_id', planId)
            .eq('feedback_type', feedbackType)
            .limit(1)
            .maybeSingle();

        // PGRST116 is "no rows returned" - not an error
        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return !!data;
    } catch (error) {
        console.error('[FeedbackService] Failed to check feedback:', error);
        return false;
    }
}

/**
 * Get all feedback (admin only)
 * @param {Object} filters - Optional filters
 * @param {string} [filters.feedback_type] - Filter by type
 * @param {boolean} [filters.reviewed] - Filter by reviewed status
 * @returns {Promise<Array>} All feedback records
 */
export async function getAllFeedback(filters = {}) {
    if (!supabase) {
        console.warn('[FeedbackService] Supabase not available');
        return [];
    }

    try {
        // First, get all feedback
        let query = supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.feedback_type) {
            query = query.eq('feedback_type', filters.feedback_type);
        }
        if (filters.reviewed !== undefined) {
            query = query.eq('reviewed', filters.reviewed);
        }

        const { data: feedbackData, error: feedbackError } = await query;

        if (feedbackError) throw feedbackError;

        // Then, enrich with user and plan data
        const enrichedFeedback = await Promise.all(
            (feedbackData || []).map(async (fb) => {
                // Get user profile
                const { data: userProfile } = await supabase
                    .from('user_profiles')
                    .select('email, name')
                    .eq('id', fb.user_id)
                    .single();

                // Get plan if exists
                let planData = null;
                if (fb.plan_id) {
                    const { data } = await supabase
                        .from('plans')
                        .select('created_at, plan_summary')
                        .eq('id', fb.plan_id)
                        .single();
                    planData = data;
                }

                return {
                    ...fb,
                    user: userProfile,
                    plan: planData,
                };
            })
        );

        return enrichedFeedback;
    } catch (error) {
        console.error('[FeedbackService] Failed to get all feedback:', error);
        return [];
    }
}

/**
 * Mark feedback as reviewed (admin only)
 * @param {string} feedbackId - Feedback ID
 * @param {string} [adminNotes] - Optional admin notes
 * @returns {Promise<Object>} Updated feedback record
 */
export async function markFeedbackReviewed(feedbackId, adminNotes = null) {
    if (!supabase) {
        console.warn('[FeedbackService] Supabase not available');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('feedback')
            .update({
                reviewed: true,
                admin_notes: adminNotes,
            })
            .eq('id', feedbackId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[FeedbackService] Failed to mark feedback as reviewed:', error);
        throw error;
    }
}

/**
 * Get feedback statistics (admin only)
 * @returns {Promise<Object>} Feedback statistics
 */
export async function getFeedbackStats() {
    if (!supabase) {
        return {
            total: 0,
            byType: {},
            avgRating: 0,
            unreviewed: 0,
        };
    }

    try {
        const { data: allFeedback, error } = await supabase
            .from('feedback')
            .select('feedback_type, overall_rating, reviewed');

        if (error) throw error;

        const stats = {
            total: allFeedback.length,
            byType: {},
            avgRating: 0,
            unreviewed: 0,
        };

        // Calculate stats
        let totalRating = 0;
        let ratingCount = 0;

        allFeedback.forEach(fb => {
            // Count by type
            stats.byType[fb.feedback_type] = (stats.byType[fb.feedback_type] || 0) + 1;

            // Average rating
            if (fb.overall_rating) {
                totalRating += fb.overall_rating;
                ratingCount++;
            }

            // Unreviewed count
            if (!fb.reviewed) {
                stats.unreviewed++;
            }
        });

        stats.avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

        return stats;
    } catch (error) {
        console.error('[FeedbackService] Failed to get feedback stats:', error);
        return {
            total: 0,
            byType: {},
            avgRating: 0,
            unreviewed: 0,
        };
    }
}
