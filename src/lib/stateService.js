/**
 * State Service
 *
 * Frontend service for managing user dynamic state (RAG Decision Engine).
 * Provides an interface to the state-api Edge Function.
 *
 * Author: RAG Implementation Phase 1
 * Date: 2026-02-08
 */

import { supabase } from './supabase.js';
import { logger } from './logger.js';

// =====================================================
// STATE API CLIENT
// =====================================================

/**
 * Call the state-api Edge Function
 */
async function callStateAPI(payload) {
    try {
        const { data, error } = await supabase.functions.invoke('state-api', {
            body: payload
        });

        if (error) {
            logger.error('[StateService] Edge Function Error:', error);
            throw new Error(`State API Error: ${error.message}`);
        }

        if (!data.success) {
            logger.error('[StateService] API returned error:', data.error);
            throw new Error(data.error);
        }

        return data;

    } catch (err) {
        logger.error('[StateService] Network or parsing error:', err);
        throw err;
    }
}

// =====================================================
// PUBLIC API
// =====================================================

/**
 * Get current user state
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Current user state
 */
export async function getCurrentState(userId) {
    logger.info(`[StateService] Fetching state for user: ${userId}`);

    const response = await callStateAPI({
        action: 'get_state',
        user_id: userId
    });

    return response.data;
}

/**
 * Update a single state field
 *
 * @param {string} userId - User ID
 * @param {string} field - Field name (e.g., 'sleep_debt', 'stress_load')
 * @param {string|number} newValue - New value
 * @param {string} source - Data source (e.g., 'biosync_hrv', 'self_report')
 * @param {Object} [context] - Optional context data
 * @returns {Promise<Object>} Updated state + event metadata
 */
export async function updateStateField(userId, field, newValue, source, context = {}) {
    logger.info(`[StateService] Updating ${field} for user ${userId}:`, { newValue, source });

    const response = await callStateAPI({
        action: 'update_field',
        user_id: userId,
        field,
        new_value: newValue,
        source,
        context
    });

    if (response.triggered_reevaluation) {
        logger.info(`[StateService] ⚡ Material change detected! Field: ${field}`, {
            previous: response.previous_value,
            new: response.new_value
        });
    }

    return response;
}

/**
 * Update multiple state fields atomically
 *
 * @param {string} userId - User ID
 * @param {Array<Object>} updates - Array of {field, new_value, source, context?}
 * @returns {Promise<Object>} Update results
 */
export async function updateMultipleFields(userId, updates) {
    logger.info(`[StateService] Updating ${updates.length} fields for user ${userId}`);

    const response = await callStateAPI({
        action: 'update_multiple',
        user_id: userId,
        updates
    });

    if (response.triggered_reevaluation) {
        logger.info(`[StateService] ⚡ Material change detected in batch update!`);
    }

    return response;
}

/**
 * Get state change history
 *
 * @param {string} userId - User ID
 * @param {string} [field] - Optional: filter by specific field
 * @param {number} [limit=100] - Max number of events to return
 * @returns {Promise<Array>} Array of state events
 */
export async function getStateHistory(userId, field = null, limit = 100) {
    logger.info(`[StateService] Fetching history for user ${userId}`, { field, limit });

    const response = await callStateAPI({
        action: 'get_history',
        user_id: userId,
        field,
        limit
    });

    return response.data;
}

/**
 * Check calibration status (30-day baseline period)
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Calibration status
 */
export async function checkCalibrationStatus(userId) {
    logger.info(`[StateService] Checking calibration status for user ${userId}`);

    const response = await callStateAPI({
        action: 'check_calibration',
        user_id: userId
    });

    return response;
}

// =====================================================
// CONVENIENCE METHODS (Field-Specific)
// =====================================================

/**
 * Update sleep debt category
 */
export async function updateSleepDebt(userId, sleepDebt, source = 'biosync_sleep', context = {}) {
    const validValues = ['none', 'mild', 'moderate', 'severe'];
    if (!validValues.includes(sleepDebt)) {
        throw new Error(`Invalid sleep_debt value. Must be one of: ${validValues.join(', ')}`);
    }

    return updateStateField(userId, 'sleep_debt', sleepDebt, source, context);
}

/**
 * Update stress load category
 */
export async function updateStressLoad(userId, stressLoad, source = 'biosync_hrv', context = {}) {
    const validValues = ['baseline', 'elevated', 'high', 'burnout_risk'];
    if (!validValues.includes(stressLoad)) {
        throw new Error(`Invalid stress_load value. Must be one of: ${validValues.join(', ')}`);
    }

    return updateStateField(userId, 'stress_load', stressLoad, source, context);
}

/**
 * Update recovery state category
 */
export async function updateRecoveryState(userId, recoveryState, source = 'system_derived', context = {}) {
    const validValues = ['optimal', 'moderate', 'low'];
    if (!validValues.includes(recoveryState)) {
        throw new Error(`Invalid recovery_state value. Must be one of: ${validValues.join(', ')}`);
    }

    return updateStateField(userId, 'recovery_state', recoveryState, source, context);
}

/**
 * Update training load category
 */
export async function updateTrainingLoad(userId, trainingLoad, source = 'system_derived', context = {}) {
    const validValues = ['deload', 'maintenance', 'building', 'overreaching'];
    if (!validValues.includes(trainingLoad)) {
        throw new Error(`Invalid training_load value. Must be one of: ${validValues.join(', ')}`);
    }

    return updateStateField(userId, 'training_load', trainingLoad, source, context);
}

/**
 * Update HRV metrics (batch update)
 */
export async function updateHRVMetrics(userId, hrv) {
    const updates = [];

    if (hrv.rmssd_current !== undefined) {
        updates.push({
            field: 'hrv_rmssd_current',
            new_value: hrv.rmssd_current,
            source: 'biosync_hrv'
        });
    }

    if (hrv.avg_7day !== undefined) {
        updates.push({
            field: 'hrv_7day_avg',
            new_value: hrv.avg_7day,
            source: 'biosync_hrv'
        });
    }

    if (hrv.baseline_30day !== undefined) {
        updates.push({
            field: 'hrv_30day_baseline',
            new_value: hrv.baseline_30day,
            source: 'biosync_hrv'
        });
    }

    if (hrv.rhr_current !== undefined) {
        updates.push({
            field: 'rhr_current',
            new_value: hrv.rhr_current,
            source: 'biosync_hrv'
        });
    }

    if (updates.length === 0) {
        throw new Error('No HRV metrics provided');
    }

    return updateMultipleFields(userId, updates);
}

/**
 * Add an active constraint (travel, injury, illness, etc.)
 */
export async function addActiveConstraint(userId, constraint) {
    // Validate constraint structure
    if (!constraint.type) {
        throw new Error('Constraint must have a "type" field');
    }

    const state = await getCurrentState(userId);
    const currentConstraints = state.active_constraints || [];

    // Add new constraint
    const updatedConstraints = [...currentConstraints, {
        ...constraint,
        added_at: new Date().toISOString()
    }];

    return updateStateField(
        userId,
        'active_constraints',
        JSON.stringify(updatedConstraints),
        'manual_override',
        { constraint_added: constraint }
    );
}

/**
 * Remove an active constraint by index
 */
export async function removeActiveConstraint(userId, constraintIndex) {
    const state = await getCurrentState(userId);
    const currentConstraints = state.active_constraints || [];

    if (constraintIndex < 0 || constraintIndex >= currentConstraints.length) {
        throw new Error('Invalid constraint index');
    }

    const updatedConstraints = currentConstraints.filter((_, idx) => idx !== constraintIndex);

    return updateStateField(
        userId,
        'active_constraints',
        JSON.stringify(updatedConstraints),
        'manual_override',
        { constraint_removed_index: constraintIndex }
    );
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to user state changes
 *
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function(newState)
 * @returns {Object} Subscription object with unsubscribe()
 */
export function subscribeToState(userId, callback) {
    logger.info(`[StateService] Subscribing to state changes for user: ${userId}`);

    const subscription = supabase
        .channel(`user_states:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'user_states',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                logger.info('[StateService] State changed:', payload);
                callback(payload.new);
            }
        )
        .subscribe();

    return {
        unsubscribe: () => {
            logger.info(`[StateService] Unsubscribing from state changes for user: ${userId}`);
            subscription.unsubscribe();
        }
    };
}

/**
 * Subscribe to state events (audit log)
 *
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function(event)
 * @returns {Object} Subscription object with unsubscribe()
 */
export function subscribeToStateEvents(userId, callback) {
    logger.info(`[StateService] Subscribing to state events for user: ${userId}`);

    const subscription = supabase
        .channel(`state_events:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'state_events',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                logger.info('[StateService] New state event:', payload);
                callback(payload.new);
            }
        )
        .subscribe();

    return {
        unsubscribe: () => {
            logger.info(`[StateService] Unsubscribing from state events for user: ${userId}`);
            subscription.unsubscribe();
        }
    };
}

// =====================================================
// INITIALIZATION HELPER
// =====================================================

/**
 * Initialize user state (idempotent)
 * Called automatically by Edge Function, but can be called explicitly
 *
 * @param {string} userId - User ID
 */
export async function initializeUserState(userId) {
    logger.info(`[StateService] Initializing state for user: ${userId}`);

    try {
        // The Edge Function's get_state action will auto-initialize if needed
        const state = await getCurrentState(userId);
        logger.info('[StateService] State initialized or already exists:', state);
        return state;
    } catch (err) {
        logger.error('[StateService] Failed to initialize state:', err);
        throw err;
    }
}

// =====================================================
// EXPORT ALL
// =====================================================

export default {
    // Core API
    getCurrentState,
    updateStateField,
    updateMultipleFields,
    getStateHistory,
    checkCalibrationStatus,

    // Convenience methods
    updateSleepDebt,
    updateStressLoad,
    updateRecoveryState,
    updateTrainingLoad,
    updateHRVMetrics,
    addActiveConstraint,
    removeActiveConstraint,

    // Real-time
    subscribeToState,
    subscribeToStateEvents,

    // Initialization
    initializeUserState
};
