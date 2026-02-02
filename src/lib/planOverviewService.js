/**
 * Plan Overview Service
 * Generates metadata and overview information for plan review
 */

/**
 * Calculate plan overview metadata from a generated plan
 * @param {Object} plan - The generated plan object
 * @param {Object} intakeData - Original intake form responses
 * @returns {Object} Plan overview metadata
 */
export function calculatePlanOverview(plan, intakeData = {}) {
    if (!plan || !plan.days) {
        console.error('[PlanOverview] Invalid plan structure');
        return null;
    }

    try {
        // Calculate focus breakdown (percentage per pillar)
        const focusBreakdown = calculateFocusBreakdown(plan);

        // Calculate time commitment
        const timeCommitment = calculateTimeCommitment(plan);

        // Determine difficulty level
        const difficulty = determineDifficulty(plan, intakeData);

        // Generate phase breakdown
        const phases = generatePhaseBreakdown(plan);

        // Extract sample activities
        const sampleActivities = extractSampleActivities(plan);

        // Generate title and tagline
        const { title, tagline } = generateTitleAndTagline(focusBreakdown, intakeData);

        // Calculate projected impact (placeholder - can be enhanced)
        const projectedImpact = calculateProjectedImpact(focusBreakdown, timeCommitment);

        return {
            title,
            tagline,
            projected_impact: projectedImpact,
            daily_commitment_avg: timeCommitment.average,
            daily_commitment_range: timeCommitment.range,
            difficulty,
            phases,
            focus_breakdown: focusBreakdown,
            sample_activities: sampleActivities,
            generated_at: new Date().toISOString(),
        };
    } catch (error) {
        console.error('[PlanOverview] Error calculating overview:', error);
        return null;
    }
}

/**
 * Calculate percentage breakdown by pillar
 */
function calculateFocusBreakdown(plan) {
    const pillarCounts = {
        movement: 0,
        nutrition: 0,
        sleep: 0,
        stress: 0,
        cognitive: 0,
        social: 0,
    };

    let totalTasks = 0;

    // Count tasks per pillar
    Object.values(plan.days).forEach(day => {
        if (day.tasks && Array.isArray(day.tasks)) {
            day.tasks.forEach(task => {
                const pillar = task.pillar?.toLowerCase() || 'movement';
                if (pillarCounts.hasOwnProperty(pillar)) {
                    pillarCounts[pillar]++;
                    totalTasks++;
                }
            });
        }
    });

    // Convert to percentages
    const percentages = {};
    Object.keys(pillarCounts).forEach(pillar => {
        percentages[pillar] = totalTasks > 0
            ? Math.round((pillarCounts[pillar] / totalTasks) * 100)
            : 0;
    });

    // Ensure percentages sum to 100 (adjust for rounding)
    const sum = Object.values(percentages).reduce((a, b) => a + b, 0);
    if (sum !== 100 && sum > 0) {
        const diff = 100 - sum;
        const maxPillar = Object.keys(percentages).reduce((a, b) =>
            percentages[a] > percentages[b] ? a : b
        );
        percentages[maxPillar] += diff;
    }

    return percentages;
}

/**
 * Calculate average and range of daily time commitment
 */
function calculateTimeCommitment(plan) {
    const dailyTimes = [];

    Object.values(plan.days).forEach(day => {
        let dayTotal = 0;
        if (day.tasks && Array.isArray(day.tasks)) {
            day.tasks.forEach(task => {
                // Extract time from task description (e.g., "10-min walk" -> 10)
                const timeMatch = task.description?.match(/(\d+)[-\s]?min/i);
                if (timeMatch) {
                    dayTotal += parseInt(timeMatch[1], 10);
                } else {
                    // Default estimate if no time specified
                    dayTotal += 10;
                }
            });
        }
        dailyTimes.push(dayTotal);
    });

    const average = dailyTimes.length > 0
        ? Math.round(dailyTimes.reduce((a, b) => a + b, 0) / dailyTimes.length)
        : 30;

    const range = dailyTimes.length > 0
        ? [Math.min(...dailyTimes), Math.max(...dailyTimes)]
        : [20, 50];

    return { average, range };
}

/**
 * Determine difficulty level based on plan characteristics
 */
function determineDifficulty(plan, intakeData) {
    // Factors: time commitment, task complexity, user's current level
    const timeCommitment = calculateTimeCommitment(plan);
    const avgTime = timeCommitment.average;

    // Simple heuristic
    if (avgTime < 25) return 'gentle';
    if (avgTime < 40) return 'moderate';
    return 'intense';
}

/**
 * Generate 3-phase breakdown
 */
function generatePhaseBreakdown(plan) {
    return [
        {
            name: 'Foundation',
            days: '1-10',
            focus: 'Building habits, gentle introduction',
            intensity: 'low-medium',
            icon: '🌱',
        },
        {
            name: 'Growth',
            days: '11-20',
            focus: 'Increasing complexity, adding variety',
            intensity: 'medium-high',
            icon: '🌿',
        },
        {
            name: 'Mastery',
            days: '21-30',
            focus: 'Optimization, advanced techniques',
            intensity: 'medium-high',
            icon: '🌳',
        },
    ];
}

/**
 * Extract sample activities from specific days
 */
function extractSampleActivities(plan) {
    // plan.days is an array (0-indexed), so day 3 is at index 2
    const sampleDayIndices = [2, 14, 27]; // Days 3, 15, 28
    const samples = [];

    sampleDayIndices.forEach((index, i) => {
        const day = plan.days[index];
        if (day && day.tasks && day.tasks.length > 0) {
            const activities = day.tasks.slice(0, 3).map(task => {
                // Use task.task (the description) or task.how
                return task.task || task.how || task.description || 'Aktivität';
            });

            samples.push({
                day: index + 1, // Convert back to 1-indexed for display
                activities,
            });
        }
    });

    return samples;
}

/**
 * Generate title and tagline based on focus areas
 */
function generateTitleAndTagline(focusBreakdown, intakeData) {
    const title = 'Your Personalized Longevity Blueprint';

    // Find top 2 focus areas
    const sorted = Object.entries(focusBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);

    const pillarNames = {
        movement: 'Movement',
        nutrition: 'Nutrition',
        sleep: 'Sleep Optimization',
        stress: 'Stress Management',
        cognitive: 'Cognitive Health',
        social: 'Social Connection',
    };

    const topAreas = sorted.map(([pillar]) => pillarNames[pillar]);
    const tagline = `Focus: ${topAreas.join(' & ')}`;

    return { title, tagline };
}

/**
 * Calculate projected longevity impact (simplified)
 */
function calculateProjectedImpact(focusBreakdown, timeCommitment) {
    // Simplified calculation based on focus areas and commitment
    // In reality, this would use more sophisticated models
    const baseImpact = 2.0;
    const timeBonus = timeCommitment.average / 100; // 0.3 for 30 min
    const focusBonus = Object.values(focusBreakdown).filter(v => v > 20).length * 0.3;

    const total = baseImpact + timeBonus + focusBonus;
    return `+${total.toFixed(1)} years`;
}

/**
 * Save plan overview to database
 */
export async function savePlanOverview(supabase, planId, overview) {
    if (!supabase || !planId || !overview) {
        console.error('[PlanOverview] Missing required parameters');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('plans')
            .update({ plan_overview: overview })
            .eq('id', planId)
            .select()
            .single();

        if (error) throw error;

        console.log('[PlanOverview] Saved overview for plan:', planId);
        return data;
    } catch (error) {
        console.error('[PlanOverview] Error saving overview:', error);
        throw error;
    }
}

/**
 * Get plan overview from database
 */
export async function getPlanOverview(supabase, planId) {
    if (!supabase || !planId) {
        console.error('[PlanOverview] Missing required parameters');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('plans')
            .select('plan_overview')
            .eq('id', planId)
            .single();

        if (error) throw error;

        return data?.plan_overview || null;
    } catch (error) {
        console.error('[PlanOverview] Error getting overview:', error);
        return null;
    }
}
