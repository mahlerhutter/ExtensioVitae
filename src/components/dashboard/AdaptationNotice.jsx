import React, { useState } from 'react';
import { Activity, Info, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * Adaptation Notice
 *
 * Shows users WHEN and WHY their plan adapts based on recovery
 * Makes the "smart adaptation" visible and tangible
 *
 * States:
 * - optimal: Green, no changes
 * - moderate: Yellow, slight adjustments
 * - low: Red, significant recovery needed
 */
export default function AdaptationNotice({ recoveryScore, adaptations = [], hrv, hrvBaseline }) {
    const [showDetails, setShowDetails] = useState(false);

    // Determine recovery state
    const getRecoveryState = () => {
        if (recoveryScore >= 70) return 'optimal';
        if (recoveryScore >= 40) return 'moderate';
        return 'low';
    };

    const state = getRecoveryState();

    // No notice needed if recovery is optimal and no adaptations
    if (state === 'optimal' && adaptations.length === 0) return null;

    const config = {
        optimal: {
            icon: TrendingUp,
            color: 'emerald',
            bgClass: 'bg-emerald-500/10 border-emerald-500/30',
            iconColor: 'text-emerald-400',
            title: '✅ Optimale Recovery',
            subtitle: 'Dein Körper ist bereit für dein volles Protokoll'
        },
        moderate: {
            icon: Activity,
            color: 'amber',
            bgClass: 'bg-amber-500/10 border-amber-500/30',
            iconColor: 'text-amber-400',
            title: '⚠️ Moderate Recovery',
            subtitle: 'Wir haben dein Protokoll leicht angepasst'
        },
        low: {
            icon: TrendingDown,
            color: 'red',
            bgClass: 'bg-red-500/10 border-red-500/30',
            iconColor: 'text-red-400',
            title: '🔴 Recovery benötigt',
            subtitle: 'Dein Körper braucht heute Regeneration'
        }
    };

    const stateConfig = config[state];
    const Icon = stateConfig.icon;

    // Calculate HRV deviation if available
    const hrvDeviation = hrv && hrvBaseline
        ? Math.round(((hrv - hrvBaseline) / hrvBaseline) * 100)
        : null;

    return (
        <div className={`border rounded-xl p-4 ${stateConfig.bgClass} mb-6`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    <Icon className={`w-5 h-5 ${stateConfig.iconColor} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                        <h3 className={`font-semibold ${stateConfig.iconColor} mb-1`}>
                            {stateConfig.title}
                        </h3>
                        <p className="text-slate-300 text-sm">
                            {stateConfig.subtitle}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <Info className="w-4 h-4" />
                </button>
            </div>

            {/* Adaptations List */}
            {adaptations.length > 0 && (
                <div className="space-y-2 mb-3">
                    {adaptations.map((adaptation, idx) => (
                        <Adaptation key={idx} {...adaptation} />
                    ))}
                </div>
            )}

            {/* Recovery Metrics */}
            {showDetails && (
                <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                    <MetricRow
                        label="Recovery Score"
                        value={`${recoveryScore}%`}
                        status={state}
                    />
                    {hrv && (
                        <MetricRow
                            label="HRV (RMSSD)"
                            value={`${hrv}ms`}
                            subtext={
                                hrvDeviation !== null
                                    ? `${hrvDeviation > 0 ? '+' : ''}${hrvDeviation}% von Baseline`
                                    : null
                            }
                            status={hrvDeviation > -10 ? 'optimal' : hrvDeviation > -20 ? 'moderate' : 'low'}
                        />
                    )}

                    {/* Explanation */}
                    <div className="mt-3 bg-slate-900/50 rounded-lg p-3">
                        <p className="text-slate-400 text-xs leading-relaxed">
                            <strong className="text-slate-300">Warum passt sich dein Plan an?</strong><br />
                            ExtensioVitae analysiert täglich deine Recovery-Metriken (HRV, Schlafqualität, Ruhepuls).
                            Bei niedriger Recovery optimieren wir automatisch dein Protokoll, um Übertraining zu vermeiden
                            und Regeneration zu priorisieren.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function Adaptation({ from, to, reason }) {
    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-400 text-sm line-through">{from}</span>
                <span className="text-slate-500">→</span>
                <span className="text-white text-sm font-medium">{to}</span>
            </div>
            {reason && (
                <p className="text-slate-400 text-xs">{reason}</p>
            )}
        </div>
    );
}

function MetricRow({ label, value, subtext, status }) {
    const statusColors = {
        optimal: 'text-emerald-400',
        moderate: 'text-amber-400',
        low: 'text-red-400'
    };

    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <div className="text-right">
                <span className={`font-medium ${statusColors[status] || 'text-white'}`}>
                    {value}
                </span>
                {subtext && (
                    <p className="text-slate-500 text-xs">{subtext}</p>
                )}
            </div>
        </div>
    );
}
