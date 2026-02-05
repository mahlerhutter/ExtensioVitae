/**
 * Recovery Score Service (No-Wearable Version)
 * 
 * Calculates recovery score based on 3 simple morning questions:
 * 1. Sleep duration (4-10 hours)
 * 2. Wake-ups during night (0, 1-2, 3+)
 * 3. Subjective feeling (😴 😐 ⚡)
 * 
 * Score: 0-100
 * - < 50: Poor recovery → Auto-swap HIIT to Yoga Nidra
 * - 50-70: Moderate recovery → Reduce intensity
 * - 70+: Good recovery → Proceed as planned
 * 
 * Part of Recovery Score & Auto-Swap module (Score: 15)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const RECOVERY_THRESHOLDS = {
    POOR: 50,      // Below this: swap high-intensity tasks
    MODERATE: 70,  // Below this: reduce intensity
    GOOD: 85       // Above this: optimal recovery
};

export const FEELING_SCORES = {
    EXHAUSTED: 0,   // 😴
    NEUTRAL: 50,    // 😐
    ENERGIZED: 100  // ⚡
};

export const WAKEUP_PENALTIES = {
    NONE: 0,        // 0 wake-ups
    FEW: 15,        // 1-2 wake-ups
    MANY: 30        // 3+ wake-ups
};

// ============================================================================
// CORE CALCULATION
// ============================================================================

/**
 * Calculates recovery score from morning check-in answers
 * @param {Object} answers - Morning check-in answers
 * @param {number} answers.sleepHours - Hours slept (4-10)
 * @param {number} answers.wakeUps - Number of wake-ups (0, 1-2, 3+)
 * @param {string} answers.feeling - Subjective feeling ('exhausted', 'neutral', 'energized')
 * @returns {Object} Recovery score and metadata
 */
export function calculateRecoveryScore(answers) {
    const { sleepHours, wakeUps, feeling } = answers;

    // Validate inputs
    if (!sleepHours || !feeling) {
        throw new Error('Missing required fields: sleepHours and feeling are required');
    }

    // 1. Sleep Duration Score (0-40 points)
    const sleepScore = calculateSleepScore(sleepHours);

    // 2. Sleep Quality Score (0-30 points) - based on wake-ups
    const qualityScore = calculateQualityScore(wakeUps);

    // 3. Subjective Feeling Score (0-30 points)
    const feelingScore = calculateFeelingScore(feeling);

    // Total Score (0-100)
    const totalScore = Math.round(sleepScore + qualityScore + feelingScore);

    // Determine recovery level
    const level = getRecoveryLevel(totalScore);

    // Generate recommendations
    const recommendations = generateRecommendations(totalScore, answers);

    return {
        score: totalScore,
        level,
        breakdown: {
            sleepScore,
            qualityScore,
            feelingScore
        },
        recommendations,
        shouldSwapIntensity: totalScore < RECOVERY_THRESHOLDS.POOR,
        timestamp: new Date().toISOString()
    };
}

/**
 * Calculates sleep duration score (0-40 points)
 * Optimal: 7-9 hours
 */
function calculateSleepScore(hours) {
    if (hours < 4) return 0;
    if (hours >= 7 && hours <= 9) return 40; // Optimal range
    if (hours === 6 || hours === 10) return 30; // Close to optimal
    if (hours === 5 || hours > 10) return 20; // Suboptimal
    return 10; // Very suboptimal
}

/**
 * Calculates sleep quality score based on wake-ups (0-30 points)
 */
function calculateQualityScore(wakeUps) {
    if (wakeUps === 0) return 30; // No wake-ups = perfect
    if (wakeUps <= 2) return 15;  // 1-2 wake-ups = moderate
    return 0; // 3+ wake-ups = poor quality
}

/**
 * Calculates subjective feeling score (0-30 points)
 */
function calculateFeelingScore(feeling) {
    const scores = {
        exhausted: 0,
        neutral: 15,
        energized: 30
    };
    return scores[feeling] || 15;
}

/**
 * Determines recovery level from score
 */
function getRecoveryLevel(score) {
    if (score >= RECOVERY_THRESHOLDS.GOOD) return 'excellent';
    if (score >= RECOVERY_THRESHOLDS.MODERATE) return 'good';
    if (score >= RECOVERY_THRESHOLDS.POOR) return 'moderate';
    return 'poor';
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * Generates personalized recommendations based on recovery score
 */
function generateRecommendations(score, answers) {
    const recommendations = [];

    // Sleep duration recommendations
    if (answers.sleepHours < 7) {
        recommendations.push({
            category: 'sleep_duration',
            priority: 'high',
            message: `You slept ${answers.sleepHours} hours. Aim for 7-9 hours tonight.`,
            action: 'Set an earlier bedtime reminder'
        });
    } else if (answers.sleepHours > 9) {
        recommendations.push({
            category: 'sleep_duration',
            priority: 'medium',
            message: 'You slept longer than usual. Check for sleep debt or illness.',
            action: 'Monitor energy levels throughout the day'
        });
    }

    // Sleep quality recommendations
    if (answers.wakeUps >= 3) {
        recommendations.push({
            category: 'sleep_quality',
            priority: 'high',
            message: 'Multiple wake-ups detected. Consider sleep hygiene improvements.',
            action: 'Review: room temperature, noise, light, caffeine timing'
        });
    } else if (answers.wakeUps >= 1) {
        recommendations.push({
            category: 'sleep_quality',
            priority: 'medium',
            message: 'Some wake-ups during the night.',
            action: 'Avoid fluids 2 hours before bed'
        });
    }

    // Feeling-based recommendations
    if (answers.feeling === 'exhausted') {
        recommendations.push({
            category: 'energy',
            priority: 'high',
            message: 'You\'re feeling exhausted despite sleep.',
            action: 'Consider stress levels, nutrition, and hydration'
        });
    }

    // Recovery-based training recommendations
    if (score < RECOVERY_THRESHOLDS.POOR) {
        recommendations.push({
            category: 'training',
            priority: 'critical',
            message: 'Poor recovery detected. High-intensity training swapped to recovery activities.',
            action: 'HIIT → Yoga Nidra, Heavy Lifting → Light Stretching'
        });
    } else if (score < RECOVERY_THRESHOLDS.MODERATE) {
        recommendations.push({
            category: 'training',
            priority: 'high',
            message: 'Moderate recovery. Reduce training intensity by 30%.',
            action: 'Lower weights, reduce cardio intensity'
        });
    }

    return recommendations;
}

// ============================================================================
// AUTO-SWAP LOGIC
// ============================================================================

/**
 * Determines if a task should be swapped based on recovery score
 * @param {Object} task - Task object
 * @param {number} recoveryScore - Current recovery score
 * @returns {Object|null} Swap suggestion or null
 */
export function shouldSwapTask(task, recoveryScore) {
    if (!task || recoveryScore >= RECOVERY_THRESHOLDS.POOR) {
        return null; // No swap needed
    }

    // High-intensity task mappings
    const swapMappings = {
        'HIIT': 'Yoga Nidra',
        'Heavy Lifting': 'Light Stretching',
        'Sprints': 'Walking',
        'CrossFit': 'Mobility Work',
        'Running': 'Gentle Yoga',
        'Intense Cardio': 'Breathwork'
    };

    // Check if task contains high-intensity keywords
    const taskName = task.title || task.name || '';
    for (const [highIntensity, lowIntensity] of Object.entries(swapMappings)) {
        if (taskName.toLowerCase().includes(highIntensity.toLowerCase())) {
            return {
                originalTask: taskName,
                swappedTask: lowIntensity,
                reason: `Recovery score ${recoveryScore}/100 is below threshold (${RECOVERY_THRESHOLDS.POOR})`,
                category: 'recovery_swap'
            };
        }
    }

    // Check task intensity level if available
    if (task.intensity && task.intensity >= 4) {
        return {
            originalTask: taskName,
            swappedTask: `${taskName} (Reduced Intensity)`,
            reason: `Recovery score ${recoveryScore}/100 - reduce intensity by 50%`,
            category: 'intensity_reduction'
        };
    }

    return null;
}

/**
 * Applies recovery-based swaps to a list of tasks
 * @param {Array} tasks - Array of tasks
 * @param {number} recoveryScore - Current recovery score
 * @returns {Object} Modified tasks and swap summary
 */
export function applyRecoverySwaps(tasks, recoveryScore) {
    if (!Array.isArray(tasks)) {
        return { tasks: [], swaps: [] };
    }

    const swaps = [];
    const modifiedTasks = tasks.map(task => {
        const swap = shouldSwapTask(task, recoveryScore);
        if (swap) {
            swaps.push(swap);
            return {
                ...task,
                title: swap.swappedTask,
                originalTitle: swap.originalTask,
                swapped: true,
                swapReason: swap.reason
            };
        }
        return task;
    });

    return {
        tasks: modifiedTasks,
        swaps,
        swapCount: swaps.length
    };
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Saves recovery score to database
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {Object} recoveryData - Recovery score data
 * @returns {Promise<Object>} Saved record
 */
export async function saveRecoveryScore(supabase, userId, recoveryData) {
    const now = new Date();
    const { data, error } = await supabase
        .from('recovery_scores')
        .insert({
            user_id: userId,
            score: recoveryData.score,
            level: recoveryData.level,
            sleep_hours: recoveryData.breakdown.sleepScore,
            sleep_quality: recoveryData.breakdown.qualityScore,
            feeling: recoveryData.breakdown.feelingScore,
            recommendations: recoveryData.recommendations,
            check_in_date: now.toISOString().split('T')[0], // YYYY-MM-DD
            recorded_at: now.toISOString()
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to save recovery score: ${error.message}`);
    }

    return data;
}

/**
 * Gets recovery score history for a user
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {number} days - Number of days to fetch (default: 30)
 * @returns {Promise<Array>} Recovery score history
 */
export async function getRecoveryHistory(supabase, userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('recovery_scores')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch recovery history: ${error.message}`);
    }

    return data || [];
}

/**
 * Gets today's recovery score for a user
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Today's recovery score or null
 */
export async function getTodayRecoveryScore(supabase, userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('recovery_scores')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', today.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to fetch today's recovery score: ${error.message}`);
    }

    return data || null;
}

/**
 * Calculates recovery trend (improving/declining)
 * @param {Array} history - Recovery score history
 * @returns {Object} Trend analysis
 */
export function analyzeRecoveryTrend(history) {
    if (!Array.isArray(history) || history.length < 2) {
        return { trend: 'insufficient_data', change: 0 };
    }

    const recent = history.slice(0, 7); // Last 7 days
    const older = history.slice(7, 14); // Previous 7 days

    if (older.length === 0) {
        return { trend: 'insufficient_data', change: 0 };
    }

    const recentAvg = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.score, 0) / older.length;

    const change = recentAvg - olderAvg;
    const percentChange = (change / olderAvg) * 100;

    let trend = 'stable';
    if (percentChange > 5) trend = 'improving';
    if (percentChange < -5) trend = 'declining';

    return {
        trend,
        change: Math.round(change),
        percentChange: Math.round(percentChange),
        recentAverage: Math.round(recentAvg),
        previousAverage: Math.round(olderAvg)
    };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
    calculateRecoveryScore,
    shouldSwapTask,
    applyRecoverySwaps,
    saveRecoveryScore,
    getRecoveryHistory,
    getTodayRecoveryScore,
    analyzeRecoveryTrend,
    RECOVERY_THRESHOLDS,
    FEELING_SCORES
};
