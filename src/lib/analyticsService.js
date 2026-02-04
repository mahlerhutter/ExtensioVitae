/**
 * ExtensioVitae Analytics Service
 *
 * Progress tracking, aggregates, and achievements.
 * Part of Phase 3: Progress Analytics
 */

import { supabase } from './supabase';

// Achievement definitions
const ACHIEVEMENTS = {
  streak_3: { name_de: '3-Tage Streak', name_en: '3-Day Streak', icon: '🔥', threshold: 3 },
  streak_7: { name_de: '7-Tage Streak', name_en: '7-Day Streak', icon: '🔥🔥', threshold: 7 },
  streak_14: { name_de: '14-Tage Streak', name_en: '14-Day Streak', icon: '🔥🔥🔥', threshold: 14 },
  streak_30: { name_de: '30-Tage Streak', name_en: '30-Day Streak', icon: '⭐', threshold: 30 },
  streak_60: { name_de: '60-Tage Streak', name_en: '60-Day Streak', icon: '⭐⭐', threshold: 60 },
  streak_90: { name_de: '90-Tage Streak', name_en: '90-Day Streak', icon: '🏆', threshold: 90 },
  tasks_10: { name_de: '10 Tasks', name_en: '10 Tasks', icon: '✓', threshold: 10 },
  tasks_50: { name_de: '50 Tasks', name_en: '50 Tasks', icon: '✓✓', threshold: 50 },
  tasks_100: { name_de: '100 Tasks', name_en: '100 Tasks', icon: '💪', threshold: 100 },
  tasks_500: { name_de: '500 Tasks', name_en: '500 Tasks', icon: '💪💪', threshold: 500 },
  tasks_1000: { name_de: '1000 Tasks', name_en: '1000 Tasks', icon: '🎖️', threshold: 1000 },
  perfect_day: { name_de: 'Perfect Day', name_en: 'Perfect Day', icon: '🌟' },
  perfect_week: { name_de: 'Perfect Week', name_en: 'Perfect Week', icon: '🌟🌟' },
  module_completed: { name_de: 'Modul abgeschlossen', name_en: 'Module Completed', icon: '🎯' },
  first_blood_check: { name_de: 'Erstes Blutbild', name_en: 'First Blood Check', icon: '🩸' },
  blood_check_improved: { name_de: 'Blutwerte verbessert', name_en: 'Blood Values Improved', icon: '📈' }
};

// =====================================================
// PROGRESS AGGREGATES
// =====================================================

/**
 * Calculate and store weekly aggregate
 * @param {string} userId - User ID
 * @param {Date} weekStart - Start of week (Monday)
 * @returns {Promise<Object>}
 */
export async function calculateWeeklyAggregate(userId, weekStart = null) {
  try {
    // Default to current week
    if (!weekStart) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart = new Date(today.setDate(diff));
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startStr = formatDate(weekStart);
    const endStr = formatDate(weekEnd);

    // Get daily tracking data
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_tracking')
      .select('tracking_date, tasks_total, tasks_completed, completion_percentage')
      .eq('user_id', userId)
      .gte('tracking_date', startStr)
      .lte('tracking_date', endStr);

    if (dailyError) throw dailyError;

    // Get task completions for pillar breakdown
    const { data: taskData, error: taskError } = await supabase
      .from('task_completions')
      .select('pillar, source_module, status, duration_minutes')
      .eq('user_id', userId)
      .in('status', ['completed'])
      .gte('created_at', `${startStr}T00:00:00`)
      .lte('created_at', `${endStr}T23:59:59`);

    if (taskError) throw taskError;

    // Calculate metrics
    const tasksTotal = dailyData?.reduce((sum, d) => sum + (d.tasks_total || 0), 0) || 0;
    const tasksCompleted = dailyData?.reduce((sum, d) => sum + (d.tasks_completed || 0), 0) || 0;
    const totalTime = taskData?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0;
    const daysTracked = dailyData?.length || 0;

    // Pillar breakdown
    const pillarBreakdown = {};
    taskData?.forEach(t => {
      const pillar = t.pillar || 'other';
      pillarBreakdown[pillar] = (pillarBreakdown[pillar] || 0) + 1;
    });

    // Module breakdown
    const moduleBreakdown = {};
    taskData?.forEach(t => {
      const module = t.source_module || 'other';
      moduleBreakdown[module] = (moduleBreakdown[module] || 0) + 1;
    });

    // Calculate streak
    const streak = await calculateStreak(userId);

    // Get previous week for trend
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const { data: prevAggregate } = await supabase
      .from('progress_aggregates')
      .select('completion_rate')
      .eq('user_id', userId)
      .eq('period_type', 'week')
      .eq('period_start', formatDate(prevWeekStart))
      .single();

    const currentRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
    const prevRate = prevAggregate?.completion_rate || 0;
    const completionTrend = prevRate > 0 ? ((currentRate - prevRate) / prevRate) * 100 : 0;

    // Upsert aggregate
    const { data, error } = await supabase
      .from('progress_aggregates')
      .upsert({
        user_id: userId,
        period_type: 'week',
        period_start: startStr,
        period_end: endStr,
        tasks_total: tasksTotal,
        tasks_completed: tasksCompleted,
        completion_rate: currentRate,
        total_time_minutes: totalTime,
        avg_daily_time_minutes: daysTracked > 0 ? totalTime / daysTracked : 0,
        current_streak: streak,
        pillar_breakdown: pillarBreakdown,
        module_breakdown: moduleBreakdown,
        completion_trend: completionTrend
      }, {
        onConflict: 'user_id,period_type,period_start'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error calculating weekly aggregate:', error);
    return null;
  }
}

/**
 * Get progress overview for dashboard
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getProgressOverview(userId) {
  try {
    const today = new Date();

    // Get current week aggregate
    const weekAggregate = await calculateWeeklyAggregate(userId);

    // Get streak
    const streak = await calculateStreak(userId);

    // Get total stats
    const { data: totalStats, error: statsError } = await supabase
      .from('task_completions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (statsError) throw statsError;

    // Get recent achievements
    const { data: recentAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(5);

    // Get pillar distribution (all time)
    const { data: pillarData } = await supabase
      .from('task_completions')
      .select('pillar')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const pillarDistribution = {};
    pillarData?.forEach(t => {
      const pillar = t.pillar || 'other';
      pillarDistribution[pillar] = (pillarDistribution[pillar] || 0) + 1;
    });

    return {
      currentStreak: streak,
      totalTasksCompleted: totalStats?.length || 0,
      thisWeek: weekAggregate,
      recentAchievements: recentAchievements?.map(a => ({
        ...a,
        ...ACHIEVEMENTS[a.achievement_type]
      })) || [],
      pillarDistribution
    };
  } catch (error) {
    console.error('Error getting progress overview:', error);
    return {
      currentStreak: 0,
      totalTasksCompleted: 0,
      thisWeek: null,
      recentAchievements: [],
      pillarDistribution: {}
    };
  }
}

/**
 * Calculate current streak
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export async function calculateStreak(userId) {
  try {
    const { data, error } = await supabase
      .from('daily_tracking')
      .select('tracking_date, tasks_completed')
      .eq('user_id', userId)
      .order('tracking_date', { ascending: false })
      .limit(90);

    if (error) throw error;

    let streak = 0;
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    for (const record of data || []) {
      // Allow for today or yesterday to start counting
      if (streak === 0 && record.tracking_date !== today && record.tracking_date !== yesterday) {
        break;
      }

      if (record.tasks_completed > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

// =====================================================
// ACHIEVEMENTS
// =====================================================

/**
 * Check and award achievements
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function checkAndAwardAchievements(userId) {
  try {
    const newAchievements = [];

    // Get existing achievements
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('achievement_type')
      .eq('user_id', userId);

    const existingTypes = new Set(existing?.map(a => a.achievement_type) || []);

    // Check streak achievements
    const streak = await calculateStreak(userId);
    const streakAchievements = ['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_90'];

    for (const type of streakAchievements) {
      if (!existingTypes.has(type) && streak >= ACHIEVEMENTS[type].threshold) {
        newAchievements.push({
          user_id: userId,
          achievement_type: type,
          achievement_value: streak
        });
      }
    }

    // Check task count achievements
    const { count: taskCount } = await supabase
      .from('task_completions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed');

    const taskAchievements = ['tasks_10', 'tasks_50', 'tasks_100', 'tasks_500', 'tasks_1000'];

    for (const type of taskAchievements) {
      if (!existingTypes.has(type) && taskCount >= ACHIEVEMENTS[type].threshold) {
        newAchievements.push({
          user_id: userId,
          achievement_type: type,
          achievement_value: taskCount
        });
      }
    }

    // Check perfect day (all tasks completed today)
    const today = formatDate(new Date());
    const { data: todayTracking } = await supabase
      .from('daily_tracking')
      .select('tasks_total, tasks_completed')
      .eq('user_id', userId)
      .eq('tracking_date', today)
      .single();

    if (todayTracking && todayTracking.tasks_total > 0 &&
        todayTracking.tasks_completed === todayTracking.tasks_total &&
        !existingTypes.has('perfect_day')) {
      newAchievements.push({
        user_id: userId,
        achievement_type: 'perfect_day'
      });
    }

    // Award new achievements
    if (newAchievements.length > 0) {
      const { error } = await supabase
        .from('user_achievements')
        .insert(newAchievements);

      if (error) throw error;
    }

    return newAchievements.map(a => ({
      ...a,
      ...ACHIEVEMENTS[a.achievement_type]
    }));
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Get all user achievements
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getUserAchievements(userId) {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return data?.map(a => ({
      ...a,
      ...ACHIEVEMENTS[a.achievement_type]
    })) || [];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
}

// =====================================================
// CHARTS DATA
// =====================================================

/**
 * Get completion history for chart
 * @param {string} userId - User ID
 * @param {number} days - Number of days
 * @returns {Promise<Array>}
 */
export async function getCompletionHistory(userId, days = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_tracking')
      .select('tracking_date, tasks_total, tasks_completed, completion_percentage')
      .eq('user_id', userId)
      .gte('tracking_date', formatDate(startDate))
      .lte('tracking_date', formatDate(endDate))
      .order('tracking_date', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching completion history:', error);
    return [];
  }
}

/**
 * Get pillar progress over time
 * @param {string} userId - User ID
 * @param {number} weeks - Number of weeks
 * @returns {Promise<Array>}
 */
export async function getPillarProgressHistory(userId, weeks = 4) {
  try {
    const { data, error } = await supabase
      .from('progress_aggregates')
      .select('period_start, pillar_breakdown')
      .eq('user_id', userId)
      .eq('period_type', 'week')
      .order('period_start', { ascending: false })
      .limit(weeks);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching pillar history:', error);
    return [];
  }
}

// =====================================================
// HELPERS
// =====================================================

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export default {
  calculateWeeklyAggregate,
  getProgressOverview,
  calculateStreak,
  checkAndAwardAchievements,
  getUserAchievements,
  getCompletionHistory,
  getPillarProgressHistory,
  ACHIEVEMENTS
};
