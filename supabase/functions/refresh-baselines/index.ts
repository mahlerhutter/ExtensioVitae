// ExtensioVitae - Refresh Baselines Edge Function
// Refreshes materialized view for user recovery baselines
// Scheduled via pg_cron: 0 3 * * * (daily at 3 AM UTC)

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
        // Verify this is a cron job or admin request
        const authHeader = req.headers.get('Authorization');
        const cronSecret = req.headers.get('X-Cron-Secret');

        // Allow either service role key or cron secret
        const expectedCronSecret = Deno.env.get('CRON_SECRET');
        if (!authHeader && (!cronSecret || cronSecret !== expectedCronSecret)) {
            throw new Error('Unauthorized - missing auth or cron secret');
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        console.log('Starting baseline refresh...');

        // Refresh materialized view
        const { error: refreshError } = await supabase.rpc('refresh_materialized_view', {
            view_name: 'user_recovery_baseline',
        });

        if (refreshError) {
            // Fallback: Try direct SQL if RPC doesn't exist
            const { error: sqlError } = await supabase
                .from('user_recovery_baseline')
                .select('count')
                .limit(0); // Just to trigger a connection

            if (sqlError) {
                throw new Error(`Failed to refresh baseline: ${refreshError.message}`);
            }

            // Execute refresh via raw SQL
            const { error: execError } = await supabase.rpc('exec_sql', {
                sql: 'REFRESH MATERIALIZED VIEW CONCURRENTLY user_recovery_baseline;',
            });

            if (execError) {
                console.warn('RPC exec_sql not available, using alternative method');

                // Alternative: Delete and recreate (slower but works)
                // This would be done via migration, not here
                throw new Error('Materialized view refresh requires database-level access');
            }
        }

        console.log('Baseline refresh completed successfully');

        // Get stats
        const { data: stats, error: statsError } = await supabase
            .from('user_recovery_baseline')
            .select('user_id, last_metric_date')
            .order('last_metric_date', { ascending: false })
            .limit(10);

        if (statsError) {
            console.warn('Failed to fetch stats:', statsError);
        }

        return new Response(
            JSON.stringify({
                success: true,
                refreshed_at: new Date().toISOString(),
                users_updated: stats?.length || 0,
                sample_users: stats || [],
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error refreshing baselines:', error);

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
