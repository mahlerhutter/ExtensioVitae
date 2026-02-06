// ExtensioVitae - Calculate Recovery Score Edge Function
// Aggregates wearable data and calculates daily recovery metrics

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate HRV score (0-100)
function calculateHRVScore(hrv: number, baseline: number): number {
    if (!baseline || baseline === 0) return 50; // Default if no baseline

    const ratio = hrv / baseline;

    if (ratio >= 1.2) return 100;
    if (ratio >= 1.1) return 90;
    if (ratio >= 1.0) return 80;
    if (ratio >= 0.9) return 70;
    if (ratio >= 0.8) return 60;
    if (ratio >= 0.7) return 50;
    if (ratio >= 0.6) return 40;
    if (ratio >= 0.5) return 30;
    return 20;
}

// Helper function to calculate RHR score (0-100)
function calculateRHRScore(rhr: number, baseline: number): number {
    if (!baseline || baseline === 0) return 50; // Default if no baseline

    const ratio = rhr / baseline;

    if (ratio <= 0.9) return 100;
    if (ratio <= 0.95) return 90;
    if (ratio <= 1.0) return 80;
    if (ratio <= 1.05) return 70;
    if (ratio <= 1.1) return 60;
    if (ratio <= 1.15) return 50;
    if (ratio <= 1.2) return 40;
    if (ratio <= 1.25) return 30;
    return 20;
}

// Helper function to calculate sleep score (0-100)
function calculateSleepScore(sleepData: any): number {
    if (!sleepData) return 50;

    const totalSleep = sleepData.total_min || 0;
    const efficiency = sleepData.efficiency || 0;
    const deepSleep = sleepData.deep_min || 0;
    const remSleep = sleepData.rem_min || 0;

    // Optimal sleep: 7-9 hours
    let durationScore = 0;
    if (totalSleep >= 420 && totalSleep <= 540) durationScore = 100;
    else if (totalSleep >= 360 && totalSleep < 420) durationScore = 80;
    else if (totalSleep >= 540 && totalSleep < 600) durationScore = 80;
    else if (totalSleep >= 300 && totalSleep < 360) durationScore = 60;
    else if (totalSleep >= 600 && totalSleep < 660) durationScore = 60;
    else durationScore = 40;

    // Efficiency score (0.85+ is good)
    const efficiencyScore = Math.min(100, efficiency * 120);

    // Deep + REM should be ~30-40% of total sleep
    const restorative = deepSleep + remSleep;
    const restorativeRatio = restorative / totalSleep;
    let restorativeScore = 0;
    if (restorativeRatio >= 0.3 && restorativeRatio <= 0.4) restorativeScore = 100;
    else if (restorativeRatio >= 0.25 && restorativeRatio < 0.3) restorativeScore = 80;
    else if (restorativeRatio >= 0.4 && restorativeRatio < 0.45) restorativeScore = 80;
    else restorativeScore = 60;

    // Weighted average
    return Math.round(durationScore * 0.4 + efficiencyScore * 0.3 + restorativeScore * 0.3);
}

// Helper function to calculate overall recovery score
function calculateRecoveryScore(hrvScore: number, rhrScore: number, sleepScore: number): number {
    // Weighted average: HRV 40%, Sleep 40%, RHR 20%
    return Math.round(hrvScore * 0.4 + sleepScore * 0.4 + rhrScore * 0.2);
}

// Helper function to determine readiness state
function getReadinessState(recoveryScore: number): string {
    if (recoveryScore >= 70) return 'optimal';
    if (recoveryScore >= 40) return 'moderate';
    return 'low';
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

        // Get date from request body or use today
        const body = await req.json().catch(() => ({}));
        const targetDate = body.date || new Date().toISOString().split('T')[0];

        // Fetch wearable data for the target date
        const { data: wearableData, error: wearableError } = await supabase
            .from('wearable_data')
            .select('*')
            .eq('user_id', user.id)
            .eq('measurement_date', targetDate);

        if (wearableError) {
            throw new Error(`Failed to fetch wearable data: ${wearableError.message}`);
        }

        if (!wearableData || wearableData.length === 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'No wearable data found for this date',
                }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Extract sleep data
        const sleepData = wearableData.find((d) => d.data_type === 'sleep_summary');

        // Extract readiness/recovery data
        const readinessData = wearableData.find((d) => d.data_type === 'readiness');

        // Extract HRV data (might be in sleep_summary or separate)
        let hrvRmssd = readinessData?.data?.hrv_rmssd || sleepData?.data?.avg_hrv || null;
        let rhrBpm = readinessData?.data?.rhr || sleepData?.data?.rhr || null;

        // Get 7-day baseline for comparison
        const sevenDaysAgo = new Date(new Date(targetDate).getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

        const { data: baselineData } = await supabase
            .from('wearable_data')
            .select('data')
            .eq('user_id', user.id)
            .gte('measurement_date', sevenDaysAgo)
            .lt('measurement_date', targetDate)
            .in('data_type', ['sleep_summary', 'readiness']);

        // Calculate baselines
        let hrvBaseline = 0;
        let rhrBaseline = 0;
        let sleepBaseline = 0;
        let baselineCount = 0;

        if (baselineData && baselineData.length > 0) {
            baselineData.forEach((d) => {
                const hrv = d.data?.hrv_rmssd || d.data?.avg_hrv;
                const rhr = d.data?.rhr;
                const sleep = d.data?.total_min;

                if (hrv) {
                    hrvBaseline += hrv;
                    baselineCount++;
                }
                if (rhr) rhrBaseline += rhr;
                if (sleep) sleepBaseline += sleep;
            });

            if (baselineCount > 0) {
                hrvBaseline = hrvBaseline / baselineCount;
                rhrBaseline = rhrBaseline / baselineCount;
                sleepBaseline = sleepBaseline / baselineCount;
            }
        }

        // Calculate scores
        const hrvScore = hrvRmssd ? calculateHRVScore(hrvRmssd, hrvBaseline) : null;
        const rhrScore = rhrBpm ? calculateRHRScore(rhrBpm, rhrBaseline) : null;
        const sleepScore = sleepData ? calculateSleepScore(sleepData.data) : null;

        // Calculate overall recovery score
        const recoveryScore = (hrvScore && rhrScore && sleepScore)
            ? calculateRecoveryScore(hrvScore, rhrScore, sleepScore)
            : (readinessData?.data?.recovery_score || readinessData?.data?.score || null);

        const readinessState = recoveryScore ? getReadinessState(recoveryScore) : 'moderate';

        // Prepare recovery metrics record
        const recoveryMetrics = {
            user_id: user.id,
            date: targetDate,

            // Core metrics
            hrv_rmssd: hrvRmssd,
            rhr_bpm: rhrBpm,

            // Sleep metrics
            sleep_total_minutes: sleepData?.data?.total_min || null,
            sleep_deep_minutes: sleepData?.data?.deep_min || null,
            sleep_rem_minutes: sleepData?.data?.rem_min || null,
            sleep_light_minutes: sleepData?.data?.light_min || null,
            sleep_awake_minutes: sleepData?.data?.awake_min || null,
            sleep_efficiency: sleepData?.data?.efficiency || null,
            sleep_onset_latency_minutes: sleepData?.data?.latency || null,

            // Temperature
            body_temperature_celsius: sleepData?.data?.skin_temp || readinessData?.data?.skin_temp || null,
            temperature_deviation: sleepData?.data?.temperature_deviation || readinessData?.data?.temperature_deviation || null,

            // Respiratory
            respiratory_rate: sleepData?.data?.respiratory_rate || null,

            // Calculated scores
            recovery_score: recoveryScore,
            hrv_score: hrvScore,
            sleep_score: sleepScore,
            rhr_score: rhrScore,

            // Readiness state
            readiness_state: readinessState,

            // Baselines
            hrv_7day_baseline: hrvBaseline || null,
            rhr_7day_baseline: rhrBaseline || null,
            sleep_7day_baseline: sleepBaseline || null,

            // Metadata
            data_source: 'wearable',
            calculation_version: 'v1.0',
        };

        // Upsert recovery metrics
        const { error: upsertError } = await supabase
            .from('recovery_metrics')
            .upsert(recoveryMetrics, {
                onConflict: 'user_id,date',
            });

        if (upsertError) {
            throw new Error(`Failed to upsert recovery metrics: ${upsertError.message}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                date: targetDate,
                recovery_score: recoveryScore,
                readiness_state: readinessState,
                metrics: {
                    hrv_score: hrvScore,
                    rhr_score: rhrScore,
                    sleep_score: sleepScore,
                },
                baselines: {
                    hrv: hrvBaseline,
                    rhr: rhrBaseline,
                    sleep: sleepBaseline,
                },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error calculating recovery score:', error);

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
