// ExtensioVitae - Recovery Service
// Handles recovery metrics, baselines, and insights

import { supabase } from '../lib/supabase';

/**
 * Get today's recovery metrics
 */
export const getTodayRecovery = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('recovery_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore "not found"
        throw new Error(`Failed to fetch today's recovery: ${error.message}`);
    }

    return data;
};

/**
 * Get recovery trend for the last N days
 */
export const getRecoveryTrend = async (days = 7) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('recovery_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch recovery trend: ${error.message}`);
    }

    return data || [];
};

/**
 * Get user's recovery baseline
 */
export const getBaseline = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('user_recovery_baseline')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch baseline: ${error.message}`);
    }

    return data;
};

/**
 * Manually log recovery data (fallback when no wearable)
 */
export const manualLogRecovery = async (manualData) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    // Calculate simple recovery score from manual inputs
    const calculateManualScore = (data) => {
        let score = 50; // Base score

        // Sleep quality (0-10 scale)
        if (data.sleep_quality) {
            score += (data.sleep_quality - 5) * 5; // ±25 points
        }

        // Energy level (0-10 scale)
        if (data.energy_level) {
            score += (data.energy_level - 5) * 3; // ±15 points
        }

        // Soreness (0-10 scale, inverted)
        if (data.soreness) {
            score -= (data.soreness - 5) * 2; // ±10 points
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    };

    const recoveryScore = calculateManualScore(manualData);
    const readinessState =
        recoveryScore >= 70 ? 'optimal' :
            recoveryScore >= 50 ? 'moderate' : 'low';

    const { data, error } = await supabase
        .from('recovery_metrics')
        .upsert({
            user_id: user.id,
            date: today,
            recovery_score: recoveryScore,
            readiness_state: readinessState,
            sleep_total_minutes: manualData.sleep_hours ? manualData.sleep_hours * 60 : null,
            notes: manualData.notes,
            data_source: 'manual',
        }, {
            onConflict: 'user_id,date',
        });

    if (error) {
        throw new Error(`Failed to log manual recovery: ${error.message}`);
    }

    return data;
};

/**
 * Get recovery insights based on trends
 */
export const getRecoveryInsights = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    // Get last 14 days
    const trend = await getRecoveryTrend(14);
    const baseline = await getBaseline();

    if (!trend || trend.length === 0) {
        return {
            status: 'no_data',
            message: 'Connect a wearable device to get recovery insights',
            recommendations: [],
        };
    }

    const insights = [];
    const recommendations = [];

    // Calculate recent average (last 7 days)
    const recentData = trend.slice(-7);
    const recentAvg = recentData.reduce((sum, d) => sum + (d.recovery_score || 0), 0) / recentData.length;

    // Trend analysis
    const firstHalf = trend.slice(0, 7);
    const secondHalf = trend.slice(7, 14);
    const firstAvg = firstHalf.reduce((sum, d) => sum + (d.recovery_score || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + (d.recovery_score || 0), 0) / secondHalf.length;
    const trendDirection = secondAvg > firstAvg + 5 ? 'improving' :
        secondAvg < firstAvg - 5 ? 'declining' : 'stable';

    // Insight 1: Overall trend
    if (trendDirection === 'improving') {
        insights.push({
            type: 'positive',
            title: 'Recovery Improving',
            message: `Your recovery has improved by ${Math.round(secondAvg - firstAvg)} points over the last week.`,
        });
        recommendations.push('Keep up your current routine - it\'s working!');
    } else if (trendDirection === 'declining') {
        insights.push({
            type: 'warning',
            title: 'Recovery Declining',
            message: `Your recovery has decreased by ${Math.round(firstAvg - secondAvg)} points over the last week.`,
        });
        recommendations.push('Consider adding an extra rest day or reducing training intensity.');
    }

    // Insight 2: Low recovery days
    const lowRecoveryDays = baseline?.low_recovery_days_14d || 0;
    if (lowRecoveryDays >= 3) {
        insights.push({
            type: 'alert',
            title: 'Frequent Low Recovery',
            message: `You've had ${lowRecoveryDays} low recovery days in the last 2 weeks.`,
        });
        recommendations.push('Prioritize sleep quality and consider deload week.');
    }

    // Insight 3: Sleep quality
    const avgSleepEfficiency = recentData.reduce((sum, d) => sum + (d.sleep_efficiency || 0), 0) / recentData.length;
    if (avgSleepEfficiency < 0.85) {
        insights.push({
            type: 'warning',
            title: 'Sleep Efficiency Low',
            message: `Your average sleep efficiency is ${Math.round(avgSleepEfficiency * 100)}% (target: 85%+).`,
        });
        recommendations.push('Optimize sleep environment: cool, dark, quiet.');
    }

    // Insight 4: HRV trend
    if (baseline?.hrv_7day_avg && baseline?.hrv_14day_avg) {
        const hrvTrend = ((baseline.hrv_7day_avg - baseline.hrv_14day_avg) / baseline.hrv_14day_avg) * 100;
        if (hrvTrend < -10) {
            insights.push({
                type: 'alert',
                title: 'HRV Declining',
                message: `Your HRV has dropped ${Math.abs(Math.round(hrvTrend))}% from your 14-day average.`,
            });
            recommendations.push('Reduce training volume and focus on recovery modalities.');
        }
    }

    // Default positive message if no issues
    if (insights.length === 0) {
        insights.push({
            type: 'positive',
            title: 'Recovery Optimal',
            message: 'Your recovery metrics are stable and healthy.',
        });
        recommendations.push('Continue your current training and recovery routine.');
    }

    return {
        status: trendDirection,
        currentScore: recentAvg,
        insights,
        recommendations,
        baseline,
    };
};

/**
 * Get recovery metrics for a specific date
 */
export const getRecoveryForDate = async (date) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('recovery_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch recovery for date: ${error.message}`);
    }

    return data;
};

export default {
    getTodayRecovery,
    getRecoveryTrend,
    getBaseline,
    manualLogRecovery,
    getRecoveryInsights,
    getRecoveryForDate,
};
