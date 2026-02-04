/**
 * Data Service
 * 
 * Unified data access layer that automatically chooses between:
 * - Supabase (when authenticated)
 * - localStorage (when not authenticated or Supabase unavailable)
 */

import {
    supabase,
    saveIntakeToSupabase,
    getIntakeFromSupabase,
    savePlanToSupabase,
    getActivePlanFromSupabase,
    getProgressFromSupabase,
    updateProgressInSupabase,
    getCurrentUser,
    getArchivedPlansFromSupabase,

} from './supabase';
import { logger } from './logger';
import { encryptData, decryptData, migrateToEncrypted } from './encryptionService';

// ============================================
// Data Source Detection
// ============================================

/**
 * Get the current authenticated user ID
 */
async function getUserId() {
    if (!supabase) return null;
    const { user } = await getCurrentUser();
    return user?.id || null;
}

/**
 * Check if we should use Supabase for data storage
 */
export async function shouldUseSupabase() {
    if (!supabase) return false;
    const userId = await getUserId();
    return !!userId;
}

// ============================================
// Intake Data
// ============================================

/**
 * Save intake data
 * Automatically saves to Supabase if authenticated, localStorage as fallback
 */
export async function saveIntake(intakeData) {
    const userId = await getUserId();

    // Always save to localStorage for offline access
    const dataWithTimestamp = {
        ...intakeData,
        submitted_at: intakeData.submitted_at || new Date().toISOString(),
    };

    // Encrypt before storing
    const encrypted = await encryptData(dataWithTimestamp, userId);
    localStorage.setItem('intake_data', encrypted);
    logger.debug('[DataService] Intake saved to localStorage (encrypted)');

    // Also save to Supabase if authenticated
    if (userId) {
        try {
            const savedIntake = await saveIntakeToSupabase(dataWithTimestamp, userId);
            logger.info('[DataService] Intake saved to Supabase');

            // Sync ID back to localStorage
            if (savedIntake?.id) {
                const updatedData = { ...dataWithTimestamp, id: savedIntake.id };
                const encryptedUpdated = await encryptData(updatedData, userId);
                localStorage.setItem('intake_data', encryptedUpdated);
                return updatedData;
            }
        } catch (error) {
            logger.error('[DataService] Failed to save intake to Supabase:', error);
            // Continue with localStorage only
        }
    }

    return dataWithTimestamp;
}

/**
 * Get intake data
 * Prioritizes Supabase if authenticated, falls back to localStorage
 */
export async function getIntake() {
    const userId = await getUserId();

    // Try Supabase first if authenticated
    if (userId) {
        try {
            const supabaseData = await getIntakeFromSupabase(userId);
            if (supabaseData) {
                logger.debug('[DataService] Intake loaded from Supabase');
                // Sync to localStorage (encrypted)
                const encrypted = await encryptData(supabaseData, userId);
                localStorage.setItem('intake_data', encrypted);
                return supabaseData;
            }
        } catch (error) {
            logger.error('[DataService] Failed to get intake from Supabase:', error);
        }
    }

    // Fall back to localStorage
    const localData = localStorage.getItem('intake_data');
    if (localData) {
        try {
            // Attempt to decrypt
            const decrypted = await decryptData(localData, userId);
            if (decrypted) {
                logger.debug('[DataService] Intake loaded from localStorage (decrypted)');

                // If data was migrated from unencrypted, re-save as encrypted
                if (userId) {
                    await migrateToEncrypted('intake_data', userId);
                }

                return decrypted;
            }
        } catch (error) {
            logger.error('[DataService] Failed to decrypt intake data:', error);
            // Clear corrupted data
            localStorage.removeItem('intake_data');
            return null;
        }
    }

    return null;
}

// ============================================
// Plan Data
// ============================================

/**
 * Save generated plan
 * Automatically saves to Supabase if authenticated, localStorage as fallback
 */
export async function savePlan(plan) {
    const userId = await getUserId();

    // Always save to localStorage (encrypted)
    const encrypted = await encryptData(plan, userId);
    localStorage.setItem('generated_plan', encrypted);
    logger.debug('[DataService] Plan saved to localStorage (encrypted)');

    // Also save to Supabase if authenticated
    if (userId) {
        try {
            // Attempt to get intake ID to link
            const intakeData = await getIntake();
            const intakeId = intakeData?.id || null;

            const savedPlan = await savePlanToSupabase(plan, userId, intakeId);
            // Add Supabase plan ID to local storage
            const planWithId = { ...plan, supabase_plan_id: savedPlan.id };
            const encryptedWithId = await encryptData(planWithId, userId);
            localStorage.setItem('generated_plan', encryptedWithId);
            logger.info('[DataService] Plan saved to Supabase:', savedPlan.id);
            return planWithId;
        } catch (error) {
            logger.error('[DataService] Failed to save plan to Supabase:', error);
        }
    }

    return plan;
}

/**
 * Get the active plan
 * Prioritizes Supabase if authenticated, falls back to localStorage
 */
export async function getPlan() {
    const userId = await getUserId();
    let supabasePlan = null;

    // Try Supabase first if authenticated
    if (userId) {
        try {
            supabasePlan = await getActivePlanFromSupabase(userId);
            supabasePlan = await getActivePlanFromSupabase(userId);
            if (supabasePlan) {
                logger.debug('[DataService] Plan loaded from Supabase');
            }
        } catch (error) {
            logger.error('[DataService] Failed to get plan from Supabase:', error);
        }
    }

    // Get local plan (decrypt)
    const localPlanJson = localStorage.getItem('generated_plan');
    let localPlan = null;
    if (localPlanJson) {
        try {
            localPlan = await decryptData(localPlanJson, userId);
            if (localPlan) {
                logger.debug('[DataService] Plan loaded from localStorage (decrypted)');
                // Migrate if needed
                if (userId) {
                    await migrateToEncrypted('generated_plan', userId);
                }
            }
        } catch (error) {
            logger.error('[DataService] Failed to decrypt plan:', error);
            localStorage.removeItem('generated_plan');
        }
    }

    // Conflict Resolution:
    // If we have both, check which is newer based on the INTAKE submission time.
    // This handles the case where GeneratingPage saved to local but failed Supabase save.
    if (supabasePlan && localPlan) {
        // Check for submitted_at in either meta.input or meta.inputs
        const getSubmittedTime = (p) => {
            const dateStr = p.meta?.input?.submitted_at || p.meta?.inputs?.submitted_at || p.generated_at || p.created_at || '1970-01-01';
            return new Date(dateStr).getTime();
        };

        const supabaseTime = getSubmittedTime(supabasePlan);
        const localTime = getSubmittedTime(localPlan);

        // If local plan is newer (at all), prefer local
        // This allows the Dashboard to see the "unsynced" new plan and sync it.
        if (localTime > supabaseTime) {
            logger.warn('[DataService] Local plan is newer than Supabase active plan. Using local.');
            return localPlan;
        }

        // Otherwise, trust Supabase as the source of truth (encrypt and save)
        const encrypted = await encryptData(supabasePlan, userId);
        localStorage.setItem('generated_plan', encrypted);
        return supabasePlan;
    }

    return supabasePlan || localPlan;
}

/**
 * Check if a cached plan exists and matches the intake data
 */
export async function getCachedPlan(intakeData) {
    const plan = await getPlan();

    if (plan && plan.meta?.input?.submitted_at === intakeData.submitted_at) {
        logger.debug('[DataService] Using cached plan (intake matches)');
        return plan;
    }

    logger.debug('[DataService] No cached plan or intake changed');
    return null;
}

// ============================================
// Archived Plans
// ============================================

/**
 * Get archived plans
 */
export async function getArchivedPlans() {
    const userId = await getUserId();
    if (userId) {
        return getArchivedPlansFromSupabase(userId);
    }
    return [];
}

// ============================================
// Progress Data
// ============================================

/**
 * Get progress for a plan
 */
export async function getProgress(supabasePlanId = null) {
    const userId = await getUserId();

    // Try Supabase first if we have a plan ID and are authenticated
    if (userId && supabasePlanId) {
        try {
            const supabaseProgress = await getProgressFromSupabase(supabasePlanId);
            if (Object.keys(supabaseProgress).length > 0) {
                logger.debug('[DataService] Progress loaded from Supabase');
                // Sync to localStorage
                localStorage.setItem('plan_progress', JSON.stringify(supabaseProgress));
                return supabaseProgress;
            }
        } catch (error) {
            console.error('[DataService] Failed to get progress from Supabase:', error);
        }
    }

    // Fall back to localStorage (decrypt)
    const localProgress = localStorage.getItem('plan_progress');
    if (localProgress) {
        try {
            const decrypted = await decryptData(localProgress, userId);
            if (decrypted) {
                logger.debug('[DataService] Progress loaded from localStorage (decrypted)');
                // Migrate if needed
                if (userId) {
                    await migrateToEncrypted('plan_progress', userId);
                }
                return decrypted;
            }
        } catch (error) {
            logger.error('[DataService] Failed to decrypt progress:', error);
            localStorage.removeItem('plan_progress');
        }
    }

    return {};
}

/**
 * Update task progress
 */
export async function updateProgress(day, taskId, completed, totalTasks, supabasePlanId = null) {
    const userId = await getUserId();

    // Update localStorage (decrypt, modify, encrypt)
    const localProgressStr = localStorage.getItem('plan_progress');
    let localProgress = {};
    if (localProgressStr) {
        try {
            localProgress = await decryptData(localProgressStr, userId) || {};
        } catch (error) {
            logger.warn('[DataService] Could not decrypt progress, starting fresh');
        }
    }
    const dayProgress = localProgress[day] || {};
    dayProgress[taskId] = completed;
    localProgress[day] = dayProgress;
    const encrypted = await encryptData(localProgress, userId);
    localStorage.setItem('plan_progress', encrypted);
    logger.debug('[DataService] Progress saved to localStorage (encrypted)');

    // Also update Supabase if authenticated
    if (userId && supabasePlanId) {
        try {
            await updateProgressInSupabase(supabasePlanId, userId, day, taskId, completed, totalTasks);
            logger.debug('[DataService] Progress saved to Supabase');
        } catch (error) {
            logger.error('[DataService] Failed to save progress to Supabase:', error);
        }
    }

    return localProgress;
}

// ============================================
// Clear Data
// ============================================

/**
 * Clear all local data (used on sign out)
 */
export function clearLocalData() {
    localStorage.removeItem('intake_data');
    localStorage.removeItem('generated_plan');
    localStorage.removeItem('plan_progress');
    logger.info('[DataService] Local data cleared');
}

/**
 * Get storage info for debugging
 */
export async function getStorageInfo() {
    const userId = await getUserId();
    const hasLocalIntake = !!localStorage.getItem('intake_data');
    const hasLocalPlan = !!localStorage.getItem('generated_plan');
    const hasLocalProgress = !!localStorage.getItem('plan_progress');

    return {
        mode: userId ? 'supabase' : 'localStorage',
        userId,
        hasLocalIntake,
        hasLocalPlan,
        hasLocalProgress,
    };
}
