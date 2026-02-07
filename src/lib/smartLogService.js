/**
 * ExtensioVitae Smart Log Service
 * 
 * AI-powered activity classification via Supabase Edge Function.
 * Users type free-text (e.g. "1h joggen") and AI classifies it
 * into longevity pillars with duration, intensity, and scoring.
 */

import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Log a free-text activity via AI classification
 * @param {string} rawInput - User's free-text input (e.g. "1h joggen im Park")
 * @returns {Promise<Object>} - Classified and saved activity log
 */
export async function logSmartActivity(rawInput) {
    if (!rawInput || rawInput.trim().length === 0) {
        return { success: false, error: 'Eingabe darf nicht leer sein' };
    }

    if (rawInput.trim().length > 500) {
        return { success: false, error: 'Eingabe zu lang (max 500 Zeichen)' };
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { success: false, error: 'Nicht eingeloggt' };
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/smart-log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ raw_input: rawInput.trim() }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Klassifizierung fehlgeschlagen');
        }

        return data;
    } catch (error) {
        console.error('[SmartLog] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get today's activity logs for the current user
 * @returns {Promise<Array>}
 */
export async function getTodayLogs() {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('log_date', today)
            .order('logged_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[SmartLog] Error loading logs:', error);
        return [];
    }
}

/**
 * Get activity logs for a date range
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export async function getLogsByDateRange(startDate, endDate) {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .gte('log_date', startDate)
            .lte('log_date', endDate)
            .order('logged_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[SmartLog] Error loading logs:', error);
        return [];
    }
}

/**
 * Get pillar summary for today
 * @returns {Promise<Object>} - Pillar breakdown with counts and total minutes
 */
export async function getTodayPillarSummary() {
    const logs = await getTodayLogs();

    const summary = {
        sleep: { count: 0, minutes: 0, items: [] },
        movement: { count: 0, minutes: 0, items: [] },
        nutrition: { count: 0, minutes: 0, items: [] },
        stress: { count: 0, minutes: 0, items: [] },
        connection: { count: 0, minutes: 0, items: [] },
        environment: { count: 0, minutes: 0, items: [] },
    };

    for (const log of logs) {
        if (summary[log.pillar]) {
            summary[log.pillar].count++;
            summary[log.pillar].minutes += log.duration_minutes || 0;
            summary[log.pillar].items.push(log);
        }
        // Count secondary pillar too
        if (log.secondary_pillar && summary[log.secondary_pillar]) {
            summary[log.secondary_pillar].count++;
            summary[log.secondary_pillar].minutes += Math.round((log.duration_minutes || 0) * 0.5);
        }
    }

    return summary;
}

/**
 * Delete an activity log
 * @param {string} logId - UUID of the log to delete
 * @returns {Promise<Object>}
 */
export async function deleteActivityLog(logId) {
    try {
        const { error } = await supabase
            .from('activity_logs')
            .delete()
            .eq('id', logId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[SmartLog] Error deleting log:', error);
        return { success: false, error: error.message };
    }
}

// Pillar metadata for display
export const PILLAR_META = {
    sleep: { emoji: '😴', label: 'Schlaf', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
    movement: { emoji: '🏃', label: 'Bewegung', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    nutrition: { emoji: '🥗', label: 'Ernährung', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
    stress: { emoji: '🧘', label: 'Ruhe', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
    connection: { emoji: '🤝', label: 'Verbindung', color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
    environment: { emoji: '🌿', label: 'Umgebung', color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/30' },
};

export default {
    logSmartActivity,
    getTodayLogs,
    getLogsByDateRange,
    getTodayPillarSummary,
    deleteActivityLog,
    PILLAR_META
};
