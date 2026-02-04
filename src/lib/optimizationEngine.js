/**
 * Chrono-Adaptive Task Engine (v0.5.0 + v0.6.0)
 *
 * Zero-Input Intelligence Layer that dynamically modifies daily plans based on:
 * - Biological windows (circadianService)
 * - Emergency modes (ModeContext)
 * - Calendar load (CalendarProvider)
 * - Active protocols (Protocol Packs)
 * - Daily Readiness Score (v0.6.0)
 *
 * Implements:
 * - Mode-Swap: Replaces tasks based on emergency mode
 * - Chrono-Injection: Injects protocol tasks into optimal biological windows
 * - Buffer Optimization: Shortens tasks on busy days
 * - Readiness-Swap: Auto-Recovery Mode for low readiness (v0.6.0)
 *
 * @module optimizationEngine
 */

import { getCircadianIntelligence } from './circadianService';
import { adjustTasksForReadiness } from './readinessService';
import { logger } from './logger';

// ============================================
// CONSTANTS & CONFIGS
// ============================================

/**
 * Task swap rules based on emergency mode
 * Format: { mode: { originalPattern: replacement } }
 */
const MODE_SWAP_RULES = {
    sick: {
        patterns: [
            { match: /hiit|gym|workout|laufen|joggen|cardio|kraft/i, replace: 'Gentle Yoga oder NSDR (10 min)', pillar: 'movement', reason: 'Angepasst an Erholungs-Modus' },
            { match: /kalt.*dusche|cold.*shower|ice.*bath/i, replace: 'Warme Dusche (5 min)', pillar: 'recovery', reason: 'Immunsystem schonen' },
            { match: /fasten|fasting/i, replace: 'Regelmäßige, nahrhafte Mahlzeiten', pillar: 'nutrition', reason: 'Körper braucht Energie zur Heilung' }
        ]
    },
    travel: {
        patterns: [
            { match: /gym|fitnessstudio/i, replace: '20-min Bodyweight Circuit (Hotelzimmer)', pillar: 'movement', reason: 'Angepasst an Reise-Modus' },
            { match: /meditation|meditieren/i, replace: 'Atemübung (2-3 Minuten)', pillar: 'stress', reason: 'Verkürzt für Reise' },
            { match: /meal.*prep|kochen/i, replace: 'Gesunde Restaurant-Option wählen', pillar: 'nutrition', reason: 'Keine Küche verfügbar' }
        ]
    },
    deep_work: {
        patterns: [
            { match: /call|anruf|meeting|termin/i, replace: 'Batch für später (nach 14:00)', pillar: 'productivity', reason: 'Deep Work Schutz' },
            { match: /social.*media|instagram|twitter/i, replace: '❌ Blockiert während Deep Work', pillar: 'focus', reason: 'Ablenkung eliminiert' }
        ]
    },
    detox: {
        patterns: [
            { match: /alkohol|alcohol|wein|bier/i, replace: '❌ Alkohol-freie Alternative', pillar: 'nutrition', reason: 'Detox-Modus aktiv' },
            { match: /zucker|süß|dessert|candy/i, replace: 'Früchte oder Nüsse', pillar: 'nutrition', reason: 'Detox-Modus aktiv' },
            { match: /kaffee|coffee/i, replace: 'Grüner Tee oder Kräutertee', pillar: 'nutrition', reason: 'Caffeine-Detox' }
        ]
    }
};

/**
 * Emergency versions of tasks (5-min alternatives for busy days)
 */
const EMERGENCY_TASK_VERSIONS = {
    meditation: { original: 15, emergency: 5, task: 'Box Breathing (5 min)' },
    exercise: { original: 30, emergency: 10, task: '10 Burpees + 10 Push-ups' },
    reading: { original: 20, emergency: 5, task: '1 Artikel oder Zusammenfassung' },
    cooking: { original: 45, emergency: 15, task: 'Meal Prep leftovers oder Salat' },
    journaling: { original: 10, emergency: 3, task: '3 Stichpunkte Dankbarkeit' }
};

/**
 * Optimal biological windows for different task types
 */
const TASK_WINDOW_MAPPING = {
    'Morning Pulse': ['light exposure', 'morning walk', 'sonnenlicht', 'tageslicht', 'vitamin d'],
    'Flow State': ['deep work', 'focus', 'konzentration', 'lernen', 'coding', 'writing'],
    'Melatonin Onset': ['supplements', 'magnesium', 'melatonin', 'zink', 'blue light cutoff', 'bildschirmzeit'],
    'Baseline': ['admin', 'emails', 'errands', 'routine tasks']
};

// ============================================
// LOGIC A: MODE-SWAP
// ============================================

/**
 * Replace tasks based on active emergency mode
 *
 * @param {Array} tasks - Original daily tasks
 * @param {string} activeMode - Current emergency mode ('normal', 'sick', 'travel', etc.)
 * @returns {Array} Modified tasks
 */
export function applyModeSwap(tasks, activeMode = 'normal') {
    if (activeMode === 'normal' || !MODE_SWAP_RULES[activeMode]) {
        return tasks;
    }

    const rules = MODE_SWAP_RULES[activeMode];
    let swapCount = 0;

    const modifiedTasks = tasks.map(task => {
        // Check each pattern
        for (const rule of rules.patterns) {
            if (rule.match.test(task.task)) {
                swapCount++;
                logger.debug(`[OptimizationEngine] Mode-Swap: "${task.task}" → "${rule.replace}"`);
                return {
                    ...task,
                    originalTask: task.task,
                    task: rule.replace,
                    optimized: true,
                    optimizationType: 'mode_swap',
                    optimizationReason: rule.reason,
                    pillar: rule.pillar || task.pillar
                };
            }
        }
        return task;
    });

    if (swapCount > 0) {
        logger.info(`[OptimizationEngine] Mode-Swap: ${swapCount} tasks modified for ${activeMode} mode`);
    }

    return modifiedTasks;
}

// ============================================
// LOGIC B: CHRONO-INJECTION
// ============================================

/**
 * Inject protocol tasks into optimal biological windows
 *
 * @param {Array} tasks - Original daily tasks
 * @param {Object} activePack - Active protocol pack
 * @param {Object} circadianIntel - Circadian intelligence data
 * @returns {Array} Modified tasks with protocol injections
 */
export function applyChronoInjection(tasks, activePack, circadianIntel) {
    if (!activePack || !activePack.tasks) {
        return tasks;
    }

    const { currentPhase } = circadianIntel;
    const injectedTasks = [];

    // Map protocol tasks to optimal windows
    activePack.tasks.forEach(protocolTask => {
        // Determine optimal window based on task content
        let optimalWindow = 'Baseline';
        let shouldInject = false;

        // Check task keywords against window mappings
        for (const [window, keywords] of Object.entries(TASK_WINDOW_MAPPING)) {
            if (keywords.some(keyword =>
                protocolTask.title.toLowerCase().includes(keyword) ||
                protocolTask.descr?.toLowerCase().includes(keyword)
            )) {
                optimalWindow = window;
                shouldInject = (currentPhase === window);
                break;
            }
        }

        // Special handling for time-sensitive protocol tasks
        // E.g., "Zink-Einnahme" should be injected in Melatonin Onset window
        if (protocolTask.category === 'nutrition' &&
            (protocolTask.title.toLowerCase().includes('zink') ||
             protocolTask.title.toLowerCase().includes('magnesium') ||
             protocolTask.title.toLowerCase().includes('supplement'))) {
            optimalWindow = 'Melatonin Onset';
            shouldInject = (currentPhase === 'Melatonin Onset');
        }

        // Inject task if we're in the optimal window
        if (shouldInject) {
            injectedTasks.push({
                id: `protocol_${protocolTask.id}`,
                task: `🛡️ ${protocolTask.title}: ${protocolTask.descr}`,
                pillar: protocolTask.category,
                time_minutes: protocolTask.time_minutes,
                when: 'now',
                priority: protocolTask.priority || 'high',
                optimized: true,
                optimizationType: 'chrono_injection',
                optimizationReason: `Biologisch optimal jetzt (${optimalWindow})`,
                protocolSource: activePack.title
            });
        }
    });

    if (injectedTasks.length > 0) {
        logger.info(`[OptimizationEngine] Chrono-Injection: ${injectedTasks.length} protocol tasks injected for ${currentPhase}`);
        // Insert injected tasks at the top (highest priority)
        return [...injectedTasks, ...tasks];
    }

    return tasks;
}

// ============================================
// LOGIC C: BUFFER OPTIMIZATION
// ============================================

/**
 * Shorten tasks on busy days
 *
 * @param {Array} tasks - Original daily tasks
 * @param {boolean} isBusyDay - Whether today is a busy day (from calendar)
 * @param {number} busyThreshold - Minutes of scheduled events to consider "busy"
 * @returns {Array} Modified tasks
 */
export function applyBufferOptimization(tasks, isBusyDay = false, busyThreshold = 240) {
    if (!isBusyDay) {
        return tasks;
    }

    let shortenCount = 0;

    const modifiedTasks = tasks.map(task => {
        // Only shorten tasks that are 15+ minutes
        if (task.time_minutes < 15) {
            return task;
        }

        // Check if task has an emergency version
        const taskKeywords = Object.keys(EMERGENCY_TASK_VERSIONS);
        for (const keyword of taskKeywords) {
            if (task.task.toLowerCase().includes(keyword)) {
                const emergency = EMERGENCY_TASK_VERSIONS[keyword];
                if (task.time_minutes >= emergency.original) {
                    shortenCount++;
                    logger.debug(`[OptimizationEngine] Buffer: "${task.task}" ${task.time_minutes}min → ${emergency.emergency}min`);
                    return {
                        ...task,
                        originalTask: task.task,
                        originalTime: task.time_minutes,
                        task: emergency.task,
                        time_minutes: emergency.emergency,
                        optimized: true,
                        optimizationType: 'buffer_optimization',
                        optimizationReason: 'Verkürzt für vollen Kalender'
                    };
                }
            }
        }

        // Generic shortening: reduce by 50% if no specific rule
        if (task.time_minutes >= 20) {
            shortenCount++;
            const newTime = Math.max(5, Math.floor(task.time_minutes / 2));
            logger.debug(`[OptimizationEngine] Buffer (generic): "${task.task}" ${task.time_minutes}min → ${newTime}min`);
            return {
                ...task,
                originalTime: task.time_minutes,
                time_minutes: newTime,
                optimized: true,
                optimizationType: 'buffer_optimization',
                optimizationReason: 'Verkürzt für vollen Kalender (50%)'
            };
        }

        return task;
    });

    if (shortenCount > 0) {
        logger.info(`[OptimizationEngine] Buffer: ${shortenCount} tasks shortened for busy day`);
    }

    return modifiedTasks;
}

// ============================================
// MAIN ENGINE: Combine All Logics
// ============================================

/**
 * Optimize daily plan by applying all optimization logics
 *
 * @param {Object} dailyPlan - Day object with tasks array
 * @param {Object} context - Context object with mode, protocols, calendar, circadian, readiness
 * @returns {Object} Optimized daily plan
 */
export function optimizeDailyPlan(dailyPlan, context = {}) {
    if (!dailyPlan || !dailyPlan.tasks) {
        return dailyPlan;
    }

    const {
        activeMode = 'normal',
        activePack = null,
        circadianIntel = null,
        isBusyDay = false,
        busyThreshold = 240,
        readinessData = null
    } = context;

    let optimizedTasks = [...dailyPlan.tasks];
    const optimizationSummary = {
        modeSwaps: 0,
        chronoInjections: 0,
        bufferOptimizations: 0,
        readinessSwaps: 0,
        autoRecoveryMode: false
    };

    // STEP 1: Apply Mode-Swap
    const afterModeSwap = applyModeSwap(optimizedTasks, activeMode);
    optimizationSummary.modeSwaps = afterModeSwap.filter(t => t.optimizationType === 'mode_swap').length;

    // STEP 2: Apply Chrono-Injection (requires circadian intelligence)
    let afterChronoInjection = afterModeSwap;
    if (circadianIntel) {
        afterChronoInjection = applyChronoInjection(afterModeSwap, activePack, circadianIntel);
        optimizationSummary.chronoInjections = afterChronoInjection.filter(t => t.optimizationType === 'chrono_injection').length;
    }

    // STEP 3: Apply Buffer Optimization
    const afterBufferOptimization = applyBufferOptimization(afterChronoInjection, isBusyDay, busyThreshold);
    optimizationSummary.bufferOptimizations = afterBufferOptimization.filter(t => t.optimizationType === 'buffer_optimization').length;

    // STEP 4: Apply Readiness-Based Swapping (v0.6.0 - Auto-Recovery Mode)
    let afterReadinessSwap = afterBufferOptimization;
    if (readinessData && readinessData.overall_score !== undefined) {
        afterReadinessSwap = adjustTasksForReadiness(afterBufferOptimization, readinessData);

        // Count readiness-based modifications
        optimizationSummary.readinessSwaps = afterReadinessSwap.filter(t =>
            t.readiness_skip || t.readiness_emphasize || t.original_duration !== t.duration_minutes
        ).length;

        // Check if Auto-Recovery Mode is active
        if (readinessData.overall_score < 45 && readinessData.recommended_intensity === 'rest') {
            optimizationSummary.autoRecoveryMode = true;
            logger.warn('[OptimizationEngine] AUTO-RECOVERY MODE ACTIVATED - Score:', readinessData.overall_score);
        }
    }

    // Calculate total optimization count
    const totalOptimizations = optimizationSummary.modeSwaps +
                               optimizationSummary.chronoInjections +
                               optimizationSummary.bufferOptimizations +
                               optimizationSummary.readinessSwaps;

    if (totalOptimizations > 0) {
        logger.info(`[OptimizationEngine] Plan optimized: ${totalOptimizations} modifications`, optimizationSummary);
    }

    return {
        ...dailyPlan,
        tasks: afterReadinessSwap,
        optimized: totalOptimizations > 0,
        optimizationSummary
    };
}

/**
 * Get optimization context (convenience function for dashboard)
 *
 * @param {string} userId - User ID
 * @param {string} activeMode - Current emergency mode
 * @param {Object} activePack - Active protocol pack
 * @param {Array} calendarEvents - Today's calendar events
 * @returns {Object} Context for optimization engine
 */
export async function getOptimizationContext(userId, activeMode, activePack, calendarEvents = []) {
    try {
        // Get circadian intelligence
        const circadianIntel = getCircadianIntelligence();

        // Calculate if today is busy based on calendar
        const totalCalendarMinutes = calendarEvents.reduce((sum, event) => {
            const duration = event.duration_minutes || 60;
            return sum + duration;
        }, 0);
        const isBusyDay = totalCalendarMinutes >= 240; // 4+ hours = busy

        return {
            activeMode,
            activePack,
            circadianIntel,
            isBusyDay,
            busyThreshold: 240,
            calendarMinutes: totalCalendarMinutes
        };
    } catch (error) {
        logger.error('[OptimizationEngine] Failed to get context:', error);
        return {
            activeMode,
            activePack,
            circadianIntel: null,
            isBusyDay: false
        };
    }
}

// ============================================
// EXPORT
// ============================================

export default {
    optimizeDailyPlan,
    applyModeSwap,
    applyChronoInjection,
    applyBufferOptimization,
    getOptimizationContext
};
