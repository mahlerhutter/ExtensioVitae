// ExtensioVitae - Get Adjusted Tasks Edge Function
// Returns tasks adjusted for user's recovery state

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

        // Get date from request
        const { date } = await req.json().catch(() => ({}));
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Get today's recovery metrics
        const { data: recovery, error: recoveryError } = await supabase
            .from('recovery_metrics')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', targetDate)
            .single();

        if (recoveryError && recoveryError.code !== 'PGRST116') {
            console.error('Recovery fetch error:', recoveryError);
        }

        const recoveryState = recovery?.readiness_state || 'moderate';
        const recoveryScore = recovery?.recovery_score || 50;

        // Get active tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('current_streak', { ascending: false });

        if (tasksError) {
            throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
        }

        // Adjustment multipliers based on recovery state
        const adjustments = {
            optimal: {
                intensity_multiplier: 1.1,
                duration_multiplier: 1.0,
                recommendation: 'Push your limits today',
                allow_hiit: true,
                allow_strength: true,
            },
            moderate: {
                intensity_multiplier: 1.0,
                duration_multiplier: 0.9,
                recommendation: 'Steady effort, listen to your body',
                allow_hiit: false,
                allow_strength: true,
            },
            low: {
                intensity_multiplier: 0.7,
                duration_multiplier: 0.7,
                recommendation: 'Active recovery focus',
                allow_hiit: false,
                allow_strength: false,
            },
        };

        const adjustment = adjustments[recoveryState];

        // Adjust tasks
        const adjustedTasks = tasks.map(task => {
            const adjusted = {
                ...task,
                recovery_state: recoveryState,
                recovery_score: recoveryScore,
                adjustment_applied: true,
            };

            // Calculate adjusted duration
            if (task.duration_minutes) {
                adjusted.adjusted_duration_minutes = Math.round(
                    task.duration_minutes * adjustment.duration_multiplier
                );
            }

            // Add recommendation
            adjusted.recommendation = adjustment.recommendation;

            // Suggest alternative for high-intensity tasks on low recovery
            if (recoveryState === 'low' && task.intensity === 'high') {
                adjusted.suggested_alternative = {
                    title: task.title
                        .replace('HIIT', 'Gentle Yoga')
                        .replace('Strength', 'Stretching')
                        .replace('High Intensity', 'Low Intensity'),
                    duration_minutes: Math.round(task.duration_minutes * 0.5),
                    intensity: 'low',
                    reason: 'HRV indicates insufficient recovery - prioritizing restoration',
                };
            }

            // Warn about intensity mismatch
            if (recoveryState === 'low' && task.intensity === 'high') {
                adjusted.intensity_warning = 'Consider swapping for recovery activity';
            } else if (recoveryState === 'moderate' && task.intensity === 'high') {
                adjusted.intensity_warning = 'Reduce intensity or duration';
            }

            // Optimal time of day check
            const currentHour = new Date().getHours();
            const timeOfDay =
                currentHour >= 6 && currentHour < 12 ? 'morning' :
                    currentHour >= 12 && currentHour < 17 ? 'afternoon' :
                        currentHour >= 17 && currentHour < 21 ? 'evening' : 'night';

            if (task.optimal_time_of_day && task.optimal_time_of_day.includes(timeOfDay)) {
                adjusted.optimal_timing = true;
                adjusted.timing_note = `Optimal time for this task`;
            } else {
                adjusted.optimal_timing = false;
            }

            return adjusted;
        });

        // Sort by priority (streaks > optimal timing > category)
        adjustedTasks.sort((a, b) => {
            // Streaks first
            if (a.current_streak !== b.current_streak) {
                return b.current_streak - a.current_streak;
            }
            // Then optimal timing
            if (a.optimal_timing !== b.optimal_timing) {
                return a.optimal_timing ? -1 : 1;
            }
            // Then by category priority
            const categoryPriority = {
                exercise: 1,
                recovery: 2,
                nutrition: 3,
                supplements: 4,
                cognitive: 5,
                social: 6,
                custom: 7,
            };
            return (categoryPriority[a.category] || 99) - (categoryPriority[b.category] || 99);
        });

        return new Response(
            JSON.stringify({
                success: true,
                recovery_state: recoveryState,
                recovery_score: recoveryScore,
                tasks: adjustedTasks,
                adjustment: {
                    intensity_multiplier: adjustment.intensity_multiplier,
                    duration_multiplier: adjustment.duration_multiplier,
                    recommendation: adjustment.recommendation,
                },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error getting adjusted tasks:', error);

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
