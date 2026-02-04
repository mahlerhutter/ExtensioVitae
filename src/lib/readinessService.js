/**
 * ExtensioVitae Readiness Service
 *
 * Calculates daily readiness and adjusts task intensity.
 * Part of Phase 3: Readiness-based Task Swapping
 */

import { supabase } from './supabase';

// Intensity levels and their task adjustments
const INTENSITY_LEVELS = {
  rest: {
    name_de: 'Ruhe',
    name_en: 'Rest',
    icon: '😴',
    color: '#6366f1',
    multiplier: 0.3,
    description_de: 'Nur essentielle Aufgaben. Fokus auf Erholung.',
    description_en: 'Essential tasks only. Focus on recovery.',
    skipTypes: ['exercise', 'high_intensity', 'social'],
    emphasizeTypes: ['sleep', 'recovery', 'hydration']
  },
  light: {
    name_de: 'Leicht',
    name_en: 'Light',
    icon: '🌤️',
    color: '#22c55e',
    multiplier: 0.6,
    description_de: 'Reduzierte Intensität. Sanfte Aktivitäten.',
    description_en: 'Reduced intensity. Gentle activities.',
    skipTypes: ['high_intensity'],
    emphasizeTypes: ['recovery', 'mindfulness']
  },
  normal: {
    name_de: 'Normal',
    name_en: 'Normal',
    icon: '✨',
    color: '#fbbf24',
    multiplier: 1.0,
    description_de: 'Volle Leistung möglich.',
    description_en: 'Full performance possible.',
    skipTypes: [],
    emphasizeTypes: []
  },
  high: {
    name_de: 'Hoch',
    name_en: 'High',
    icon: '🔥',
    color: '#f97316',
    multiplier: 1.2,
    description_de: 'Optimale Readiness. Push yourself!',
    description_en: 'Optimal readiness. Push yourself!',
    skipTypes: [],
    emphasizeTypes: ['exercise', 'high_intensity', 'challenges']
  },
  peak: {
    name_de: 'Peak',
    name_en: 'Peak',
    icon: '⚡',
    color: '#ef4444',
    multiplier: 1.5,
    description_de: 'Top Form! Nutze den Tag.',
    description_en: 'Top form! Make the most of it.',
    skipTypes: [],
    emphasizeTypes: ['exercise', 'high_intensity', 'performance']
  }
};

// =====================================================
// READINESS SCORE CALCULATION
// =====================================================

/**
 * Calculate readiness score from multiple sources
 * @param {string} userId - User ID
 * @param {Date} date - Date
 * @returns {Promise<Object>}
 */
export async function calculateReadinessScore(userId, date = new Date()) {
  try {
    const dateStr = formatDate(date);

    // Check for existing readiness
    const { data: existing } = await supabase
      .from('daily_readiness')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single();

    if (existing) {
      return existing;
    }

    // Gather data from various sources
    const [wearableData, manualInput, previousDays] = await Promise.all([
      getWearableReadinessData(userId, date),
      getManualReadinessInput(userId, date),
      getPreviousDaysData(userId, date, 3)
    ]);

    // Calculate component scores
    let sleepScore = null;
    let recoveryScore = null;
    let hrvScore = null;
    let stressScore = null;

    // From wearables
    if (wearableData) {
      if (wearableData.sleep_score) sleepScore = wearableData.sleep_score;
      if (wearableData.recovery_score) recoveryScore = wearableData.recovery_score;
      if (wearableData.hrv) hrvScore = calculateHRVScore(wearableData.hrv, wearableData.hrv_baseline);
      if (wearableData.stress_score) stressScore = 100 - wearableData.stress_score; // Invert
    }

    // From manual input (if no wearable data)
    if (manualInput) {
      if (!sleepScore && manualInput.sleep_quality) {
        sleepScore = manualInput.sleep_quality * 10;
      }
    }

    // Calculate overall score
    const scores = [sleepScore, recoveryScore, hrvScore, stressScore].filter(s => s !== null);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 70; // Default to normal if no data

    // Adjust for trend (declining scores = lower readiness)
    const trendAdjustment = calculateTrendAdjustment(previousDays);
    const adjustedScore = Math.max(0, Math.min(100, overallScore + trendAdjustment));

    // Determine recommended intensity
    const recommendedIntensity = getIntensityFromScore(adjustedScore);

    // Generate task adjustments
    const taskAdjustments = generateTaskAdjustments(recommendedIntensity);

    // Save readiness
    const { data: saved, error } = await supabase
      .from('daily_readiness')
      .insert({
        user_id: userId,
        date: dateStr,
        overall_score: adjustedScore,
        sleep_score: sleepScore,
        recovery_score: recoveryScore,
        hrv_score: hrvScore,
        stress_score: stressScore,
        primary_source: wearableData ? 'wearable' : 'manual',
        data_sources: [
          ...(wearableData ? ['wearable'] : []),
          ...(manualInput ? ['manual'] : [])
        ],
        recommended_intensity: recommendedIntensity,
        task_adjustments: taskAdjustments
      })
      .select()
      .single();

    if (error) throw error;

    return saved;
  } catch (error) {
    console.error('Error calculating readiness:', error);
    return {
      overall_score: 70,
      recommended_intensity: 'normal',
      task_adjustments: []
    };
  }
}

/**
 * Get readiness from wearable data
 */
async function getWearableReadinessData(userId, date) {
  try {
    const dateStr = formatDate(date);
    const startOfDay = `${dateStr}T00:00:00`;
    const endOfDay = `${dateStr}T23:59:59`;

    const { data, error } = await supabase
      .from('wearable_data')
      .select('metric_type, metric_value')
      .eq('user_id', userId)
      .gte('recorded_at', startOfDay)
      .lte('recorded_at', endOfDay);

    if (error || !data || data.length === 0) return null;

    // Aggregate metrics
    const metrics = {};
    for (const d of data) {
      metrics[d.metric_type] = d.metric_value;
    }

    return metrics;
  } catch (error) {
    console.error('Error fetching wearable data:', error);
    return null;
  }
}

/**
 * Get manual input for readiness
 */
async function getManualReadinessInput(userId, date) {
  // Could come from a morning check-in task
  // For now, return null (to be implemented with check-in UI)
  return null;
}

/**
 * Get previous days' readiness for trend calculation
 */
async function getPreviousDaysData(userId, date, days) {
  try {
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_readiness')
      .select('overall_score, date')
      .eq('user_id', userId)
      .gte('date', formatDate(startDate))
      .lte('date', formatDate(endDate))
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching previous days:', error);
    return [];
  }
}

/**
 * Calculate HRV score relative to baseline
 */
function calculateHRVScore(currentHRV, baselineHRV) {
  if (!baselineHRV || !currentHRV) return null;

  const ratio = currentHRV / baselineHRV;

  if (ratio >= 1.1) return 90; // Above baseline = great
  if (ratio >= 1.0) return 80;
  if (ratio >= 0.9) return 70;
  if (ratio >= 0.8) return 50;
  return 30; // Significantly below baseline
}

/**
 * Calculate trend adjustment from previous days
 */
function calculateTrendAdjustment(previousDays) {
  if (!previousDays || previousDays.length < 2) return 0;

  const scores = previousDays.map(d => d.overall_score);
  const recentAvg = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  const olderAvg = scores.length > 2
    ? scores.slice(2).reduce((a, b) => a + b, 0) / scores.slice(2).length
    : recentAvg;

  const trend = recentAvg - olderAvg;

  // Declining trend = negative adjustment
  if (trend < -10) return -10;
  if (trend < -5) return -5;
  if (trend > 10) return 5;
  if (trend > 5) return 3;
  return 0;
}

/**
 * Get intensity level from score
 */
function getIntensityFromScore(score) {
  if (score < 30) return 'rest';
  if (score < 50) return 'light';
  if (score < 70) return 'normal';
  if (score < 85) return 'high';
  return 'peak';
}

/**
 * Generate task adjustments for intensity level
 */
function generateTaskAdjustments(intensity) {
  const level = INTENSITY_LEVELS[intensity];
  if (!level) return [];

  return [
    ...level.skipTypes.map(type => ({
      action: 'skip',
      taskType: type,
      reason_de: level.description_de,
      reason_en: level.description_en
    })),
    ...level.emphasizeTypes.map(type => ({
      action: 'emphasize',
      taskType: type,
      reason_de: level.description_de,
      reason_en: level.description_en
    }))
  ];
}

// =====================================================
// MANUAL READINESS INPUT
// =====================================================

/**
 * Record manual readiness input
 * @param {string} userId - User ID
 * @param {Object} input - Manual input { energy: 1-10, mood: 1-10, soreness: 1-10 }
 * @returns {Promise<Object>}
 */
export async function recordManualReadiness(userId, input) {
  try {
    const dateStr = formatDate(new Date());

    // Calculate score from manual inputs
    const energyScore = (input.energy || 5) * 10;
    const moodScore = (input.mood || 5) * 10;
    const sorenessScore = input.soreness ? (10 - input.soreness) * 10 : 70; // Invert soreness

    const overallScore = Math.round((energyScore * 0.4 + moodScore * 0.3 + sorenessScore * 0.3));
    const recommendedIntensity = getIntensityFromScore(overallScore);

    const { data, error } = await supabase
      .from('daily_readiness')
      .upsert({
        user_id: userId,
        date: dateStr,
        overall_score: overallScore,
        energy_level: input.energy,
        mood_level: input.mood,
        soreness_level: input.soreness,
        primary_source: 'manual',
        data_sources: ['manual'],
        recommended_intensity: recommendedIntensity,
        task_adjustments: generateTaskAdjustments(recommendedIntensity)
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, readiness: data };
  } catch (error) {
    console.error('Error recording manual readiness:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// TASK SWAPPING
// =====================================================

/**
 * Adjust tasks based on readiness
 * @param {Array} tasks - Original tasks
 * @param {Object} readiness - Readiness data
 * @returns {Array}
 */
export function adjustTasksForReadiness(tasks, readiness) {
  if (!readiness || !tasks) return tasks;

  const intensity = INTENSITY_LEVELS[readiness.recommended_intensity] || INTENSITY_LEVELS.normal;
  const adjustments = readiness.task_adjustments || [];

  return tasks.map(task => {
    const pillar = task.pillar?.toLowerCase();
    const taskType = task.task_type?.toLowerCase();

    // Check if task should be skipped
    const shouldSkip = intensity.skipTypes.some(type =>
      pillar?.includes(type) || taskType?.includes(type)
    );

    // Check if task should be emphasized
    const shouldEmphasize = intensity.emphasizeTypes.some(type =>
      pillar?.includes(type) || taskType?.includes(type)
    );

    // Adjust duration based on multiplier
    const adjustedDuration = Math.round((task.duration_minutes || 5) * intensity.multiplier);

    return {
      ...task,
      readiness_skip: shouldSkip,
      readiness_emphasize: shouldEmphasize,
      original_duration: task.duration_minutes,
      duration_minutes: shouldSkip ? 0 : adjustedDuration,
      readiness_note: shouldSkip
        ? (readiness.recommended_intensity === 'rest' ? 'Heute pausieren' : 'Reduziert')
        : shouldEmphasize
          ? 'Priorisiert'
          : null
    };
  });
}

/**
 * Get today's readiness for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getTodayReadiness(userId) {
  return calculateReadinessScore(userId, new Date());
}

/**
 * Get readiness history
 * @param {string} userId - User ID
 * @param {number} days - Number of days
 * @returns {Promise<Array>}
 */
export async function getReadinessHistory(userId, days = 7) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_readiness')
      .select('*')
      .eq('user_id', userId)
      .gte('date', formatDate(startDate))
      .lte('date', formatDate(endDate))
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching readiness history:', error);
    return [];
  }
}

/**
 * Get intensity level info
 */
export function getIntensityLevels() {
  return INTENSITY_LEVELS;
}

// =====================================================
// HELPERS
// =====================================================

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export default {
  calculateReadinessScore,
  recordManualReadiness,
  adjustTasksForReadiness,
  getTodayReadiness,
  getReadinessHistory,
  getIntensityLevels
};
