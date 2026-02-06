// ExtensioVitae - Oura Ring Data Sync Edge Function
// Syncs sleep, HRV, and readiness data from Oura API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OuraSleepData {
    id: string;
    day: string;
    bedtime_start: string;
    bedtime_end: string;
    total_sleep_duration: number;
    deep_sleep_duration: number;
    rem_sleep_duration: number;
    light_sleep_duration: number;
    awake_time: number;
    efficiency: number;
    latency: number;
    average_hrv: number;
    average_heart_rate: number;
    lowest_heart_rate: number;
    respiratory_rate: number;
    temperature_deviation: number;
}

interface OuraReadinessData {
    id: string;
    day: string;
    score: number;
    temperature_deviation: number;
    temperature_trend_deviation: number;
    contributors: {
        activity_balance: number;
        body_temperature: number;
        hrv_balance: number;
        previous_day_activity: number;
        previous_night: number;
        recovery_index: number;
        resting_heart_rate: number;
        sleep_balance: number;
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

        // Get Oura connection for user
        const { data: connection, error: connError } = await supabase
            .from('wearable_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('device_type', 'oura')
            .single();

        if (connError || !connection) {
            throw new Error('Oura connection not found');
        }

        // Check if token is expired
        const tokenExpiry = new Date(connection.token_expires_at);
        if (tokenExpiry < new Date()) {
            // Refresh token
            const refreshResponse = await fetch('https://api.ouraring.com/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: connection.refresh_token,
                    client_id: Deno.env.get('OURA_CLIENT_ID') ?? '',
                    client_secret: Deno.env.get('OURA_CLIENT_SECRET') ?? '',
                }),
            });

            if (!refreshResponse.ok) {
                throw new Error('Failed to refresh Oura token');
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
        const startDate = lastSync.toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        // Fetch sleep data
        const sleepResponse = await fetch(
            `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
            {
                headers: {
                    Authorization: `Bearer ${connection.access_token}`,
                },
            }
        );

        if (!sleepResponse.ok) {
            throw new Error('Failed to fetch Oura sleep data');
        }

        const sleepData = await sleepResponse.json();

        // Fetch readiness data
        const readinessResponse = await fetch(
            `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`,
            {
                headers: {
                    Authorization: `Bearer ${connection.access_token}`,
                },
            }
        );

        if (!readinessResponse.ok) {
            throw new Error('Failed to fetch Oura readiness data');
        }

        const readinessData = await readinessResponse.json();

        // Process and insert sleep data
        const sleepRecords = sleepData.data.map((sleep: OuraSleepData) => ({
            user_id: user.id,
            connection_id: connection.id,
            measurement_timestamp: sleep.bedtime_end,
            measurement_date: sleep.day,
            source_device: 'oura',
            data_type: 'sleep_summary',
            data: {
                total_min: Math.round(sleep.total_sleep_duration / 60),
                deep_min: Math.round(sleep.deep_sleep_duration / 60),
                rem_min: Math.round(sleep.rem_sleep_duration / 60),
                light_min: Math.round(sleep.light_sleep_duration / 60),
                awake_min: Math.round(sleep.awake_time / 60),
                efficiency: sleep.efficiency / 100,
                latency: Math.round(sleep.latency / 60),
                avg_hrv: sleep.average_hrv,
                avg_hr: sleep.average_heart_rate,
                rhr: sleep.lowest_heart_rate,
                respiratory_rate: sleep.respiratory_rate,
                temperature_deviation: sleep.temperature_deviation,
            },
        }));

        // Process and insert readiness data
        const readinessRecords = readinessData.data.map((readiness: OuraReadinessData) => ({
            user_id: user.id,
            connection_id: connection.id,
            measurement_timestamp: `${readiness.day}T12:00:00Z`,
            measurement_date: readiness.day,
            source_device: 'oura',
            data_type: 'readiness',
            data: {
                score: readiness.score,
                temperature_deviation: readiness.temperature_deviation,
                contributors: readiness.contributors,
            },
        }));

        // Insert all records (upsert to handle duplicates)
        const allRecords = [...sleepRecords, ...readinessRecords];

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
                sleep_records: sleepRecords.length,
                readiness_records: readinessRecords.length,
                date_range: { start: startDate, end: endDate },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error syncing Oura data:', error);

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
