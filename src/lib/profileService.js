/**
 * Profile Service
 * 
 * Manages user profiles and health profiles separately.
 * - User Profile: Identity data (name, contact, preferences)
 * - Health Profile: Plan-relevant health data (lifestyle, conditions)
 */

import { supabase } from './supabase';

// =====================================================
// CHRONIC CONDITIONS CONFIGURATION
// =====================================================

/**
 * Chronic conditions with their plan impact rules
 */
export const CHRONIC_CONDITIONS = {
    // Metabolic
    diabetes_type1: {
        label: 'Diabetes Typ 1',
        category: 'metabolic',
        planImpact: {
            avoidTags: ['fasting_extended', 'hiit_intense'],
            preferTags: ['glucose_monitoring', 'steady_cardio'],
            intensityCap: 'moderate',
            warnings: ['Blutzucker vor/nach Training überwachen']
        }
    },
    diabetes_type2: {
        label: 'Diabetes Typ 2',
        category: 'metabolic',
        planImpact: {
            avoidTags: ['high_sugar', 'sedentary'],
            preferTags: ['after_meal_walk', 'protein_focus', 'zone2'],
            intensityCap: null,
            warnings: ['Nach Mahlzeiten kurze Bewegung empfohlen']
        }
    },

    // Cardiovascular
    hypertension: {
        label: 'Bluthochdruck',
        category: 'cardiovascular',
        planImpact: {
            avoidTags: ['hiit', 'heavy_lifting', 'breath_hold'],
            preferTags: ['zone2', 'breathing', 'meditation', 'light_cardio'],
            intensityCap: 'moderate',
            warnings: ['Intensive Belastungen vermeiden', 'Regelmäßig Blutdruck messen']
        }
    },
    heart_disease: {
        label: 'Herzerkrankung',
        category: 'cardiovascular',
        planImpact: {
            avoidTags: ['hiit', 'heavy_lifting', 'cold_exposure', 'breath_hold'],
            preferTags: ['zone2', 'light_walk', 'breathing', 'gentle'],
            intensityCap: 'gentle',
            warnings: ['Nur nach ärztlicher Freigabe trainieren', 'Bei Beschwerden sofort stoppen']
        }
    },

    // Cancer
    cancer_active: {
        label: 'Krebs (aktiv in Behandlung)',
        category: 'cancer',
        planImpact: {
            avoidTags: ['hiit', 'heavy_lifting', 'fasting', 'cold_exposure'],
            preferTags: ['gentle', 'restorative', 'light_walk', 'mindfulness'],
            intensityCap: 'gentle',
            warnings: ['Nur nach ärztlicher Rücksprache', 'Auf Energielevel achten', 'Ruhetage einplanen']
        }
    },
    cancer_remission: {
        label: 'Krebs (in Remission)',
        category: 'cancer',
        planImpact: {
            avoidTags: ['extreme_fasting'],
            preferTags: ['strength_building', 'anti_inflammatory', 'immune_support'],
            intensityCap: 'moderate',
            warnings: ['Regelmäßige Checkups einhalten']
        }
    },

    // Respiratory
    asthma: {
        label: 'Asthma',
        category: 'respiratory',
        planImpact: {
            avoidTags: ['cold_exposure_intense', 'dusty_environment'],
            preferTags: ['breathing_exercises', 'warmup_extended'],
            intensityCap: null,
            warnings: ['Immer Inhalator griffbereit', 'Langsam aufwärmen']
        }
    },
    copd: {
        label: 'COPD',
        category: 'respiratory',
        planImpact: {
            avoidTags: ['hiit', 'high_altitude', 'dusty_environment'],
            preferTags: ['breathing_exercises', 'gentle', 'pulmonary_rehab'],
            intensityCap: 'gentle',
            warnings: ['Atmung beobachten', 'Bei Atemnot pausieren']
        }
    },

    // Musculoskeletal
    arthritis: {
        label: 'Arthritis',
        category: 'musculoskeletal',
        planImpact: {
            avoidTags: ['high_impact', 'jumping', 'running'],
            preferTags: ['mobility', 'low_impact', 'swimming', 'stretching'],
            intensityCap: 'moderate',
            warnings: ['Gelenke schonen', 'Morgens länger aufwärmen']
        }
    },
    osteoporosis: {
        label: 'Osteoporose',
        category: 'musculoskeletal',
        planImpact: {
            avoidTags: ['high_impact', 'jumping', 'twisting'],
            preferTags: ['strength_training', 'balance', 'weight_bearing'],
            intensityCap: 'moderate',
            warnings: ['Sturzrisiko minimieren', 'Knochen stärkende Übungen bevorzugen']
        }
    },

    // Thyroid
    thyroid_disorder: {
        label: 'Schilddrüsenerkrankung',
        category: 'endocrine',
        planImpact: {
            avoidTags: [],
            preferTags: ['energy_management', 'recovery'],
            intensityCap: null,
            warnings: ['Energielevel kann schwanken', 'Regelmäßige Werte checken']
        }
    },

    // Autoimmune
    autoimmune: {
        label: 'Autoimmunerkrankung',
        category: 'autoimmune',
        planImpact: {
            avoidTags: ['extreme_stress', 'overtraining'],
            preferTags: ['anti_inflammatory', 'rest', 'stress_reduction'],
            intensityCap: 'moderate',
            warnings: ['Auf Schübe achten', 'Ausreichend Erholung einplanen']
        }
    },

    // Kidney/Liver
    kidney_disease: {
        label: 'Nierenerkrankung',
        category: 'renal',
        planImpact: {
            avoidTags: ['high_protein_extreme', 'dehydration_risk'],
            preferTags: ['hydration', 'gentle'],
            intensityCap: 'moderate',
            warnings: ['Protein-Intake mit Arzt abstimmen', 'Ausreichend trinken']
        }
    },
    liver_disease: {
        label: 'Lebererkrankung',
        category: 'hepatic',
        planImpact: {
            avoidTags: ['alcohol', 'extreme_fasting'],
            preferTags: ['liver_support', 'gentle'],
            intensityCap: 'moderate',
            warnings: ['Alkohol meiden', 'Medikamente beachten']
        }
    },

    // Mental Health
    depression: {
        label: 'Depression',
        category: 'mental_health',
        planImpact: {
            avoidTags: ['isolating_activities'],
            preferTags: ['social', 'outdoor', 'morning_light', 'exercise'],
            intensityCap: null,
            warnings: ['Bewegung hilft nachweislich', 'Kleine Schritte zählen']
        }
    },
    anxiety: {
        label: 'Angststörung',
        category: 'mental_health',
        planImpact: {
            avoidTags: ['high_stimulant', 'extreme_challenge'],
            preferTags: ['breathing', 'grounding', 'gentle', 'nature'],
            intensityCap: null,
            warnings: ['Atemübungen priorisieren', 'Überforderung vermeiden']
        }
    }
};

/**
 * Physical injuries/limitations with their plan impact
 */
export const INJURIES_LIMITATIONS = {
    back_pain: {
        label: 'Rückenschmerzen',
        planImpact: {
            avoidTags: ['deadlift_heavy', 'running', 'jumping'],
            preferTags: ['core_stability', 'mobility', 'swimming'],
            modifyExercises: ['squats', 'rows']
        }
    },
    knee_issues: {
        label: 'Knieprobleme',
        planImpact: {
            avoidTags: ['jumping', 'running', 'deep_squats', 'lunges'],
            preferTags: ['swimming', 'cycling', 'upper_body'],
            modifyExercises: ['squats', 'stairs']
        }
    },
    shoulder_issues: {
        label: 'Schulterprobleme',
        planImpact: {
            avoidTags: ['overhead_press', 'pull_ups'],
            preferTags: ['rotator_cuff', 'mobility'],
            modifyExercises: ['push_ups', 'rows']
        }
    },
    hip_issues: {
        label: 'Hüftprobleme',
        planImpact: {
            avoidTags: ['deep_squats', 'hip_abduction'],
            preferTags: ['hip_mobility', 'swimming'],
            modifyExercises: ['squats', 'lunges']
        }
    },
    pregnancy: {
        label: 'Schwangerschaft',
        planImpact: {
            avoidTags: ['lying_on_back', 'high_impact', 'hot_yoga', 'extreme_stretching'],
            preferTags: ['prenatal', 'low_impact', 'pelvic_floor'],
            intensityCap: 'moderate'
        }
    },
    post_surgery: {
        label: 'Nach Operation',
        planImpact: {
            avoidTags: ['heavy_lifting', 'high_impact'],
            preferTags: ['gentle', 'rehab', 'progressive'],
            intensityCap: 'gentle'
        }
    },
    mobility_limited: {
        label: 'Eingeschränkte Mobilität',
        planImpact: {
            avoidTags: ['standing_required', 'running', 'jumping'],
            preferTags: ['seated_exercises', 'upper_body', 'chair_yoga'],
            intensityCap: 'moderate'
        }
    }
};

/**
 * Dietary restrictions
 */
export const DIETARY_RESTRICTIONS = {
    vegetarian: { label: 'Vegetarisch', excludeIngredients: ['meat', 'fish'] },
    vegan: { label: 'Vegan', excludeIngredients: ['meat', 'fish', 'dairy', 'eggs', 'honey'] },
    pescatarian: { label: 'Pescetarisch', excludeIngredients: ['meat'] },
    gluten_free: { label: 'Glutenfrei', excludeIngredients: ['gluten'] },
    dairy_free: { label: 'Laktosefrei', excludeIngredients: ['dairy'] },
    nut_allergy: { label: 'Nussallergie', excludeIngredients: ['nuts'] },
    shellfish_allergy: { label: 'Schalentierallergie', excludeIngredients: ['shellfish'] },
    kosher: { label: 'Koscher', special: true },
    halal: { label: 'Halal', special: true }
};

// =====================================================
// USER PROFILE FUNCTIONS
// =====================================================

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[ProfileService] Error fetching user profile:', error);
        return null;
    }

    return data;
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(userId, profileData) {
    if (!userId) throw new Error('User ID is required');

    const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
            user_id: userId,
            ...profileData,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        })
        .select()
        .single();

    if (error) {
        console.error('[ProfileService] Error upserting user profile:', error);
        throw error;
    }

    return data;
}

// =====================================================
// HEALTH PROFILE FUNCTIONS
// =====================================================

/**
 * Get health profile by user ID
 */
export async function getHealthProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('health_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[ProfileService] Error fetching health profile:', error);
        return null;
    }

    return data;
}

/**
 * Create or update health profile
 */
export async function upsertHealthProfile(userId, healthData) {
    if (!userId) throw new Error('User ID is required');

    // Determine completeness
    const coreCompleted = !!(
        healthData.sleep_hours_bucket &&
        healthData.stress_level &&
        healthData.training_frequency
    );

    const extendedCompleted = !!(
        healthData.chronic_conditions?.length > 0 ||
        healthData.injuries_limitations?.length > 0 ||
        healthData.dietary_restrictions?.length > 0 ||
        healthData.is_smoker !== undefined ||
        healthData.alcohol_frequency
    );

    const { data, error } = await supabase
        .from('health_profiles')
        .upsert({
            user_id: userId,
            ...healthData,
            core_completed: coreCompleted,
            extended_completed: extendedCompleted,
            extended_completed_at: extendedCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        })
        .select()
        .single();

    if (error) {
        console.error('[ProfileService] Error upserting health profile:', error);
        throw error;
    }

    return data;
}

/**
 * Update only core health data (quick intake)
 */
export async function updateCoreHealthProfile(userId, coreData) {
    const {
        height_cm,
        weight_kg,
        sleep_hours_bucket,
        stress_level,
        training_frequency,
        diet_patterns,
        daily_time_budget,
        equipment_access
    } = coreData;

    return upsertHealthProfile(userId, {
        height_cm,
        weight_kg,
        sleep_hours_bucket,
        stress_level,
        training_frequency,
        diet_patterns,
        daily_time_budget,
        equipment_access
    });
}

/**
 * Update extended health data (deep profile)
 */
export async function updateExtendedHealthProfile(userId, extendedData) {
    const existingProfile = await getHealthProfile(userId);

    return upsertHealthProfile(userId, {
        ...existingProfile,
        ...extendedData,
        extended_completed: true,
        extended_completed_at: new Date().toISOString()
    });
}

// =====================================================
// PLAN SNAPSHOT FUNCTIONS
// =====================================================

/**
 * Create a plan snapshot when generating a plan
 */
export async function createPlanSnapshot(planId, userId, healthProfile, primaryGoal, constraints = {}) {
    if (!planId || !userId || !healthProfile) {
        console.error('[ProfileService] Plan ID, user ID, and health profile are required');
        return null;
    }

    const { data, error } = await supabase
        .from('plan_snapshots')
        .insert({
            plan_id: planId,
            user_id: userId,
            health_profile_snapshot: healthProfile,
            primary_goal: primaryGoal,
            secondary_goals: constraints.secondaryGoals || [],
            excluded_activities: constraints.excludedActivities || [],
            intensity_cap: constraints.intensityCap || null,
            generation_notes: constraints.notes || null
        })
        .select()
        .single();

    if (error) {
        console.error('[ProfileService] Error creating plan snapshot:', error);
        return null;
    }

    return data;
}

/**
 * Get plan snapshot by plan ID
 */
export async function getPlanSnapshot(planId) {
    const { data, error } = await supabase
        .from('plan_snapshots')
        .select('*')
        .eq('plan_id', planId)
        .single();

    if (error) {
        console.error('[ProfileService] Error fetching plan snapshot:', error);
        return null;
    }

    return data;
}

// =====================================================
// PLAN IMPACT CALCULATION
// =====================================================

/**
 * Calculate plan constraints based on health profile
 * This is used by the plan generator to adjust recommendations
 */
export function calculatePlanConstraints(healthProfile) {
    if (!healthProfile) {
        return {
            avoidTags: [],
            preferTags: [],
            intensityCap: null,
            warnings: [],
            excludedActivities: []
        };
    }

    const constraints = {
        avoidTags: new Set(),
        preferTags: new Set(),
        intensityCap: null,
        warnings: [],
        excludedActivities: []
    };

    // Process chronic conditions
    const conditions = healthProfile.chronic_conditions || [];
    for (const condition of conditions) {
        const conditionConfig = CHRONIC_CONDITIONS[condition];
        if (conditionConfig?.planImpact) {
            const impact = conditionConfig.planImpact;

            // Collect avoid tags
            impact.avoidTags?.forEach(tag => constraints.avoidTags.add(tag));

            // Collect prefer tags
            impact.preferTags?.forEach(tag => constraints.preferTags.add(tag));

            // Determine strictest intensity cap
            if (impact.intensityCap) {
                const caps = ['gentle', 'moderate', 'intense'];
                const currentCapIndex = constraints.intensityCap ? caps.indexOf(constraints.intensityCap) : 2;
                const newCapIndex = caps.indexOf(impact.intensityCap);
                if (newCapIndex < currentCapIndex) {
                    constraints.intensityCap = impact.intensityCap;
                }
            }

            // Collect warnings
            impact.warnings?.forEach(warning => constraints.warnings.push(warning));
        }
    }

    // Process injuries/limitations
    const injuries = healthProfile.injuries_limitations || [];
    for (const injury of injuries) {
        const injuryConfig = INJURIES_LIMITATIONS[injury];
        if (injuryConfig?.planImpact) {
            const impact = injuryConfig.planImpact;
            impact.avoidTags?.forEach(tag => constraints.avoidTags.add(tag));
            impact.preferTags?.forEach(tag => constraints.preferTags.add(tag));

            if (impact.intensityCap) {
                const caps = ['gentle', 'moderate', 'intense'];
                const currentCapIndex = constraints.intensityCap ? caps.indexOf(constraints.intensityCap) : 2;
                const newCapIndex = caps.indexOf(impact.intensityCap);
                if (newCapIndex < currentCapIndex) {
                    constraints.intensityCap = impact.intensityCap;
                }
            }
        }
    }

    // Smoking impact
    if (healthProfile.is_smoker || healthProfile.smoking_frequency === 'daily') {
        constraints.avoidTags.add('hiit_intense');
        constraints.preferTags.add('breathing_exercises');
        constraints.preferTags.add('cardio_building');
        constraints.warnings.push('Rauchen reduziert Ausdauer - langsam steigern');
    }

    // Alcohol impact
    if (healthProfile.alcohol_frequency === 'daily') {
        constraints.preferTags.add('liver_support');
        constraints.preferTags.add('hydration');
        constraints.warnings.push('Alkohol beeinträchtigt Schlaf und Erholung');
    }

    // Age-based adjustments (if birth_date available)
    // This would be calculated from birth_date in a real implementation

    return {
        avoidTags: Array.from(constraints.avoidTags),
        preferTags: Array.from(constraints.preferTags),
        intensityCap: constraints.intensityCap,
        warnings: [...new Set(constraints.warnings)],
        excludedActivities: constraints.excludedActivities
    };
}

/**
 * Generate a user-friendly summary of health constraints
 */
export function generateConstraintsSummary(constraints) {
    if (!constraints.warnings.length && !constraints.intensityCap && !constraints.avoidTags.length) {
        return null;
    }

    const summary = {
        hasRestrictions: true,
        intensityNote: null,
        warningCount: constraints.warnings.length,
        topWarnings: constraints.warnings.slice(0, 3),
        restrictedActivities: constraints.avoidTags.slice(0, 5).map(tag => {
            // Convert tag to human-readable
            return tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        })
    };

    if (constraints.intensityCap === 'gentle') {
        summary.intensityNote = 'Dein Plan fokussiert auf sanfte, schonende Aktivitäten.';
    } else if (constraints.intensityCap === 'moderate') {
        summary.intensityNote = 'Dein Plan vermeidet hochintensive Belastungen.';
    }

    return summary;
}

// =====================================================
// MIGRATION HELPERS
// =====================================================

/**
 * Migrate existing intake data to new profile structure
 * Call this once during migration
 */
export async function migrateIntakeToProfiles(userId, intakeData) {
    if (!userId || !intakeData) return null;

    // Extract user profile data
    const userProfileData = {
        name: intakeData.name,
        phone_number: intakeData.phone_number,
        biological_sex: intakeData.sex,
        whatsapp_opt_in: intakeData.whatsapp_consent
    };

    // Extract health profile data
    const healthProfileData = {
        height_cm: intakeData.height_cm,
        weight_kg: intakeData.weight_kg,
        sleep_hours_bucket: intakeData.sleep_hours_bucket,
        stress_level: intakeData.stress_1_10,
        training_frequency: intakeData.training_frequency,
        diet_patterns: intakeData.diet_pattern,
        daily_time_budget: parseInt(intakeData.daily_time_budget) || 20,
        equipment_access: intakeData.equipment_access || 'none'
    };

    try {
        const userProfile = await upsertUserProfile(userId, userProfileData);
        const healthProfile = await upsertHealthProfile(userId, healthProfileData);

        return { userProfile, healthProfile };
    } catch (error) {
        console.error('[ProfileService] Migration error:', error);
        return null;
    }
}

export default {
    // User Profile
    getUserProfile,
    upsertUserProfile,

    // Health Profile
    getHealthProfile,
    upsertHealthProfile,
    updateCoreHealthProfile,
    updateExtendedHealthProfile,

    // Plan Snapshots
    createPlanSnapshot,
    getPlanSnapshot,

    // Constraints
    calculatePlanConstraints,
    generateConstraintsSummary,

    // Migration
    migrateIntakeToProfiles,

    // Constants
    CHRONIC_CONDITIONS,
    INJURIES_LIMITATIONS,
    DIETARY_RESTRICTIONS
};
