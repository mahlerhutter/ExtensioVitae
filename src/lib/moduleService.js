/**
 * ExtensioVitae Module Service
 *
 * Manages module definitions and user module instances.
 * Core of the modular tracking system.
 */

import { supabase } from './supabase';
import { logger } from './logger';

// =====================================================
// LOCAL FALLBACK MODULE DEFINITIONS
// Used when database migrations haven't been run
// =====================================================

const FALLBACK_MODULES = [
  {
    id: 'fallback-fasting-16-8',
    slug: 'fasting-16-8',
    name_de: '⏰ Intervallfasten 16:8',
    name_en: 'Intermittent Fasting 16:8',
    icon: '⏰',
    category: 'nutrition',
    pillars: ['nutrition'],
    duration_days: 30,
    is_active: true,
    is_premium: false,
    description_de: '16 Stunden fasten, 8 Stunden Essensfenster.',
    description_en: '16 hours fasting, 8 hours eating window.',
    priority_weight: 90,
    daily_tasks: [
      { id: 'fast_start', task: 'Fastenfenster starten (keine Kalorien mehr)', type: 'checkbox' },
      { id: 'hydration', task: 'Morgens 500ml Wasser + Salz', type: 'checkbox' },
      { id: 'fast_break', task: 'Fastenbrechen (Proteinreich)', type: 'checkbox' }
    ]
  },
  {
    id: 'fallback-sleep-protocol',
    slug: 'sleep-protocol',
    name_de: '😴 Schlaf-Protokoll',
    name_en: 'Sleep Protocol',
    icon: '😴',
    category: 'sleep',
    pillars: ['sleep'],
    duration_days: 21,
    is_active: true,
    is_premium: false,
    description_de: 'Optimiere deinen Schlaf für mehr Energie.',
    description_en: 'Optimize your sleep for more energy.',
    priority_weight: 95,
    daily_tasks: [
      { id: 'no_caffeine', task: 'Kein Koffein nach 14:00', type: 'checkbox' },
      { id: 'blue_block', task: 'Blue-Light Blocker (1h vor Bett)', type: 'checkbox' },
      { id: 'magnesium', task: 'Magnesium Bisglycinat (300-400mg)', type: 'checkbox' }
    ]
  },
  {
    id: 'fallback-morning-routine',
    slug: 'morning-routine',
    name_de: '🌅 Morgenroutine',
    name_en: 'Morning Routine',
    icon: '🌅',
    category: 'lifestyle',
    pillars: ['circadian', 'movement'],
    duration_days: 14,
    is_active: true,
    is_premium: false,
    description_de: 'Starte jeden Tag mit einer energetisierenden Routine.',
    description_en: 'Start every day with an energizing routine.',
    priority_weight: 85,
    daily_tasks: [
      { id: 'sunlight', task: 'Tageslicht (5-10 min outdoor)', type: 'checkbox' },
      { id: 'movement', task: 'Bewegung (Dehnen/Spazieren)', type: 'checkbox' },
      { id: 'cold_water', task: 'Kaltes Wasser ins Gesicht / Dusche', type: 'checkbox' }
    ]
  },
  {
    id: 'fallback-stress-reset',
    slug: 'stress-reset',
    name_de: '🧘 Stress Reset',
    name_en: 'Stress Reset',
    icon: '🧘',
    category: 'stress',
    pillars: ['stress', 'mental'],
    duration_days: 7,
    is_active: true,
    is_premium: false,
    description_de: '7 Tage für mehr innere Ruhe.',
    description_en: '7 days for more inner peace.',
    priority_weight: 80,
    daily_tasks: [
      { id: 'box_breathing', task: 'Box Breathing (4-4-4-4) - 5min', type: 'checkbox' },
      { id: 'nsdr', task: 'NSDR / Yoga Nidra Session', type: 'checkbox' },
      { id: 'nature', task: 'Zeit in der Natur (ohne Handy)', type: 'checkbox' }
    ]
  }
];

// =====================================================
// HELPER: Transform module instances for UI compatibility
// =====================================================

/**
 * Transforms raw module instance data from Supabase into UI-friendly format
 * Maps 'module' to 'definition' and ensures all required fields exist
 */
function transformModuleInstances(instances) {
  const fallbackDef = {
    name_de: 'Unbenanntes Modul',
    name_en: 'Unnamed Module',
    name: 'Module',
    icon: '📋',
    pillars: [],
    category: 'general',
    duration_days: 30,
    slug: 'unknown'
  };

  return instances.map(instance => {
    let moduleDef = instance.module;

    // Attempt to find matching fallback to enhance data (e.g. daily_tasks)
    const fallbackMatch = FALLBACK_MODULES.find(f =>
      f.slug === moduleDef?.slug || f.id === moduleDef?.id || f.slug === instance.module_id
    );

    const definition = moduleDef ? {
      ...moduleDef,
      name_de: moduleDef.name_de || moduleDef.name || (fallbackMatch?.name_de || 'Unbenanntes Modul'),
      name_en: moduleDef.name_en || moduleDef.name || (fallbackMatch?.name_en || 'Unnamed Module'),
      icon: moduleDef.icon || (fallbackMatch?.icon || '📋'),
      pillars: moduleDef.pillars || (fallbackMatch?.pillars || []),
      category: moduleDef.category || (fallbackMatch?.category || 'general'),
      slug: moduleDef.slug || (fallbackMatch?.slug || 'unknown'),
      // CRITICAL: Inject daily_tasks if missing in DB but present in fallback
      daily_tasks: moduleDef.daily_tasks || fallbackMatch?.daily_tasks || []
    } : (fallbackMatch || {
      name_de: 'Unbenanntes Modul',
      name_en: 'Unnamed Module',
      name: 'Module',
      icon: '📋',
      pillars: [],
      category: 'general',
      duration_days: 30,
      slug: 'unknown',
      daily_tasks: []
    });

    return {
      ...instance,
      definition,
      total_days: instance.total_days || definition.duration_days || 30,
      current_day: instance.current_day || 1,
      completion_rate: instance.completion_percentage || 0
    };
  });
}

// =====================================================
// MODULE DEFINITIONS (System-wide)
// =====================================================

/**
 * Get all available modules
 * @param {Object} options - Filter options
 * @param {string} options.category - Filter by category
 * @param {boolean} options.includePremium - Include premium modules
 * @returns {Promise<Array>} List of module definitions
 */
export async function getAvailableModules({ category = null, includePremium = true } = {}) {
  try {
    let query = supabase
      .from('module_definitions')
      .select('*')
      .eq('is_active', true)
      .order('priority_weight', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (!includePremium) {
      query = query.eq('is_premium', false);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[ModuleService] Database error, using fallback modules:', error.message);
      // Return fallback modules if database query fails (migrations not run)
      let fallback = [...FALLBACK_MODULES];
      if (category) {
        fallback = fallback.filter(m => m.category === category);
      }
      return fallback;
    }

    // If no modules in database, return fallbacks
    if (!data || data.length === 0) {
      console.warn('[ModuleService] No modules in database, using fallback modules. Run migrations: 012, 013, 014');
      let fallback = [...FALLBACK_MODULES];
      if (category) {
        fallback = fallback.filter(m => m.category === category);
      }
      return fallback;
    }

    return data;
  } catch (error) {
    console.error('[ModuleService] Error fetching modules:', error);
    // Return fallback modules on any error
    return [...FALLBACK_MODULES];
  }
}

/**
 * Get a single module definition by slug
 * @param {string} slug - Module slug
 * @returns {Promise<Object|null>}
 */
export async function getModuleBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from('module_definitions')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn(`[ModuleService] Module '${slug}' not found in database, checking fallbacks`);
      // Try to find in fallback modules
      const fallback = FALLBACK_MODULES.find(m => m.slug === slug);
      if (fallback) {
        logger.info(`[ModuleService] Using fallback module for '${slug}'`);
        return fallback;
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching module:', error);
    // Try fallback on error
    const fallback = FALLBACK_MODULES.find(m => m.slug === slug);
    return fallback || null;
  }
}

// =====================================================
// MODULE INSTANCES (User-specific)
// =====================================================

/**
 * Get user's active module instances
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getUserModules(userId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select(`
        *,
        module:module_definitions(*)
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data with fallbacks for UI components
    return transformModuleInstances(data || []);
  } catch (error) {
    console.error('Error fetching user modules:', error);
    return [];
  }
}

/**
 * Get user's active modules (not paused)
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getActiveUserModules(userId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select(`
        *,
        module:module_definitions(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data with fallbacks for UI components
    return transformModuleInstances(data || []);
  } catch (error) {
    console.error('Error fetching active user modules:', error);
    return [];
  }
}

/**
 * Activate a module for a user
 * @param {string} userId - User ID
 * @param {string} moduleSlug - Module slug
 * @param {Object} config - User configuration for the module
 * @returns {Promise<Object>}
 */
export async function activateModule(userId, moduleSlug, config = {}) {
  try {
    // Get module definition
    const moduleDef = await getModuleBySlug(moduleSlug);
    if (!moduleDef) {
      return { success: false, error: 'Module not found' };
    }

    // Check if user already has this module active
    const { data: existing } = await supabase
      .from('module_instances')
      .select('id')
      .eq('user_id', userId)
      .eq('module_id', moduleDef.id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return { success: false, error: 'Module already active' };
    }

    // Calculate end date if module has duration
    const endsAt = moduleDef.duration_days
      ? new Date(Date.now() + moduleDef.duration_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Create instance
    const { data, error } = await supabase
      .from('module_instances')
      .insert({
        user_id: userId,
        module_id: moduleDef.id,
        config: config,
        total_days: moduleDef.duration_days,
        ends_at: endsAt,
        auto_pause_in_modes: moduleDef.affected_by_modes || []
      })
      .select(`
        *,
        module:module_definitions(*)
      `)
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error activating module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Pause a module instance
 * @param {string} instanceId - Module instance ID
 * @returns {Promise<Object>}
 */
export async function pauseModule(instanceId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error pausing module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Resume a paused module
 * @param {string} instanceId - Module instance ID
 * @returns {Promise<Object>}
 */
export async function resumeModule(instanceId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({
        status: 'active',
        paused_at: null
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error resuming module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deactivate (cancel) a module
 * @param {string} instanceId - Module instance ID
 * @returns {Promise<Object>}
 */
export async function deactivateModule(instanceId) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({
        status: 'cancelled'
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error deactivating module:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update module instance configuration
 * @param {string} instanceId - Module instance ID
 * @param {Object} config - New configuration
 * @returns {Promise<Object>}
 */
export async function updateModuleConfig(instanceId, config) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .update({ config })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error updating module config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update module instance progress
 * @param {string} instanceId - Module instance ID
 * @param {number} currentDay - Current day number
 * @param {number} completionPercentage - Completion percentage
 * @returns {Promise<Object>}
 */
export async function updateModuleProgress(instanceId, currentDay, completionPercentage) {
  try {
    const updates = {
      current_day: currentDay,
      completion_percentage: completionPercentage
    };

    // Check if module is complete
    const { data: instance } = await supabase
      .from('module_instances')
      .select('total_days')
      .eq('id', instanceId)
      .single();

    if (instance?.total_days && currentDay >= instance.total_days && completionPercentage >= 100) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('module_instances')
      .update(updates)
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, instance: data };
  } catch (error) {
    console.error('Error updating module progress:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Get module categories with counts
 * @returns {Promise<Array>}
 */
export async function getModuleCategories() {
  const categories = [
    { id: 'nutrition', name_de: 'Ernährung', name_en: 'Nutrition', icon: '🥗' },
    { id: 'exercise', name_de: 'Bewegung', name_en: 'Exercise', icon: '💪' },
    { id: 'sleep', name_de: 'Schlaf', name_en: 'Sleep', icon: '😴' },
    { id: 'supplements', name_de: 'Supplements', name_en: 'Supplements', icon: '💊' },
    { id: 'mindset', name_de: 'Mindset', name_en: 'Mindset', icon: '🧠' },
    { id: 'health', name_de: 'Gesundheit', name_en: 'Health', icon: '❤️' },
    { id: 'general', name_de: 'Allgemein', name_en: 'General', icon: '📋' }
  ];

  try {
    const { data, error } = await supabase
      .from('module_definitions')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    // Count modules per category
    const counts = {};
    (data || []).forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });

    return categories.map(c => ({
      ...c,
      count: counts[c.id] || 0
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return categories;
  }
}

/**
 * Check if user has a specific module active
 * @param {string} userId - User ID
 * @param {string} moduleSlug - Module slug
 * @returns {Promise<boolean>}
 */
export async function hasModuleActive(userId, moduleSlug) {
  try {
    const { data, error } = await supabase
      .from('module_instances')
      .select(`
        id,
        module:module_definitions!inner(slug)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('module.slug', moduleSlug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking module status:', error);
    return false;
  }
}

export default {
  getAvailableModules,
  getModuleBySlug,
  getUserModules,
  getActiveUserModules,
  activateModule,
  pauseModule,
  resumeModule,
  deactivateModule,
  updateModuleConfig,
  updateModuleProgress,
  getModuleCategories,
  hasModuleActive
};
