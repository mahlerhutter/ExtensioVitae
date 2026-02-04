/**
 * ExtensioVitae Module Service
 *
 * Manages module definitions and user module instances.
 * Core of the modular tracking system.
 */

import { supabase } from './supabase';

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
    const moduleDef = instance.module;

    const definition = moduleDef ? {
      ...moduleDef,
      name_de: moduleDef.name_de || moduleDef.name || fallbackDef.name_de,
      name_en: moduleDef.name_en || moduleDef.name || fallbackDef.name_en,
      icon: moduleDef.icon || fallbackDef.icon,
      pillars: moduleDef.pillars || fallbackDef.pillars,
      category: moduleDef.category || fallbackDef.category,
      slug: moduleDef.slug || fallbackDef.slug
    } : fallbackDef;

    return {
      ...instance,
      definition,
      total_days: instance.total_days || moduleDef?.duration_days || 30,
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

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
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

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching module:', error);
    return null;
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
