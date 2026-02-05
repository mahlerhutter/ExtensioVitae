import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabase';
import './TrendChart.css';

/**
 * TrendChart - 7-day progress visualization
 * 
 * Shows recovery score and sleep hours over the last 7 days.
 * Uses Recharts for beautiful, responsive charts.
 * 
 * @param {string} userId - User ID to load data for
 */
export default function TrendChart({ userId }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            loadWeekData();
        }
    }, [userId]);

    async function loadWeekData() {
        try {
            setLoading(true);
            setError(null);

            // Check if supabase is available
            if (!supabase) {
                console.warn('[TrendChart] Supabase not available, showing empty state');
                setData([]);
                setLoading(false);
                return;
            }

            // Get last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recoveryData, error: fetchError } = await supabase
                .from('recovery_tracking')
                .select('check_in_date, recovery_score, sleep_hours')
                .eq('user_id', userId)
                .gte('check_in_date', sevenDaysAgo.toISOString().split('T')[0])
                .order('check_in_date', { ascending: true });

            if (fetchError) {
                // If table doesn't exist or other DB error, show empty state instead of error
                console.warn('[TrendChart] Error loading data:', fetchError.message);
                setData([]);
                setLoading(false);
                return;
            }

            // Format for chart
            const chartData = (recoveryData || []).map(d => ({
                day: new Date(d.check_in_date).toLocaleDateString('de-DE', { weekday: 'short' }),
                fullDate: d.check_in_date,
                recovery: d.recovery_score,
                sleep: d.sleep_hours
            }));

            setData(chartData);
        } catch (err) {
            console.error('[TrendChart] Error loading trend data:', err);
            // Show empty state instead of error for better UX
            setData([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="trend-chart">
                <h3 className="trend-chart__title">Dein 7-Tage-Trend</h3>
                <div className="trend-chart__loading">
                    <div className="trend-chart__spinner"></div>
                    <p>Lade Daten...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="trend-chart">
                <h3 className="trend-chart__title">Dein 7-Tage-Trend</h3>
                <div className="trend-chart__error">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="trend-chart">
                <h3 className="trend-chart__title">Dein 7-Tage-Trend</h3>
                <div className="trend-chart__empty">
                    <span className="trend-chart__empty-icon">📊</span>
                    <p>Noch keine Daten. Starte deinen Morning Check-in!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="trend-chart">
            <h3 className="trend-chart__title">Dein 7-Tage-Trend</h3>
            <div className="trend-chart__container">
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="day"
                            stroke="rgba(255,255,255,0.5)"
                            style={{ fontSize: '0.875rem' }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            style={{ fontSize: '0.875rem' }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(0,0,0,0.9)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                padding: '0.75rem'
                            }}
                            labelStyle={{ color: '#fff', marginBottom: '0.5rem' }}
                            itemStyle={{ color: '#fff', fontSize: '0.875rem' }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '0.875rem' }}
                            iconType="line"
                        />
                        <Line
                            type="monotone"
                            dataKey="recovery"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            name="Recovery Score"
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="sleep"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Schlaf (Stunden)"
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
