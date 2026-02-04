/**
 * ExtensioVitae Daily Tracking Service
 *
 * Aggregates tasks from all active modules into a daily view.
 * Respects context modes and AX-1 (Zero Cognitive Load).
 */

import { supabase } from './supabase';
import { getActiveUserModules } from './moduleService';
import { getUserMode } from './modeService';
import { generatePlanModuleTasks } from './planModuleService';

// Max tasks per day (AX-1 compliance)
const MAX_DAILY_TASKS = 8;

// =====================================================
// DAILY TRACKING
// =====================================================

/**
 * Get or generate today's tracking for a user
 * @param {string} userId - User ID
 * @param {Date} date - Date (default: today)
 * @returns {Promise<Object>}
 */
export async function getDailyTracking(userId, date = new Date()) {
  try {
    const trackingDate = formatDate(date);

    // Try to get existing tracking
    const { data: existing, error: fetchError } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('tracking_date', trackingDate)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (existing) {
      // Return existing with task completions
      const tasks = await getTaskCompletions(existing.id);
      return { ...existing, tasks };
    }

    // Generate new daily tracking
    return await generateDailyTracking(userId, date);
  } catch (error) {
    console.error('Error getting daily tracking:', error);
    return null;
  }
}

/**
 * Generate daily tracking from active modules
 * @param {string} userId - User ID
 * @param {Date} date - Date
 * @returns {Promise<Object>}
 */
export async function generateDailyTracking(userId, date = new Date()) {
  try {
    const trackingDate = formatDate(date);

    // Get user context
    const modeState = await getUserMode(userId);
    const currentMode = modeState?.current_mode || 'normal';

    // Get active modules
    const modules = await getActiveUserModules(userId);

    // Generate tasks from all modules
    const allTasks = [];

    for (const instance of modules) {
      const module = instance.module;

      // Skip if module should be paused in current mode
      if (module.affected_by_modes?.includes(currentMode)) {
        continue;
      }

      // Handle 30-day plan modules specially
      if (module.slug === '30-day-longevity') {
        try {
          const planTasks = await generatePlanModuleTasks(instance, date);
          allTasks.push(...planTasks);
        } catch (err) {
          console.error('Error generating plan module tasks:', err);
        }
        continue;
      }

      // Generate tasks from module template
      const moduleTasks = generateTasksFromModule(instance, date);
      allTasks.push(...moduleTasks);
    }

    // Sort by time, then by priority
    allTasks.sort((a, b) => {
      if (a.scheduled_time && b.scheduled_time) {
        return a.scheduled_time.localeCompare(b.scheduled_time);
      }
      if (a.scheduled_time) return -1;
      if (b.scheduled_time) return 1;
      return (b.priority || 50) - (a.priority || 50);
    });

    // Cap at MAX_DAILY_TASKS
    const limitedTasks = allTasks.slice(0, MAX_DAILY_TASKS);

    // Create daily tracking record
    const { data: tracking, error: insertError } = await supabase
      .from('daily_tracking')
      .insert({
        user_id: userId,
        tracking_date: trackingDate,
        active_mode: currentMode,
        tasks: limitedTasks,
        tasks_total: limitedTasks.length,
        tasks_completed: 0,
        completion_percentage: 0
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Create task completion records
    await createTaskCompletions(userId, tracking.id, limitedTasks);

    // Return tracking with tasks
    const tasks = await getTaskCompletions(tracking.id);
    return { ...tracking, tasks };
  } catch (error) {
    console.error('Error generating daily tracking:', error);
    return null;
  }
}

/**
 * Generate tasks from a module instance for a specific date
 * @param {Object} instance - Module instance with module definition
 * @param {Date} date - Date
 * @returns {Array}
 */
function generateTasksFromModule(instance, date) {
  const tasks = [];
  const module = instance.module;
  const template = module.task_template;
  const config = instance.config || {};

  if (!template?.tasks) return tasks;

  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const dayOfMonth = date.getDate();

  for (const taskDef of template.tasks) {
    // Check frequency
    if (taskDef.frequency === 'weekly' && taskDef.day !== dayOfWeek) {
      continue;
    }
    if (taskDef.frequency === 'monthly' && taskDef.day !== dayOfMonth) {
      continue;
    }
    if (taskDef.frequency === 'once') {
      // Check if we're on the right day of the module
      const moduleDay = calculateModuleDay(instance);
      if (taskDef.day !== moduleDay) {
        continue;
      }
    }

    // Check condition
    if (taskDef.condition && !evaluateCondition(taskDef.condition, config, instance)) {
      continue;
    }

    // Replace template variables
    const scheduledTime = resolveTemplateValue(taskDef.time, config);

    tasks.push({
      task_id: `${module.slug}-${taskDef.id}`,
      task_type: taskDef.type || 'action',
      title_de: resolveTemplateValue(taskDef.title_de, config),
      title_en: resolveTemplateValue(taskDef.title_en, config),
      description: resolveTemplateValue(taskDef.description, config),
      pillar: taskDef.pillar,
      duration_minutes: taskDef.duration_minutes || 5,
      scheduled_time: scheduledTime,
      source_module: module.slug,
      module_instance_id: instance.id,
      priority: module.priority_weight
    });
  }

  return tasks;
}

/**
 * Calculate which day of the module we're on
 */
function calculateModuleDay(instance) {
  const startDate = new Date(instance.started_at);
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Resolve template values like {{config.wake_time}}
 */
function resolveTemplateValue(value, config) {
  if (!value || typeof value !== 'string') return value;

  return value.replace(/\{\{config\.(\w+)\}\}/g, (match, key) => {
    return config[key] || match;
  }).replace(/\{\{config\.(\w+)\}\}([+-])(\d+)min/g, (match, key, op, minutes) => {
    const baseTime = config[key];
    if (!baseTime) return match;

    const [hours, mins] = baseTime.split(':').map(Number);
    const totalMins = hours * 60 + mins + (op === '+' ? parseInt(minutes) : -parseInt(minutes));
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  });
}

/**
 * Simple condition evaluator
 */
function evaluateCondition(condition, config, instance) {
  // Very basic condition evaluation
  // In production, use a proper expression parser
  if (condition.includes('config.supplements.includes')) {
    const match = condition.match(/config\.supplements\.includes\('(\w+)'\)/);
    if (match) {
      return (config.supplements || []).includes(match[1]);
    }
  }
  if (condition.includes('lab_results.deficiencies.length > 0')) {
    // Would need to fetch lab results
    return false;
  }
  return true;
}

/**
 * Create task completion records
 */
async function createTaskCompletions(userId, dailyTrackingId, tasks) {
  if (!tasks.length) return;

  const completions = tasks.map(task => ({
    user_id: userId,
    daily_tracking_id: dailyTrackingId,
    module_instance_id: task.module_instance_id,
    task_id: task.task_id,
    task_type: task.task_type,
    title_de: task.title_de,
    title_en: task.title_en,
    description: task.description,
    pillar: task.pillar,
    duration_minutes: task.duration_minutes,
    scheduled_time: task.scheduled_time,
    source_module: task.source_module,
    status: 'pending'
  }));

  const { error } = await supabase
    .from('task_completions')
    .insert(completions);

  if (error) {
    console.error('Error creating task completions:', error);
  }
}

/**
 * Get task completions for a daily tracking
 */
async function getTaskCompletions(dailyTrackingId) {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('daily_tracking_id', dailyTrackingId)
    .order('scheduled_time', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching task completions:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// TASK COMPLETION
// =====================================================

/**
 * Mark a task as completed
 * @param {string} taskCompletionId - Task completion ID
 * @returns {Promise<Object>}
 */
export async function completeTask(taskCompletionId) {
  try {
    const { data: task, error } = await supabase
      .from('task_completions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskCompletionId)
      .select()
      .single();

    if (error) throw error;

    // Update daily tracking summary
    await updateDailyTrackingSummary(task.daily_tracking_id);

    return { success: true, task };
  } catch (error) {
    console.error('Error completing task:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a task as skipped
 * @param {string} taskCompletionId - Task completion ID
 * @param {string} reason - Skip reason
 * @returns {Promise<Object>}
 */
export async function skipTask(taskCompletionId, reason = null) {
  try {
    const { data: task, error } = await supabase
      .from('task_completions')
      .update({
        status: 'skipped',
        skipped_reason: reason
      })
      .eq('id', taskCompletionId)
      .select()
      .single();

    if (error) throw error;

    // Update daily tracking summary
    await updateDailyTrackingSummary(task.daily_tracking_id);

    return { success: true, task };
  } catch (error) {
    console.error('Error skipping task:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Undo task completion (set back to pending)
 * @param {string} taskCompletionId - Task completion ID
 * @returns {Promise<Object>}
 */
export async function undoTaskCompletion(taskCompletionId) {
  try {
    const { data: task, error } = await supabase
      .from('task_completions')
      .update({
        status: 'pending',
        completed_at: null,
        skipped_reason: null
      })
      .eq('id', taskCompletionId)
      .select()
      .single();

    if (error) throw error;

    // Update daily tracking summary
    await updateDailyTrackingSummary(task.daily_tracking_id);

    return { success: true, task };
  } catch (error) {
    console.error('Error undoing task completion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update daily tracking summary after task changes
 */
async function updateDailyTrackingSummary(dailyTrackingId) {
  try {
    // Get all tasks for this day
    const { data: tasks, error } = await supabase
      .from('task_completions')
      .select('status')
      .eq('daily_tracking_id', dailyTrackingId);

    if (error) throw error;

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    await supabase
      .from('daily_tracking')
      .update({
        tasks_total: total,
        tasks_completed: completed,
        completion_percentage: percentage
      })
      .eq('id', dailyTrackingId);
  } catch (error) {
    console.error('Error updating daily tracking summary:', error);
  }
}

// =====================================================
// HISTORY & ANALYTICS
// =====================================================

/**
 * Get tracking history for a date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>}
 */
export async function getTrackingHistory(userId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('tracking_date', formatDate(startDate))
      .lte('tracking_date', formatDate(endDate))
      .order('tracking_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    return [];
  }
}

/**
 * Calculate streak (consecutive days with at least 1 completed task)
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
      // Allow for today or yesterday to count (user might not have tracked today yet)
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

/**
 * Get weekly summary
 * @param {string} userId - User ID
 * @param {Date} weekStart - Start of week
 * @returns {Promise<Object>}
 */
export async function getWeeklySummary(userId, weekStart = null) {
  try {
    // Default to current week (Monday start)
    if (!weekStart) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart = new Date(today.setDate(diff));
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const history = await getTrackingHistory(userId, weekStart, weekEnd);

    const totalTasks = history.reduce((sum, d) => sum + d.tasks_total, 0);
    const completedTasks = history.reduce((sum, d) => sum + d.tasks_completed, 0);
    const daysTracked = history.filter(d => d.tasks_total > 0).length;

    return {
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
      daysTracked,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      dailyBreakdown: history
    };
  } catch (error) {
    console.error('Error getting weekly summary:', error);
    return null;
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export default {
  getDailyTracking,
  generateDailyTracking,
  completeTask,
  skipTask,
  undoTaskCompletion,
  getTrackingHistory,
  calculateStreak,
  getWeeklySummary
};
