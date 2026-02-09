/**
 * State API Edge Function
 *
 * Handles all user state operations for RAG Decision Engine:
 * - get_state: Retrieve current user state
 * - update_field: Update a single state field with event logging
 * - update_multiple: Update multiple fields atomically
 * - get_history: Retrieve state event history
 * - check_material_change: Determine if state change warrants new decision
 *
 * Author: RAG Implementation Phase 1
 * Date: 2026-02-08
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// INTERFACES
// =====================================================

interface StateFieldUpdate {
    field: string;
    new_value: string | number;
    source: string;
    context?: Record<string, any>;
}

interface UserState {
    id: string;
    user_id: string;
    sleep_debt?: string;
    stress_load?: string;
    recovery_state?: string;
    training_load?: string;
    metabolic_flexibility?: string;
    hrv_rmssd_current?: number;
    hrv_7day_avg?: number;
    hrv_30day_baseline?: number;
    active_constraints?: any[];
    calibration_completed?: boolean;
    last_material_change_at?: string;
    updated_at?: string;
}

// =====================================================
// THRESHOLD DEFINITIONS (for Material Change Detection)
// =====================================================

const MATERIAL_CHANGE_THRESHOLDS = {
    // Sleep thresholds
    sleep_7day_avg_hours: 1.0, // ±1 hour change
    sleep_efficiency_avg: 10, // ±10% change

    // HRV thresholds (percentage of baseline)
    hrv_rmssd_current: 0.15, // ±15% from 30-day baseline
    hrv_7day_avg: 0.10, // ±10% change in rolling average

    // RHR thresholds
    rhr_current: 5, // ±5 BPM from 7-day average

    // Training load thresholds
    weekly_training_volume_minutes: 0.20, // ±20% change

    // Categorical changes (always material if category changes)
    categorical_fields: [
        'sleep_debt',
        'stress_load',
        'recovery_state',
        'training_load',
        'metabolic_flexibility'
    ]
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if a state field change is material (warrants re-evaluation)
 */
function isMaterialChange(
    field: string,
    previousValue: any,
    newValue: any,
    state: UserState
): boolean {
    // Null/undefined checks
    if (previousValue === null || previousValue === undefined) return true;
    if (previousValue === newValue) return false;

    // Categorical fields: any change is material
    if (MATERIAL_CHANGE_THRESHOLDS.categorical_fields.includes(field)) {
        return previousValue !== newValue;
    }

    // Numeric fields: threshold-based
    const prev = parseFloat(previousValue);
    const curr = parseFloat(newValue);

    if (isNaN(prev) || isNaN(curr)) return true;

    switch (field) {
        case 'sleep_7day_avg_hours':
            return Math.abs(curr - prev) >= MATERIAL_CHANGE_THRESHOLDS.sleep_7day_avg_hours;

        case 'sleep_efficiency_avg':
            return Math.abs(curr - prev) >= MATERIAL_CHANGE_THRESHOLDS.sleep_efficiency_avg;

        case 'hrv_rmssd_current':
            if (!state.hrv_30day_baseline) return true;
            const hrvRatio = curr / state.hrv_30day_baseline;
            const prevRatio = prev / state.hrv_30day_baseline;
            return Math.abs(hrvRatio - prevRatio) >= MATERIAL_CHANGE_THRESHOLDS.hrv_rmssd_current;

        case 'hrv_7day_avg':
            const hrvChange = Math.abs((curr - prev) / prev);
            return hrvChange >= MATERIAL_CHANGE_THRESHOLDS.hrv_7day_avg;

        case 'rhr_current':
            if (!state.rhr_7day_avg) return true;
            return Math.abs(curr - prev) >= MATERIAL_CHANGE_THRESHOLDS.rhr_current;

        case 'weekly_training_volume_minutes':
            const trainingChange = Math.abs((curr - prev) / prev);
            return trainingChange >= MATERIAL_CHANGE_THRESHOLDS.weekly_training_volume_minutes;

        default:
            // For unknown fields, consider any change material (conservative approach)
            return true;
    }
}

/**
 * Initialize user state if it doesn't exist
 */
async function ensureUserStateExists(supabase: any, userId: string): Promise<void> {
    const { data: existingState } = await supabase
        .from('user_states')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (!existingState) {
        // Call the PostgreSQL function to initialize state
        await supabase.rpc('initialize_user_state', { p_user_id: userId });
    }
}

// =====================================================
// ACTION HANDLERS
// =====================================================

/**
 * GET_STATE: Retrieve current user state
 */
async function handleGetState(supabase: any, userId: string) {
    await ensureUserStateExists(supabase, userId);

    const { data, error } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) throw error;

    return { success: true, data };
}

/**
 * UPDATE_FIELD: Update a single state field with event logging
 */
async function handleUpdateField(
    supabase: any,
    userId: string,
    update: StateFieldUpdate
) {
    await ensureUserStateExists(supabase, userId);

    // Get current state
    const { data: currentState, error: fetchError } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (fetchError) throw fetchError;

    const previousValue = currentState[update.field];
    const newValue = update.new_value;

    // Check if this is a material change
    const triggeredReevaluation = isMaterialChange(
        update.field,
        previousValue,
        newValue,
        currentState
    );

    // Record state event using PostgreSQL function
    const { data: eventData, error: eventError } = await supabase.rpc('record_state_event', {
        p_user_id: userId,
        p_field: update.field,
        p_previous_value: previousValue?.toString() || null,
        p_new_value: newValue.toString(),
        p_source: update.source,
        p_triggered_reevaluation: triggeredReevaluation,
        p_context: update.context || {}
    });

    if (eventError) throw eventError;

    // Update the user_states table
    const updatePayload: any = {
        [update.field]: newValue,
        updated_at: new Date().toISOString()
    };

    if (triggeredReevaluation) {
        updatePayload.last_material_change_at = new Date().toISOString();
    }

    const { data: updatedState, error: updateError } = await supabase
        .from('user_states')
        .update(updatePayload)
        .eq('user_id', userId)
        .select()
        .single();

    if (updateError) throw updateError;

    return {
        success: true,
        data: updatedState,
        event_id: eventData,
        triggered_reevaluation: triggeredReevaluation,
        previous_value: previousValue,
        new_value: newValue
    };
}

/**
 * UPDATE_MULTIPLE: Update multiple fields atomically
 */
async function handleUpdateMultiple(
    supabase: any,
    userId: string,
    updates: StateFieldUpdate[]
) {
    await ensureUserStateExists(supabase, userId);

    const results = [];
    let anyMaterialChange = false;

    // Process each update sequentially (could be optimized with transactions)
    for (const update of updates) {
        const result = await handleUpdateField(supabase, userId, update);
        results.push(result);
        if (result.triggered_reevaluation) {
            anyMaterialChange = true;
        }
    }

    return {
        success: true,
        results,
        triggered_reevaluation: anyMaterialChange
    };
}

/**
 * GET_HISTORY: Retrieve state event history
 */
async function handleGetHistory(
    supabase: any,
    userId: string,
    field?: string,
    limit: number = 100
) {
    const { data, error } = await supabase.rpc('get_user_state_history', {
        p_user_id: userId,
        p_field: field || null,
        p_limit: limit
    });

    if (error) throw error;

    return { success: true, data };
}

/**
 * CHECK_CALIBRATION: Check if 30-day calibration period is complete
 */
async function handleCheckCalibration(supabase: any, userId: string) {
    const { data: state, error } = await supabase
        .from('user_states')
        .select('calibration_completed, calibration_start_date')
        .eq('user_id', userId)
        .single();

    if (error) throw error;

    if (!state.calibration_start_date) {
        return {
            success: true,
            calibration_completed: false,
            days_remaining: 30,
            message: 'Calibration not started'
        };
    }

    const startDate = new Date(state.calibration_start_date);
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 30 - daysElapsed);

    if (daysElapsed >= 30 && !state.calibration_completed) {
        // Mark calibration as complete
        await supabase
            .from('user_states')
            .update({ calibration_completed: true })
            .eq('user_id', userId);

        return {
            success: true,
            calibration_completed: true,
            days_elapsed: daysElapsed,
            message: 'Calibration complete! Personal baselines established.'
        };
    }

    return {
        success: true,
        calibration_completed: state.calibration_completed,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        message: daysRemaining > 0
            ? `Calibration in progress. ${daysRemaining} days remaining.`
            : 'Calibration period complete.'
    };
}

/**
 * INITIALIZE_FROM_INTAKE: Map intake responses to initial user state
 */
async function handleInitializeFromIntake(
    supabase: any,
    userId: string,
    intakeData: any
) {
    // Map intake responses to user_states fields
    const stateMapping: any = {
        calibration_start_date: new Date().toISOString().split('T')[0],
        calibration_completed: false,
    };

    // Sleep Debt (from sleep_hours_bucket)
    if (intakeData.sleep_hours_bucket) {
        const sleepBucket = intakeData.sleep_hours_bucket;
        if (sleepBucket === '<6h') {
            stateMapping.sleep_debt = 'severe';
        } else if (sleepBucket === '6-7h') {
            stateMapping.sleep_debt = 'moderate';
        } else if (sleepBucket === '7-8h') {
            stateMapping.sleep_debt = 'mild';
        } else {
            stateMapping.sleep_debt = 'none';
        }
    }

    // Stress Load (from stress_1_10)
    if (intakeData.stress_1_10) {
        const stress = parseInt(intakeData.stress_1_10);
        if (stress >= 8) {
            stateMapping.stress_load = 'burnout_risk';
        } else if (stress >= 6) {
            stateMapping.stress_load = 'high';
        } else if (stress >= 4) {
            stateMapping.stress_load = 'elevated';
        } else {
            stateMapping.stress_load = 'baseline';
        }
    }

    // Training Load (from training_frequency)
    if (intakeData.training_frequency) {
        const freq = intakeData.training_frequency;
        if (freq === '5+' || freq === '7+') {
            stateMapping.training_load = 'building';
        } else if (freq === '3-4' || freq === '1-2') {
            stateMapping.training_load = 'maintenance';
        } else {
            stateMapping.training_load = 'deload';
        }
    }

    // Recovery State (default to moderate for new users)
    stateMapping.recovery_state = 'moderate';

    // Metabolic Flexibility (default to stable for new users)
    stateMapping.metabolic_flexibility = 'stable';

    // Initialize user_states record
    const { data: existingState, error: checkError } = await supabase
        .from('user_states')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (existingState) {
        // Update existing state
        const { data, error } = await supabase
            .from('user_states')
            .update(stateMapping)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: 'User state updated from intake',
            state: data
        };
    } else {
        // Create new state
        const { data, error } = await supabase
            .from('user_states')
            .insert({
                user_id: userId,
                ...stateMapping
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: 'User state initialized from intake',
            state: data
        };
    }
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse request
        const { action, user_id, field, new_value, source, context, updates, limit, intake_data } = await req.json();

        // Validate action
        const validActions = ['get_state', 'update_field', 'update_multiple', 'get_history', 'check_calibration', 'initialize_from_intake'];
        if (!validActions.includes(action)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Invalid action. Must be one of: ${validActions.join(', ')}`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate user_id
        if (!user_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'user_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client with service role (bypasses RLS)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Route to action handler
        let result;
        switch (action) {
            case 'get_state':
                result = await handleGetState(supabase, user_id);
                break;

            case 'update_field':
                if (!field || new_value === undefined || !source) {
                    throw new Error('update_field requires: field, new_value, source');
                }
                result = await handleUpdateField(supabase, user_id, {
                    field,
                    new_value,
                    source,
                    context
                });
                break;

            case 'update_multiple':
                if (!updates || !Array.isArray(updates)) {
                    throw new Error('update_multiple requires: updates (array)');
                }
                result = await handleUpdateMultiple(supabase, user_id, updates);
                break;

            case 'get_history':
                result = await handleGetHistory(supabase, user_id, field, limit);
                break;

            case 'check_calibration':
                result = await handleCheckCalibration(supabase, user_id);
                break;

            case 'initialize_from_intake':
                if (!intake_data) {
                    throw new Error('initialize_from_intake requires: intake_data');
                }
                result = await handleInitializeFromIntake(supabase, user_id, intake_data);
                break;

            default:
                throw new Error('Unknown action');
        }

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('State API Error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
