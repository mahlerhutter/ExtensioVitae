// ExtensioVitae - Task Service
// Handles task CRUD, streaks, completions, and recovery-based adjustments

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Get all tasks for the current user
 */
export const getTasks = async (filters = {}) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

    // Apply filters
    if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
    }

    if (filters.category) {
        query = query.eq('category', filters.category);
    }

    if (filters.intensity) {
        query = query.eq('intensity', filters.intensity);
    }

    query = query.order('current_streak', { ascending: false });

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            user_id: user.id,
            ...taskData,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
    }

    return data;
};

/**
 * Update a task
 */
export const updateTask = async (taskId, updates) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update task: ${error.message}`);
    }

    return data;
};

/**
 * Delete a task (soft delete by setting is_active = false)
 */
export const deleteTask = async (taskId) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('tasks')
        .update({ is_active: false })
        .eq('id', taskId)
        .eq('user_id', user.id);

    if (error) {
        throw new Error(`Failed to delete task: ${error.message}`);
    }
};

/**
 * Complete a task
 */
export const completeTask = async (taskId, completionData = {}) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const now = new Date();
    const timeOfDay = getTimeOfDay(now);

    const { data, error } = await supabase
        .from('task_completions')
        .insert({
            task_id: taskId,
            user_id: user.id,
            completed_at: now.toISOString(),
            time_of_day: timeOfDay,
            ...completionData,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to complete task: ${error.message}`);
    }

    // Trigger will automatically update streak in tasks table
    return data;
};

/**
 * Get task completion history
 */
export const getTaskHistory = async (taskId, days = 30) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch task history: ${error.message}`);
    }

    return data || [];
};

/**
 * Calculate streak for a task (client-side fallback)
 */
export const calculateStreak = async (taskId) => {
    const history = await getTaskHistory(taskId, 365);

    if (!history || history.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Get unique completion dates
    const completionDates = [...new Set(
        history.map(h => new Date(h.completed_at).toISOString().split('T')[0])
    )].sort().reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Calculate current streak
    for (let i = 0; i < completionDates.length; i++) {
        const date = completionDates[i];

        if (i === 0) {
            // First date must be today or yesterday for active streak
            if (date === today || date === yesterday) {
                currentStreak = 1;
                tempStreak = 1;
            } else {
                break;
            }
        } else {
            const prevDate = completionDates[i - 1];
            const daysDiff = Math.round(
                (new Date(prevDate) - new Date(date)) / 86400000
            );

            if (daysDiff === 1) {
                currentStreak++;
                tempStreak++;
            } else {
                break;
            }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Calculate longest streak in history
    tempStreak = 1;
    for (let i = 1; i < completionDates.length; i++) {
        const date = completionDates[i];
        const prevDate = completionDates[i - 1];
        const daysDiff = Math.round(
            (new Date(prevDate) - new Date(date)) / 86400000
        );

        if (daysDiff === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    return { current: currentStreak, longest: longestStreak };
};

/**
 * Get tasks adjusted for recovery state (calls Edge Function)
 */
export const getAdjustedTasks = async (date = null) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        throw new Error('User not authenticated');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-adjusted-tasks`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: targetDate }),
    });

    if (!response.ok) {
        // Fallback: Get tasks without adjustment
        console.warn('Failed to get adjusted tasks, falling back to regular tasks');
        return await getTasks({ isActive: true });
    }

    return await response.json();
};

/**
 * Get today's completed tasks
 */
export const getTodayCompletions = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('task_completions')
        .select('*, tasks(*)')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${tomorrow}T00:00:00`)
        .order('completed_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch today's completions: ${error.message}`);
    }

    return data || [];
};

/**
 * Get task statistics
 */
export const getTaskStats = async (days = 30) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString());

    if (error) {
        throw new Error(`Failed to fetch task stats: ${error.message}`);
    }

    const completions = data || [];

    // Calculate stats
    const totalCompletions = completions.length;
    const uniqueDays = new Set(
        completions.map(c => new Date(c.completed_at).toISOString().split('T')[0])
    ).size;
    const adherenceRate = (uniqueDays / days) * 100;

    // Category breakdown
    const byCategory = completions.reduce((acc, c) => {
        const category = c.category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    return {
        totalCompletions,
        uniqueDays,
        adherenceRate: Math.round(adherenceRate),
        byCategory,
        period: `${days} days`,
    };
};

/**
 * Helper: Get time of day
 */
function getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

export default {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    getTaskHistory,
    calculateStreak,
    getAdjustedTasks,
    getTodayCompletions,
    getTaskStats,
};
