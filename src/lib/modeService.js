/**
 * ExtensioVitae Mode Service
 *
 * Manages emergency modes (Travel, Sick, Detox, Deep Work).
 * Supports AX-2 (Context Sovereignty).
 */

import { supabase } from './supabase';

// Mode definitions
export const MODES = {
  normal: {
    id: 'normal',
    name_de: 'Normal',
    name_en: 'Normal',
    icon: '✨',
    color: '#22c55e',
    description_de: 'Normaler Modus - alle Protokolle aktiv',
    description_en: 'Normal mode - all protocols active',
    default_duration_hours: null
  },
  travel: {
    id: 'travel',
    name_de: 'Reise',
    name_en: 'Travel',
    icon: '✈️',
    color: '#3b82f6',
    description_de: 'Fokus auf Jetlag, Licht-Timing, Melatonin',
    description_en: 'Focus on jetlag, light timing, melatonin',
    default_duration_hours: 72,
    pauses_modules: ['fasting-16-8', 'exercise-hiit'],
    activates_tasks: ['jetlag-protocol', 'hydration-reminder']
  },
  sick: {
    id: 'sick',
    name_de: 'Krank',
    name_en: 'Sick',
    icon: '🤒',
    color: '#f97316',
    description_de: 'Fokus auf Erholung, Schlaf, Immunsystem',
    description_en: 'Focus on recovery, sleep, immune system',
    default_duration_hours: 72,
    pauses_modules: ['fasting-16-8', 'exercise-hiit', 'circadian-light'],
    activates_tasks: ['rest-reminder', 'zinc-vitamin-c', 'bone-broth'],
    suppresses_notifications: true
  },
  detox: {
    id: 'detox',
    name_de: 'Detox',
    name_en: 'Detox',
    icon: '🧹',
    color: '#8b5cf6',
    description_de: 'Fokus auf Elektrolyte, Sauna, Leber-Support',
    description_en: 'Focus on electrolytes, sauna, liver support',
    default_duration_hours: 48,
    pauses_modules: [],
    activates_tasks: ['electrolyte-reminder', 'sauna-session', 'liver-support']
  },
  deep_work: {
    id: 'deep_work',
    name_de: 'Deep Work',
    name_en: 'Deep Work',
    icon: '🎯',
    color: '#ec4899',
    description_de: 'Fokus auf Nootropics, Focus-Stack, keine Ablenkungen',
    description_en: 'Focus on nootropics, focus stack, no distractions',
    default_duration_hours: 8,
    pauses_modules: [],
    activates_tasks: ['focus-stack', 'caffeine-timing'],
    suppresses_notifications: true
  }
};

// =====================================================
// MODE STATE
// =====================================================

/**
 * Get user's current mode state
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getUserMode(userId) {
  try {
    const { data, error } = await supabase
      .from('user_mode_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return existing state or create default
    if (data) {
      // Check if mode has expired
      if (data.mode_expires_at && new Date(data.mode_expires_at) < new Date()) {
        // Auto-reset to normal
        await setUserMode(userId, 'normal');
        return { ...data, current_mode: 'normal', mode_expires_at: null };
      }
      return data;
    }

    // Create default mode state
    const { data: newState, error: insertError } = await supabase
      .from('user_mode_state')
      .insert({
        user_id: userId,
        current_mode: 'normal'
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newState;
  } catch (error) {
    console.error('Error getting user mode:', error);
    return { current_mode: 'normal' };
  }
}

/**
 * Set user's mode
 * @param {string} userId - User ID
 * @param {string} mode - Mode ID
 * @param {number} durationHours - Duration in hours (optional, uses default)
 * @returns {Promise<Object>}
 */
export async function setUserMode(userId, mode, durationHours = null) {
  try {
    const modeConfig = MODES[mode];
    if (!modeConfig) {
      return { success: false, error: 'Invalid mode' };
    }

    // Calculate expiration
    const duration = durationHours || modeConfig.default_duration_hours;
    const expiresAt = duration
      ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
      : null;

    // Get current state for history
    const currentState = await getUserMode(userId);

    // Build history entry
    const historyEntry = {
      mode: currentState.current_mode,
      activated_at: currentState.mode_activated_at,
      deactivated_at: new Date().toISOString()
    };

    // Update mode history (keep last 10)
    const modeHistory = currentState.mode_history || [];
    if (currentState.current_mode !== 'normal') {
      modeHistory.unshift(historyEntry);
      if (modeHistory.length > 10) modeHistory.pop();
    }

    // Upsert mode state
    const { data, error } = await supabase
      .from('user_mode_state')
      .upsert({
        user_id: userId,
        current_mode: mode,
        mode_activated_at: new Date().toISOString(),
        mode_expires_at: expiresAt,
        mode_history: modeHistory,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      state: data,
      mode: modeConfig,
      expiresAt
    };
  } catch (error) {
    console.error('Error setting user mode:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset user to normal mode
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function resetToNormalMode(userId) {
  return setUserMode(userId, 'normal');
}

/**
 * Extend current mode duration
 * @param {string} userId - User ID
 * @param {number} additionalHours - Hours to add
 * @returns {Promise<Object>}
 */
export async function extendModeDuration(userId, additionalHours) {
  try {
    const currentState = await getUserMode(userId);

    if (currentState.current_mode === 'normal') {
      return { success: false, error: 'Cannot extend normal mode' };
    }

    const currentExpiry = currentState.mode_expires_at
      ? new Date(currentState.mode_expires_at)
      : new Date();

    const newExpiry = new Date(currentExpiry.getTime() + additionalHours * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('user_mode_state')
      .update({
        mode_expires_at: newExpiry.toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, state: data, newExpiry };
  } catch (error) {
    console.error('Error extending mode:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// MODE HELPERS
// =====================================================

/**
 * Get all available modes
 * @returns {Array}
 */
export function getAllModes() {
  return Object.values(MODES);
}

/**
 * Get mode configuration
 * @param {string} modeId - Mode ID
 * @returns {Object|null}
 */
export function getModeConfig(modeId) {
  return MODES[modeId] || null;
}

/**
 * Check if a module should be paused in current mode
 * @param {string} moduleSlug - Module slug
 * @param {string} currentMode - Current mode ID
 * @returns {boolean}
 */
export function shouldPauseModule(moduleSlug, currentMode) {
  const modeConfig = MODES[currentMode];
  if (!modeConfig?.pauses_modules) return false;
  return modeConfig.pauses_modules.includes(moduleSlug);
}

/**
 * Check if notifications should be suppressed
 * @param {string} currentMode - Current mode ID
 * @returns {boolean}
 */
export function shouldSuppressNotifications(currentMode) {
  const modeConfig = MODES[currentMode];
  return modeConfig?.suppresses_notifications || false;
}

/**
 * Get time remaining in current mode
 * @param {Object} modeState - Mode state object
 * @returns {Object|null} - { hours, minutes } or null if no expiry
 */
export function getTimeRemaining(modeState) {
  if (!modeState?.mode_expires_at) return null;

  const now = new Date();
  const expiry = new Date(modeState.mode_expires_at);
  const diff = expiry - now;

  if (diff <= 0) return { hours: 0, minutes: 0 };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

/**
 * Format mode state for display
 * @param {Object} modeState - Mode state object
 * @returns {Object}
 */
export function formatModeForDisplay(modeState) {
  const mode = MODES[modeState?.current_mode] || MODES.normal;
  const timeRemaining = getTimeRemaining(modeState);

  return {
    ...mode,
    isActive: modeState?.current_mode !== 'normal',
    activatedAt: modeState?.mode_activated_at,
    expiresAt: modeState?.mode_expires_at,
    timeRemaining,
    timeRemainingText: timeRemaining
      ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
      : null
  };
}

export default {
  MODES,
  getUserMode,
  setUserMode,
  resetToNormalMode,
  extendModeDuration,
  getAllModes,
  getModeConfig,
  shouldPauseModule,
  shouldSuppressNotifications,
  getTimeRemaining,
  formatModeForDisplay
};
