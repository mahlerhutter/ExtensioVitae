/**
 * Health-Aware Plan Constraints
 * 
 * Extends plan generation to consider health conditions,
 * injuries, and other medical factors.
 */

import { CHRONIC_CONDITIONS, INJURIES_LIMITATIONS, calculatePlanConstraints } from './profileService.js';


/**
 * Tags that should be avoided for specific conditions
 * This maps to activities in the task library
 */
export const TAG_AVOIDANCE_RULES = {
    // High-intensity activities
    hiit: ['heart_disease', 'hypertension', 'cancer_active', 'copd', 'pregnancy'],
    hiit_intense: ['diabetes_type1', 'asthma', 'is_smoker'],

    // Heavy lifting
    heavy_lifting: ['heart_disease', 'hypertension', 'cancer_active', 'post_surgery', 'pregnancy'],

    // Impact activities
    jumping: ['arthritis', 'osteoporosis', 'knee_issues', 'hip_issues', 'ankle_issues', 'pregnancy'],
    running: ['arthritis', 'knee_issues', 'back_pain', 'copd'],
    high_impact: ['arthritis', 'osteoporosis', 'pregnancy', 'mobility_limited'],

    // Temperature extremes
    cold_exposure: ['heart_disease', 'asthma'],
    cold_exposure_intense: ['asthma', 'copd', 'heart_disease'],
    hot_yoga: ['pregnancy', 'heart_disease'],

    // Breathing holds
    breath_hold: ['heart_disease', 'hypertension', 'asthma'],

    // Fasting
    fasting: ['diabetes_type1', 'cancer_active', 'pregnancy'],
    fasting_extended: ['diabetes_type1', 'diabetes_type2', 'kidney_disease'],
    extreme_fasting: ['diabetes_type1', 'diabetes_type2', 'cancer_remission', 'liver_disease'],

    // Specific movements
    overhead_press: ['shoulder_issues'],
    pull_ups: ['shoulder_issues', 'wrist_issues'],
    deep_squats: ['knee_issues', 'hip_issues', 'back_pain'],
    lunges: ['knee_issues'],
    deadlift_heavy: ['back_pain'],
    twisting: ['osteoporosis', 'back_pain'],
    lying_on_back: ['pregnancy'], // After first trimester

    // Other
    alcohol: ['liver_disease'],
    high_protein_extreme: ['kidney_disease'],
    extreme_stress: ['autoimmune', 'burnout'],
    overtraining: ['autoimmune', 'burnout', 'chronic_fatigue']
};

/**
 * Tags that should be preferred for specific conditions
 */
export const TAG_PREFERENCE_RULES = {
    // Gentle activities
    gentle: ['heart_disease', 'cancer_active', 'copd', 'post_surgery', 'mobility_limited'],
    low_impact: ['arthritis', 'osteoporosis', 'knee_issues'],
    restorative: ['cancer_active', 'burnout', 'chronic_fatigue'],

    // Breathing
    breathing: ['anxiety', 'asthma', 'copd', 'stress_high'],
    breathing_exercises: ['anxiety', 'asthma', 'is_smoker'],

    // Mental health
    mindfulness: ['depression', 'anxiety', 'burnout'],
    meditation: ['anxiety', 'hypertension', 'stress_high'],
    outdoor: ['depression', 'anxiety'],
    nature: ['depression', 'anxiety', 'burnout'],
    morning_light: ['depression', 'insomnia'],

    // Cardio
    zone2: ['hypertension', 'diabetes_type2', 'heart_disease_stable'],
    light_cardio: ['heart_disease', 'copd'],
    light_walk: ['heart_disease', 'cancer_active'],

    // Specific
    mobility: ['arthritis', 'back_pain', 'shoulder_issues', 'hip_issues'],
    stretching: ['arthritis', 'back_pain'],
    swimming: ['arthritis', 'back_pain', 'knee_issues'],
    balance: ['osteoporosis'],
    core_stability: ['back_pain'],
    anti_inflammatory: ['cancer_remission', 'autoimmune', 'arthritis'],
    stress_reduction: ['autoimmune', 'burnout'],

    // Recovery focused
    recovery: ['thyroid_disorder', 'burnout'],
    hydration: ['kidney_disease', 'alcohol_daily'],

    // Women's health
    prenatal: ['pregnancy'],
    pelvic_floor: ['pregnancy', 'post_pregnancy']
};

/**
 * Intensity cap by condition
 * 'gentle' = intensity 0, 'moderate' = intensity 1, 'intense' = no cap
 */
export const INTENSITY_CAPS = {
    gentle: ['heart_disease', 'cancer_active', 'copd', 'post_surgery', 'mobility_limited'],
    moderate: ['hypertension', 'diabetes_type1', 'cancer_remission', 'osteoporosis',
        'arthritis', 'kidney_disease', 'liver_disease', 'autoimmune', 'pregnancy']
};

/**
 * Check if a task should be excluded based on health profile
 */
export function shouldExcludeTask(task, healthProfile) {
    if (!healthProfile) return false;

    const conditions = healthProfile.chronic_conditions || [];
    const injuries = healthProfile.injuries_limitations || [];
    const isSmoker = healthProfile.is_smoker || healthProfile.smoking_frequency === 'daily';
    const alcoholDaily = healthProfile.alcohol_frequency === 'daily';

    // Get all applicable conditions including flags
    const allConditions = [
        ...conditions,
        ...injuries,
        ...(isSmoker ? ['is_smoker'] : []),
        ...(alcoholDaily ? ['alcohol_daily'] : [])
    ];

    // Check task tags against avoidance rules
    const taskTags = task.tags || [];
    const taskId = task.id?.toLowerCase() || '';

    for (const [tagToAvoid, conditionsThatAvoid] of Object.entries(TAG_AVOIDANCE_RULES)) {
        // Check if task has this tag
        const hasTag = taskTags.some(t => t.toLowerCase().includes(tagToAvoid)) ||
            taskId.includes(tagToAvoid);

        if (hasTag) {
            // Check if user has any condition that should avoid this tag
            const shouldAvoid = conditionsThatAvoid.some(cond => allConditions.includes(cond));
            if (shouldAvoid) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Calculate preference boost for a task based on health profile
 * Returns a bonus score (0-0.3) for preferred activities
 */
export function healthPreferenceBoost(task, healthProfile) {
    if (!healthProfile) return 0;

    const conditions = healthProfile.chronic_conditions || [];
    const injuries = healthProfile.injuries_limitations || [];
    const mentalHealth = healthProfile.mental_health_flags || [];
    const isSmoker = healthProfile.is_smoker;
    const alcoholDaily = healthProfile.alcohol_frequency === 'daily';
    const stressHigh = (healthProfile.stress_level || 5) >= 7;

    const allConditions = [
        ...conditions,
        ...injuries,
        ...mentalHealth,
        ...(isSmoker ? ['is_smoker'] : []),
        ...(alcoholDaily ? ['alcohol_daily'] : []),
        ...(stressHigh ? ['stress_high'] : [])
    ];

    const taskTags = task.tags || [];
    let boost = 0;

    for (const [preferredTag, conditionsThatPrefer] of Object.entries(TAG_PREFERENCE_RULES)) {
        const hasTag = taskTags.some(t => t.toLowerCase().includes(preferredTag));

        if (hasTag) {
            const matchCount = conditionsThatPrefer.filter(cond => allConditions.includes(cond)).length;
            boost += matchCount * 0.05; // 5% boost per matching condition
        }
    }

    return Math.min(boost, 0.30); // Cap at 30% boost
}

/**
 * Calculate strict intensity cap based on health profile
 * Returns maximum allowed intensity (0, 1, 2) or null for no cap
 */
export function calculateIntensityCap(healthProfile) {
    if (!healthProfile) return null;

    const conditions = [
        ...(healthProfile.chronic_conditions || []),
        ...(healthProfile.injuries_limitations || [])
    ];

    // Check for gentle cap first (most restrictive)
    for (const cond of conditions) {
        if (INTENSITY_CAPS.gentle.includes(cond)) {
            return 0; // Gentle only
        }
    }

    // Check for moderate cap
    for (const cond of conditions) {
        if (INTENSITY_CAPS.moderate.includes(cond)) {
            return 1; // Moderate maximum
        }
    }

    return null; // No restriction
}

/**
 * Filter tasks based on health profile
 * This is the main function to use in planBuilder
 */
export function filterTasksByHealth(tasks, healthProfile) {
    if (!healthProfile) return tasks;

    const intensityCap = calculateIntensityCap(healthProfile);

    return tasks.filter(task => {
        // Exclude tasks based on conditions
        if (shouldExcludeTask(task, healthProfile)) {
            return false;
        }

        // Apply intensity cap
        if (intensityCap !== null && task.intensity > intensityCap) {
            return false;
        }

        return true;
    });
}

/**
 * Generate health-aware warnings for the plan
 */
export function generateHealthWarnings(healthProfile) {
    const warnings = [];

    if (!healthProfile) return warnings;

    const conditions = healthProfile.chronic_conditions || [];
    const injuries = healthProfile.injuries_limitations || [];

    // Condition-specific warnings
    for (const condition of conditions) {
        const config = CHRONIC_CONDITIONS[condition];
        if (config?.planImpact?.warnings) {
            warnings.push(...config.planImpact.warnings);
        }
    }

    // General health warnings
    if (conditions.length >= 3) {
        warnings.push('Bei mehreren Erkrankungen: Regelmäßige ärztliche Kontrolle empfohlen');
    }

    if (healthProfile.takes_medications) {
        warnings.push('Medikamente können Training beeinflussen - ggf. Arzt fragen');
    }

    if (injuries.includes('pregnancy')) {
        warnings.push('Schwangerschaft: Nur nach Freigabe durch Arzt/Hebamme trainieren');
    }

    // Deduplicate
    return [...new Set(warnings)];
}

/**
 * Create a health summary for plan display
 */
export function createHealthSummary(healthProfile) {
    if (!healthProfile) return null;

    const conditions = healthProfile.chronic_conditions || [];
    const injuries = healthProfile.injuries_limitations || [];
    const intensityCap = calculateIntensityCap(healthProfile);

    if (conditions.length === 0 && injuries.length === 0) {
        return null;
    }

    const intensityLabel = {
        0: 'Sanft',
        1: 'Moderat',
        null: 'Normal'
    }[intensityCap] || 'Normal';

    return {
        conditionCount: conditions.length,
        injuryCount: injuries.length,
        intensityLevel: intensityLabel,
        hasRestrictions: intensityCap !== null || conditions.length > 0 || injuries.length > 0,
        warnings: generateHealthWarnings(healthProfile)
    };
}

export default {
    shouldExcludeTask,
    healthPreferenceBoost,
    calculateIntensityCap,
    filterTasksByHealth,
    generateHealthWarnings,
    createHealthSummary,
    TAG_AVOIDANCE_RULES,
    TAG_PREFERENCE_RULES,
    INTENSITY_CAPS
};
