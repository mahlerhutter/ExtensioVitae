/**
 * ExtensioVitae Plan Module Service
 *
 * Converts 30-day plans to module instances and generates
 * daily tasks from plan data.
 */

import { supabase } from './supabase';
import { activateModule } from './moduleService';

// =====================================================
// PLAN TO MODULE CONVERSION
// =====================================================

/**
 * Convert an existing 30-day plan to a module instance
 * @param {string} userId - User ID
 * @param {Object} plan - Plan object from plans table
 * @returns {Promise<Object>}
 */
export async function convertPlanToModule(userId, plan) {
  try {
    if (!plan || !plan.days) {
      return { success: false, error: 'Invalid plan structure' };
    }

    // Get the 30-day-longevity module definition
    const { data: moduleDef, error: moduleError } = await supabase
      .from('module_definitions')
      .select('*')
      .eq('slug', '30-day-longevity')
      .single();

    if (moduleError || !moduleDef) {
      return { success: false, error: 'Module definition not found' };
    }

    // Calculate end date
    const startDate = plan.start_date ? new Date(plan.start_date) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    // Create module instance
    const { data: instance, error: instanceError } = await supabase
      .from('module_instances')
      .insert({
        user_id: userId,
        module_id: moduleDef.id,
        source_plan_id: plan.supabase_plan_id || plan.id,
        source_type: 'converted',
        config: {
          plan_id: plan.supabase_plan_id || plan.id,
          start_date: startDate.toISOString().split('T')[0],
          focus_pillars: plan.primary_focus_pillars || [],
          user_name: plan.user_name
        },
        total_days: 30,
        current_day: calculateCurrentDay(startDate),
        started_at: startDate.toISOString(),
        ends_at: endDate.toISOString()
      })
      .select()
      .single();

    if (instanceError) throw instanceError;

    return {
      success: true,
      instance,
      message: 'Plan converted to module successfully'
    };
  } catch (error) {
    console.error('Error converting plan to module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate daily tasks from a 30-day plan module instance
 * @param {Object} instance - Module instance with plan config
 * @param {Date} date - Date to generate tasks for
 * @returns {Promise<Array>}
 */
export async function generatePlanModuleTasks(instance, date = new Date()) {
  try {
    const planId = instance.config?.plan_id;
    if (!planId) {
      console.warn('No plan_id in module instance config');
      return [];
    }

    // Get the plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Could not load plan:', planError);
      return [];
    }

    // Calculate which day of the plan this is
    const startDate = new Date(instance.config.start_date || plan.start_date);
    const dayNumber = calculateCurrentDay(startDate, date);

    // Out of range
    if (dayNumber < 1 || dayNumber > 30) {
      return [];
    }

    // Get tasks for this day
    const dayData = plan.days?.[dayNumber - 1];
    if (!dayData?.tasks) {
      return [];
    }

    // Convert plan tasks to module task format
    return dayData.tasks.map((task, index) => ({
      task_id: `30-day-${task.id || `day${dayNumber}-task${index}`}`,
      task_type: 'action',
      title_de: task.task,
      title_en: task.task,
      description: task.evidence || null,
      pillar: task.pillar,
      duration_minutes: task.time_minutes || 5,
      scheduled_time: mapWhenToTime(task.when),
      source_module: '30-day-longevity',
      module_instance_id: instance.id,
      priority: 100 - index // First tasks have higher priority
    }));
  } catch (error) {
    console.error('Error generating plan module tasks:', error);
    return [];
  }
}

/**
 * Get the current active 30-day plan module for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function getActivePlanModule(userId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select(`
        *,
        module:module_definitions(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('module.slug', '30-day-longevity')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error getting active plan module:', error);
    return null;
  }
}

/**
 * Check if user has a plan that could be converted to module
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export async function getConvertiblePlan(userId) {
  try {
    // Check for existing active module first
    const activeModule = await getActivePlanModule(userId);
    if (activeModule) {
      return null; // Already has active module
    }

    // Get user's active plan that isn't already a module
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!plans || plans.length === 0) {
      return null;
    }

    const plan = plans[0];

    // Check if plan is still active (within 30 days)
    const startDate = new Date(plan.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    if (new Date() > endDate) {
      return null; // Plan has expired
    }

    // Check if this plan is already a module
    const { data: existingModule } = await supabase
      .from('module_instances')
      .select('id')
      .eq('source_plan_id', plan.id)
      .single();

    if (existingModule) {
      return null; // Already converted
    }

    return plan;
  } catch (error) {
    console.error('Error checking convertible plan:', error);
    return null;
  }
}

// =====================================================
// MODULE ACTIVATION FLOW
// =====================================================

/**
 * Quick-activate a module with sensible defaults
 * @param {string} userId - User ID
 * @param {string} moduleSlug - Module slug
 * @param {Object} quickConfig - Optional quick config overrides
 * @returns {Promise<Object>}
 */
export async function quickActivateModule(userId, moduleSlug, quickConfig = {}) {
  try {
    // Get module definition for defaults
    const { data: moduleDef, error: moduleError } = await supabase
      .from('module_definitions')
      .select('*')
      .eq('slug', moduleSlug)
      .single();

    if (moduleError || !moduleDef) {
      return { success: false, error: 'Module not found' };
    }

    // Build config from defaults + quick overrides
    const config = buildDefaultConfig(moduleDef.config_schema, quickConfig);

    // Activate module
    return await activateModule(userId, moduleSlug, config);
  } catch (error) {
    console.error('Error quick-activating module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get recommended modules based on user profile
 * @param {string} userId - User ID
 * @param {Object} intakeData - User's intake data
 * @returns {Promise<Array>}
 */
export async function getRecommendedModules(userId, intakeData) {
  try {
    // Get all available modules
    const { data: modules, error } = await supabase
      .from('module_definitions')
      .select('*')
      .eq('is_active', true)
      .order('priority_weight', { ascending: false });

    if (error) throw error;

    // Get user's active modules
    const { data: activeInstances } = await supabase
      .from('module_instances')
      .select('module_id')
      .eq('user_id', userId)
      .in('status', ['active', 'paused']);

    const activeModuleIds = (activeInstances || []).map(i => i.module_id);

    // Filter and score modules
    const recommendations = modules
      .filter(m => !activeModuleIds.includes(m.id))
      .map(m => ({
        ...m,
        relevanceScore: calculateRelevanceScore(m, intakeData),
        reason: getRecommendationReason(m, intakeData)
      }))
      .filter(m => m.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    return recommendations;
  } catch (error) {
    console.error('Error getting recommended modules:', error);
    return [];
  }
}

/**
 * Get starter module bundle for new users
 * @returns {Array}
 */
export function getStarterBundle() {
  return [
    {
      slug: 'circadian-light',
      reason_de: 'Grundlage für besseren Schlaf und mehr Energie',
      reason_en: 'Foundation for better sleep and more energy'
    },
    {
      slug: 'fasting-16-8',
      reason_de: 'Einfacher Einstieg ins Intervallfasten',
      reason_en: 'Easy entry into intermittent fasting'
    },
    {
      slug: 'breathwork',
      reason_de: 'Stressabbau in unter 5 Minuten täglich',
      reason_en: 'Stress relief in under 5 minutes daily'
    }
  ];
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Calculate current day number from start date
 */
function calculateCurrentDay(startDate, compareDate = new Date()) {
  const start = new Date(startDate);
  const compare = new Date(compareDate);
  start.setHours(0, 0, 0, 0);
  compare.setHours(0, 0, 0, 0);
  const diffTime = compare - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Map 'when' field to approximate time
 */
function mapWhenToTime(when) {
  const timeMap = {
    'morning': '07:30',
    'early_morning': '06:30',
    'late_morning': '10:00',
    'midday': '12:00',
    'afternoon': '15:00',
    'evening': '19:00',
    'night': '21:00',
    'before_bed': '22:00',
    'anytime': null
  };
  return timeMap[when] || null;
}

/**
 * Build default config from schema
 */
function buildDefaultConfig(schema, overrides = {}) {
  const config = {};
  const properties = schema?.properties || schema || {};

  Object.entries(properties).forEach(([key, fieldDef]) => {
    if (overrides[key] !== undefined) {
      config[key] = overrides[key];
    } else if (fieldDef.default !== undefined) {
      config[key] = fieldDef.default;
    }
  });

  return config;
}

/**
 * Calculate relevance score for module recommendation
 */
function calculateRelevanceScore(module, intakeData) {
  if (!intakeData) return 50;

  let score = module.priority_weight || 50;

  // Boost based on intake goals
  const goals = intakeData.goals || [];
  const concerns = intakeData.health_concerns || [];
  const pillars = module.pillars || [];

  // Sleep-related
  if ((goals.includes('sleep') || concerns.includes('sleep_issues')) &&
      pillars.includes('sleep')) {
    score += 30;
  }

  // Energy-related
  if ((goals.includes('energy') || concerns.includes('fatigue')) &&
      (pillars.includes('energy') || pillars.includes('metabolic'))) {
    score += 25;
  }

  // Weight/metabolic
  if ((goals.includes('weight') || goals.includes('metabolic')) &&
      pillars.includes('nutrition')) {
    score += 20;
  }

  // Stress
  if ((concerns.includes('stress') || goals.includes('stress')) &&
      pillars.includes('stress')) {
    score += 25;
  }

  return score;
}

/**
 * Get human-readable recommendation reason
 */
function getRecommendationReason(module, intakeData) {
  const pillars = module.pillars || [];
  const goals = intakeData?.goals || [];

  if (pillars.includes('sleep') && goals.includes('sleep')) {
    return { de: 'Passt zu deinem Ziel: Besserer Schlaf', en: 'Matches your goal: Better sleep' };
  }
  if (pillars.includes('nutrition') && goals.includes('weight')) {
    return { de: 'Passt zu deinem Ziel: Gewichtsmanagement', en: 'Matches your goal: Weight management' };
  }
  if (pillars.includes('stress')) {
    return { de: 'Hilft bei Stressabbau', en: 'Helps with stress relief' };
  }
  return { de: 'Empfohlen für Longevity', en: 'Recommended for longevity' };
}

// =====================================================
// 30-DAY MODULE PREVIEW
// Generates a complete day-by-day schedule preview for
// any module, allowing users to see exactly what to expect
// before activation.
// =====================================================

/**
 * Generate a 30-day (or module-duration) preview schedule for any module.
 * Works for ALL modules — fallback, DB, and plan-based.
 *
 * @param {Object} moduleDef - Module definition (from getModuleBySlug or FALLBACK_MODULES)
 * @param {Object} config - User configuration (from config_schema defaults or user input)
 * @param {Date} startDate - When the module would start (default: today)
 * @returns {Object} { days: [...], summary: {...} }
 */
export function generateModulePreview(moduleDef, config = {}, startDate = new Date()) {
  if (!moduleDef) return { days: [], summary: {} };

  const duration = moduleDef.duration_days || 30;
  const templateTasks = moduleDef.task_template?.tasks || [];
  const legacyTasks = moduleDef.daily_tasks || [];
  const days = [];

  // Build config with defaults from schema
  const fullConfig = buildDefaultConfig(moduleDef.config_schema, config);

  // Phase boundaries for display
  const phases = getModulePhases(duration);

  for (let dayNum = 1; dayNum <= duration; dayNum++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + dayNum - 1);
    const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayOfMonth = dayDate.getDate();
    const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';

    // Determine current phase
    const phase = getPhaseForDay(dayNum, phases);

    // Collect tasks for this day
    const dayTasks = [];

    if (templateTasks.length > 0) {
      // Path A: task_template
      for (const taskDef of templateTasks) {
        // Check day-based progression (min_day / max_day)
        if (taskDef.min_day && dayNum < taskDef.min_day) continue;
        if (taskDef.max_day && dayNum > taskDef.max_day) continue;

        // Check frequency
        if (taskDef.frequency === 'weekly' && taskDef.day !== dayOfWeek) continue;
        if (taskDef.frequency === 'monthly' && taskDef.day !== dayOfMonth) continue;
        if (taskDef.frequency === 'quarterly' || taskDef.frequency === 'yearly') continue;
        if (taskDef.frequency === 'once' && taskDef.day !== dayNum) continue;
        if (taskDef.frequency === 'as_needed') continue;

        // Check condition (simplified for preview — can't access runtime state)
        if (taskDef.condition && !previewEvaluateCondition(taskDef.condition, fullConfig)) continue;

        // Resolve template variables in time
        const resolvedTime = previewResolveTemplate(taskDef.time, fullConfig);
        const resolvedTitle = previewResolveTemplate(taskDef.title_de || taskDef.title_en || '', fullConfig);

        dayTasks.push({
          id: taskDef.id,
          title_de: resolvedTitle,
          type: taskDef.type || 'action',
          time: resolvedTime,
          pillar: taskDef.pillar || moduleDef.category || 'general',
          duration_minutes: taskDef.duration_minutes || 5,
          is_new_in_phase: taskDef.min_day === dayNum
        });
      }
    } else if (legacyTasks.length > 0) {
      // Path B: legacy daily_tasks (same every day)
      for (const taskDef of legacyTasks) {
        dayTasks.push({
          id: taskDef.id,
          title_de: taskDef.task || taskDef.title_de || '',
          type: taskDef.type === 'checkbox' ? 'action' : (taskDef.type || 'action'),
          time: taskDef.time || null,
          pillar: taskDef.pillar || moduleDef.category || 'general',
          duration_minutes: taskDef.duration_minutes || 5,
          is_new_in_phase: false
        });
      }
    }

    // Sort tasks by time
    dayTasks.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

    days.push({
      day: dayNum,
      date: dayDate.toISOString().split('T')[0],
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      phase: phase.name,
      phase_de: phase.name_de,
      tasks: dayTasks,
      task_count: dayTasks.length,
      total_minutes: dayTasks.reduce((sum, t) => sum + (t.duration_minutes || 0), 0),
      new_tasks_unlocked: dayTasks.filter(t => t.is_new_in_phase).map(t => t.title_de)
    });
  }

  // Build summary
  const allTasks = days.flatMap(d => d.tasks);
  const uniqueTaskIds = [...new Set(allTasks.map(t => t.id))];
  const pillarCounts = {};
  allTasks.forEach(t => { pillarCounts[t.pillar] = (pillarCounts[t.pillar] || 0) + 1; });

  const summary = {
    module_name: moduleDef.name_de || moduleDef.name_en || moduleDef.slug,
    duration_days: duration,
    total_unique_tasks: uniqueTaskIds.length,
    avg_tasks_per_day: Math.round((allTasks.length / duration) * 10) / 10,
    avg_minutes_per_day: Math.round(days.reduce((s, d) => s + d.total_minutes, 0) / duration),
    pillar_distribution: pillarCounts,
    phases: phases.map(p => ({
      ...p,
      tasks_in_phase: uniqueTaskIds.filter(id => {
        const task = templateTasks.find(t => t.id === id);
        if (!task) return true;
        const inRange = (!task.min_day || task.min_day <= p.end_day) &&
                        (!task.max_day || task.max_day >= p.start_day);
        return inRange;
      }).length
    })),
    weekly_overview: buildWeeklyOverview(days)
  };

  return { days, summary };
}

/**
 * Get phase definitions based on module duration
 */
function getModulePhases(duration) {
  if (duration <= 7) {
    return [
      { name: 'awareness', name_de: 'Awareness', start_day: 1, end_day: 2 },
      { name: 'practice', name_de: 'Praxis', start_day: 3, end_day: 5 },
      { name: 'integration', name_de: 'Integration', start_day: 6, end_day: duration }
    ];
  }
  if (duration <= 14) {
    return [
      { name: 'core', name_de: 'Kern-Aufbau', start_day: 1, end_day: 7 },
      { name: 'full', name_de: 'Volles Protokoll', start_day: 8, end_day: duration }
    ];
  }
  if (duration <= 21) {
    return [
      { name: 'foundation', name_de: 'Foundation', start_day: 1, end_day: 7 },
      { name: 'intermediate', name_de: 'Aufbau', start_day: 8, end_day: 14 },
      { name: 'advanced', name_de: 'Fortgeschritten', start_day: 15, end_day: duration }
    ];
  }
  return [
    { name: 'stabilize', name_de: 'Stabilisieren', start_day: 1, end_day: 7 },
    { name: 'build', name_de: 'Aufbauen', start_day: 8, end_day: 14 },
    { name: 'optimize', name_de: 'Optimieren', start_day: 15, end_day: 21 },
    { name: 'consolidate', name_de: 'Festigen', start_day: 22, end_day: duration }
  ];
}

function getPhaseForDay(dayNum, phases) {
  return phases.find(p => dayNum >= p.start_day && dayNum <= p.end_day) || phases[phases.length - 1];
}

/**
 * Simplified condition evaluator for preview (no runtime state)
 */
function previewEvaluateCondition(condition, config) {
  if (!condition || typeof condition !== 'string') return true;
  try {
    // Array .includes()
    const includesMatch = condition.match(/config\.(\w+)\.includes\(['"]([\w_]+)['"]\)/);
    if (includesMatch) {
      const arr = config[includesMatch[1]];
      return Array.isArray(arr) && arr.includes(includesMatch[2]);
    }
    // Boolean check
    if (condition.match(/^config\.\w+$/)) {
      return !!config[condition.replace('config.', '')];
    }
    // Equality
    if (condition.includes('===')) {
      const [left, right] = condition.split('===').map(s => s.trim());
      const lVal = left.startsWith('config.') ? config[left.replace('config.', '')] : left.replace(/['"]/g, '');
      const rVal = right.startsWith('config.') ? config[right.replace('config.', '')] : right.replace(/['"]/g, '');
      return lVal === rVal;
    }
    // Inequality
    if (condition.includes('!==')) {
      const [left, right] = condition.split('!==').map(s => s.trim());
      const lVal = left.startsWith('config.') ? config[left.replace('config.', '')] : left.replace(/['"]/g, '');
      const rVal = right.startsWith('config.') ? config[right.replace('config.', '')] : right.replace(/['"]/g, '');
      return lVal !== rVal;
    }
    // OR
    if (condition.includes(' || ')) {
      return condition.split(' || ').some(part => previewEvaluateCondition(part.trim(), config));
    }
    // AND
    if (condition.includes(' && ')) {
      return condition.split(' && ').every(part => previewEvaluateCondition(part.trim(), config));
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Simplified template resolver for preview
 */
function previewResolveTemplate(value, config) {
  if (!value || typeof value !== 'string') return value;

  // Time arithmetic first
  value = value.replace(/\{\{config\.(\w+)\}\}([+-])(\d+)min/g, (match, key, op, minutes) => {
    const baseTime = config[key];
    if (!baseTime || typeof baseTime !== 'string' || !baseTime.includes(':')) return match;
    const [hours, mins] = baseTime.split(':').map(Number);
    const totalMins = hours * 60 + mins + (op === '+' ? parseInt(minutes) : -parseInt(minutes));
    const normalizedMins = ((totalMins % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalizedMins / 60)).padStart(2, '0')}:${String(normalizedMins % 60).padStart(2, '0')}`;
  });

  // Simple substitution
  value = value.replace(/\{\{config\.(\w+)\}\}/g, (match, key) => {
    return config[key] !== undefined ? String(config[key]) : match;
  });

  return value;
}

/**
 * Build weekly overview from days array
 */
function buildWeeklyOverview(days) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    weeks.push({
      week: Math.floor(i / 7) + 1,
      avg_tasks: Math.round((weekDays.reduce((s, d) => s + d.task_count, 0) / weekDays.length) * 10) / 10,
      avg_minutes: Math.round(weekDays.reduce((s, d) => s + d.total_minutes, 0) / weekDays.length),
      phase: weekDays[0]?.phase || 'unknown',
      phase_de: weekDays[0]?.phase_de || 'Unbekannt',
      new_tasks: [...new Set(weekDays.flatMap(d => d.new_tasks_unlocked).filter(Boolean))]
    });
  }
  return weeks;
}

export default {
  convertPlanToModule,
  generatePlanModuleTasks,
  getActivePlanModule,
  getConvertiblePlan,
  quickActivateModule,
  getRecommendedModules,
  getStarterBundle,
  generateModulePreview
};
