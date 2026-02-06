// ExtensioVitae - WHOOP Data Sync Edge Function
// Syncs recovery, sleep, and strain data from WHOOP API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhoopRecoveryData {
    cycle_id: number;
    sleep_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    score_state: string;
    score: {
        user_calibrating: boolean;
        recovery_score: number;
        resting_heart_rate: number;
        hrv_rmssd_milli: number;
        spo2_percentage: number;
        skin_temp_celsius: number;
    };
}

interface WhoopSleepData {
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    start: string;
    end: string;
    timezone_offset: string;
    nap: boolean;
    score_state: string;
    score: {
        stage_summary: {
            total_in_bed_time_milli: number;
            total_awake_time_milli: number;
            total_no_data_time_milli: number;
            total_light_sleep_time_milli: number;
            total_slow_wave_sleep_time_milli: number;
            total_rem_sleep_time_milli: number;
            sleep_cycle_count: number;
            disturbance_count: number;
        };
        sleep_needed: {
            baseline_milli: number;
            need_from_sleep_debt_milli: number;
            need_from_recent_strain_milli: number;
            need_from_recent_nap_milli: number;
        };
        respiratory_rate: number;
        sleep_performance_percentage: number;
        sleep_consistency_percentage: number;
        sleep_efficiency_percentage: number;
    };
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get user from auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        );

        // Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error('Unauthorized');
        }

        // Get WHOOP connection for user
        const { data: connection, error: connError } = await supabase
            .from('wearable_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('device_type', 'whoop')
            .single();

        if (connError || !connection) {
            throw new Error('WHOOP connection not found');
        }

        // Check if token is expired
        const tokenExpiry = new Date(connection.token_expires_at);
        if (tokenExpiry < new Date()) {
            // Refresh token
            const refreshResponse = await fetch('https://api.prod.whoop.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: connection.refresh_token,
                    client_id: Deno.env.get('WHOOP_CLIENT_ID') ?? '',
                    client_secret: Deno.env.get('WHOOP_CLIENT_SECRET') ?? '',
                }),
            });

            if (!refreshResponse.ok) {
                throw new Error('Failed to refresh WHOOP token');
            }

            const refreshData = await refreshResponse.json();

            // Update connection with new tokens
            await supabase
                .from('wearable_connections')
                .update({
                    access_token: refreshData.access_token,
                    refresh_token: refreshData.refresh_token,
                    token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
                })
                .eq('id', connection.id);

            connection.access_token = refreshData.access_token;
        }

        // Determine date range (last 7 days or since last sync)
        const lastSync = connection.last_sync_at ? new Date(connection.last_sync_at) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const startDate = lastSync.toISOString();
        const endDate = new Date().toISOString();

        // Fetch recovery data
        const recoveryResponse = await fetch(
            `https://api.prod.whoop.com/developer/v1/recovery?start=${startDate}&end=${endDate}`,
            {
                headers: {
                    Authorization: `Bearer ${connection.access_token}`,
                },
            }
        );

        if (!recoveryResponse.ok) {
            throw new Error('Failed to fetch WHOOP recovery data');
        }

        const recoveryData = await recoveryResponse.json();

        // Fetch sleep data
        const sleepResponse = await fetch(
            `https://api.prod.whoop.com/developer/v1/activity/sleep?start=${startDate}&end=${endDate}`,
            {
                headers: {
                    Authorization: `Bearer ${connection.access_token}`,
                },
            }
        );

        if (!sleepResponse.ok) {
            throw new Error('Failed to fetch WHOOP sleep data');
        }

        const sleepData = await sleepResponse.json();

        // Process and insert recovery data
        const recoveryRecords = recoveryData.records?.map((recovery: WhoopRecoveryData) => {
            const date = new Date(recovery.created_at);
            return {
                user_id: user.id,
                connection_id: connection.id,
                measurement_timestamp: recovery.created_at,
                measurement_date: date.toISOString().split('T')[0],
                source_device: 'whoop',
                data_type: 'readiness',
                data: {
                    recovery_score: recovery.score.recovery_score,
                    rhr: recovery.score.resting_heart_rate,
                    hrv_rmssd: recovery.score.hrv_rmssd_milli,
                    spo2: recovery.score.spo2_percentage,
                    skin_temp: recovery.score.skin_temp_celsius,
                    user_calibrating: recovery.score.user_calibrating,
                },
            };
        }) || [];

        // Process and insert sleep data
        const sleepRecords = sleepData.records?.map((sleep: WhoopSleepData) => {
            const date = new Date(sleep.end);
            const stages = sleep.score.stage_summary;

            return {
                user_id: user.id,
                connection_id: connection.id,
                measurement_timestamp: sleep.end,
                measurement_date: date.toISOString().split('T')[0],
                source_device: 'whoop',
                data_type: 'sleep_summary',
                data: {
                    total_min: Math.round(stages.total_in_bed_time_milli / 60000),
                    awake_min: Math.round(stages.total_awake_time_milli / 60000),
                    light_min: Math.round(stages.total_light_sleep_time_milli / 60000),
                    deep_min: Math.round(stages.total_slow_wave_sleep_time_milli / 60000),
                    rem_min: Math.round(stages.total_rem_sleep_time_milli / 60000),
                    efficiency: sleep.score.sleep_efficiency_percentage / 100,
                    performance: sleep.score.sleep_performance_percentage / 100,
                    consistency: sleep.score.sleep_consistency_percentage / 100,
                    respiratory_rate: sleep.score.respiratory_rate,
                    sleep_cycles: stages.sleep_cycle_count,
                    disturbances: stages.disturbance_count,
                    is_nap: sleep.nap,
                },
            };
        }) || [];

        // Insert all records (upsert to handle duplicates)
        const allRecords = [...recoveryRecords, ...sleepRecords];

        if (allRecords.length > 0) {
            const { error: insertError } = await supabase
                .from('wearable_data')
                .upsert(allRecords, {
                    onConflict: 'user_id,source_device,measurement_timestamp,data_type,measurement_date',
                });

            if (insertError) {
                console.error('Insert error:', insertError);
                throw new Error(`Failed to insert wearable data: ${insertError.message}`);
            }
        }

        // Update last sync timestamp
        await supabase
            .from('wearable_connections')
            .update({
                last_sync_at: new Date().toISOString(),
                sync_status: 'active',
                sync_error_message: null,
                sync_retry_count: 0,
            })
            .eq('id', connection.id);

        return new Response(
            JSON.stringify({
                success: true,
                records_synced: allRecords.length,
                recovery_records: recoveryRecords.length,
                sleep_records: sleepRecords.length,
                date_range: { start: startDate, end: endDate },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error syncing WHOOP data:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
