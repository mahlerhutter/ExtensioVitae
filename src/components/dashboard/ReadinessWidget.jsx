/**
 * Readiness Widget (v0.6.0)
 *
 * Displays Daily Readiness Score and System Verdict
 * "Bio-Response" UI for Dashboard
 *
 * Shows:
 * - Readiness Score (0-100)
 * - System Verdict: "Heute ist ein Tag für [X]"
 * - Visual indicator
 * - Trend (optional)
 */

import React, { useState, useEffect } from 'react';
import { getTodayReadiness, getIntensityLevels } from '../../lib/readinessService';
import { logger } from '../../lib/logger';

export default function ReadinessWidget({ userId, compact = false, onCheckInClick }) {
    const [readiness, setReadiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadReadiness() {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getTodayReadiness(userId);
                setReadiness(data);
            } catch (err) {
                logger.error('[ReadinessWidget] Failed to load readiness:', err);
                setError('Failed to load readiness');
            } finally {
                setLoading(false);
            }
        }

        loadReadiness();

        // Refresh every 5 minutes
        const interval = setInterval(loadReadiness, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userId]);

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error || !readiness) {
        // Show check-in prompt
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl p-5 shadow-lg">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 mb-3">
                        <span className="text-2xl">🧬</span>
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">
                        Bio-Check benötigt
                    </h4>
                    <p className="text-slate-400 text-xs mb-4">
                        Erfasse deine biologische Wahrheit
                    </p>
                    <button
                        onClick={onCheckInClick}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all text-sm"
                    >
                        Check-In starten
                    </button>
                </div>
            </div>
        );
    }

    const score = readiness.overall_score || 70;
    const intensity = readiness.recommended_intensity || 'normal';
    const intensityLevels = getIntensityLevels();
    const intensityData = intensityLevels[intensity] || intensityLevels.normal;

    // Determine system verdict
    let verdict = '';
    if (intensity === 'peak' || intensity === 'high') {
        verdict = 'Fokus & Performance';
    } else if (intensity === 'normal') {
        verdict = 'Erhaltung & Balance';
    } else if (intensity === 'light') {
        verdict = 'Sanfte Aktivität';
    } else {
        verdict = 'Regeneration & Ruhe';
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Readiness Status
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{intensityData.icon}</span>
                        <span className="text-white font-semibold text-sm">
                            {intensityData.name_de}
                        </span>
                    </div>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">LIVE</span>
                </div>
            </div>

            {/* Score Display */}
            <div className="px-5 py-6 relative">
                {/* Background Gradient */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        background: `linear-gradient(135deg, ${intensityData.color} 0%, transparent 100%)`
                    }}
                />

                {/* Score Ring */}
                <div className="relative flex items-center justify-center mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-slate-800"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke={intensityData.color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(score / 100) * 326.73} 326.73`}
                            className="transition-all duration-1000"
                        />
                    </svg>

                    {/* Score Number */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white tabular-nums">
                            {score}
                        </span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">
                            / 100
                        </span>
                    </div>
                </div>

                {/* System Verdict */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        System-Urteil
                    </p>
                    <p className="text-white font-semibold text-sm leading-tight">
                        Heute ist ein Tag für:
                    </p>
                    <p className="text-amber-400 font-bold text-base leading-tight mt-1">
                        {verdict}
                    </p>
                </div>
            </div>

            {/* Details */}
            {!compact && (
                <div className="px-5 pb-5 space-y-2 border-t border-slate-800/50 pt-4">
                    <DetailRow
                        label="Strategie"
                        value={intensityData.description_de}
                        icon="🎯"
                    />

                    {/* Refresh Check-In Button */}
                    <button
                        onClick={onCheckInClick}
                        className="w-full mt-3 py-2 px-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-2"
                    >
                        <span>🔄</span>
                        <span>Check-In wiederholen</span>
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Detail Row Component
 */
function DetailRow({ label, value, icon }) {
    return (
        <div className="flex items-start gap-2 text-xs">
            <span className="text-base flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-slate-500 mb-0.5">{label}</p>
                <p className="text-slate-300 leading-tight">{value}</p>
            </div>
        </div>
    );
}
