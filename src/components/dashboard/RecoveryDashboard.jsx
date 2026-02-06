// ExtensioVitae - Recovery Dashboard Component
// Displays HRV trends, sleep quality, recovery score, and insights

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Heart, Moon, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getTodayRecovery, getRecoveryTrend, getBaseline, getRecoveryInsights } from '../../services/recoveryService';

export default function RecoveryDashboard() {
    const [todayRecovery, setTodayRecovery] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [baseline, setBaseline] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRecoveryData();
    }, []);

    const loadRecoveryData = async () => {
        try {
            setLoading(true);
            const [today, trend, base, insightsData] = await Promise.all([
                getTodayRecovery(),
                getRecoveryTrend(7),
                getBaseline(),
                getRecoveryInsights(),
            ]);

            setTodayRecovery(today);
            setTrendData(trend);
            setBaseline(base);
            setInsights(insightsData);
        } catch (err) {
            console.error('Failed to load recovery data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading recovery data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-start">
                    <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Failed to load recovery data</h3>
                        <p className="text-sm text-gray-600 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!todayRecovery && (!trendData || trendData.length === 0)) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">No Recovery Data Yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Connect a wearable device to start tracking your recovery metrics.
                    </p>
                </div>
            </div>
        );
    }

    const getReadinessColor = (state) => {
        switch (state) {
            case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
            case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getReadinessIcon = (state) => {
        switch (state) {
            case 'optimal': return <CheckCircle className="w-5 h-5" />;
            case 'moderate': return <Minus className="w-5 h-5" />;
            case 'low': return <AlertCircle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTrendIcon = (status) => {
        switch (status) {
            case 'improving': return <TrendingUp className="w-5 h-5 text-green-600" />;
            case 'declining': return <TrendingDown className="w-5 h-5 text-red-600" />;
            default: return <Minus className="w-5 h-5 text-gray-600" />;
        }
    };

    // Format chart data
    const chartData = trendData.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        recovery: d.recovery_score,
        hrv: d.hrv_score,
        sleep: d.sleep_score,
        rhr: d.rhr_score,
    }));

    return (
        <div className="space-y-6">
            {/* Today's Recovery Score */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold opacity-90">Today's Recovery</h2>
                        <p className="text-sm opacity-75">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <Activity className="w-6 h-6 opacity-75" />
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-6xl font-bold mb-2">
                            {todayRecovery?.recovery_score || '--'}
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${todayRecovery ? getReadinessColor(todayRecovery.readiness_state) : 'bg-white/20'
                            }`}>
                            {todayRecovery && getReadinessIcon(todayRecovery.readiness_state)}
                            <span className="ml-2 capitalize">
                                {todayRecovery?.readiness_state || 'No data'}
                            </span>
                        </div>
                    </div>

                    {/* Component Scores */}
                    <div className="grid grid-cols-3 gap-3 text-right">
                        <div>
                            <div className="text-2xl font-bold">{todayRecovery?.hrv_score || '--'}</div>
                            <div className="text-xs opacity-75 flex items-center justify-end">
                                <Heart className="w-3 h-3 mr-1" />
                                HRV
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{todayRecovery?.sleep_score || '--'}</div>
                            <div className="text-xs opacity-75 flex items-center justify-end">
                                <Moon className="w-3 h-3 mr-1" />
                                Sleep
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{todayRecovery?.rhr_score || '--'}</div>
                            <div className="text-xs opacity-75 flex items-center justify-end">
                                <Zap className="w-3 h-3 mr-1" />
                                RHR
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 7-Day Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">7-Day Recovery Trend</h3>
                    {insights && getTrendIcon(insights.status)}
                </div>

                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="recovery"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="url(#colorRecovery)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Component Breakdown Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Components</h3>

                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="hrv"
                            stroke="#ef4444"
                            strokeWidth={2}
                            name="HRV"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="sleep"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Sleep"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="rhr"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="RHR"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Insights & Recommendations */}
            {insights && insights.insights && insights.insights.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>

                    <div className="space-y-3">
                        {insights.insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border ${insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                                        insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                            insight.type === 'alert' ? 'bg-red-50 border-red-200' :
                                                'bg-blue-50 border-blue-200'
                                    }`}
                            >
                                <div className="flex items-start">
                                    <div className={`flex-shrink-0 ${insight.type === 'positive' ? 'text-green-600' :
                                            insight.type === 'warning' ? 'text-yellow-600' :
                                                insight.type === 'alert' ? 'text-red-600' :
                                                    'text-blue-600'
                                        }`}>
                                        {insight.type === 'positive' ? <CheckCircle className="w-5 h-5" /> :
                                            insight.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                                                insight.type === 'alert' ? <AlertCircle className="w-5 h-5" /> :
                                                    <Info className="w-5 h-5" />}
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                                        <p className="text-sm text-gray-700 mt-1">{insight.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {insights.recommendations && insights.recommendations.length > 0 && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h4 className="font-semibold text-purple-900 mb-2">Recommendations</h4>
                            <ul className="space-y-1">
                                {insights.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-sm text-purple-800 flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Baseline Stats */}
            {baseline && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Baselines</h3>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                                {baseline.hrv_7day_avg ? Math.round(baseline.hrv_7day_avg) : '--'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">HRV (7-day avg)</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                                {baseline.rhr_7day_avg ? Math.round(baseline.rhr_7day_avg) : '--'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">RHR (7-day avg)</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">
                                {baseline.sleep_7day_avg ? Math.round(baseline.sleep_7day_avg / 60) : '--'}h
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Sleep (7-day avg)</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
