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

export default {
  convertPlanToModule,
  generatePlanModuleTasks,
  getActivePlanModule,
  getConvertiblePlan,
  quickActivateModule,
  getRecommendedModules,
  getStarterBundle
};
