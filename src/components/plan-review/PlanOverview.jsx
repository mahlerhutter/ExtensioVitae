import React from 'react';

/**
 * Plan Overview Hero Card
 * Displays high-level summary of the plan
 */
export default function PlanOverview({ overview }) {
    if (!overview) return null;

    const {
        title,
        tagline,
        projected_impact,
        daily_commitment_avg,
        daily_commitment_range,
        difficulty,
    } = overview;

    // Difficulty styling
    const difficultyConfig = {
        gentle: {
            label: 'Sanft',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/20',
            icon: '🌸',
        },
        moderate: {
            label: 'Moderat',
            color: 'text-amber-400',
            bg: 'bg-amber-500/20',
            icon: '⚡',
        },
        intense: {
            label: 'Intensiv',
            color: 'text-red-400',
            bg: 'bg-red-500/20',
            icon: '🔥',
        },
    };

    const diffConfig = difficultyConfig[difficulty] || difficultyConfig.moderate;

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-amber-500/30 p-8 shadow-xl">
            {/* Title Section */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                    {title || 'Dein Personalisierter Longevity Plan'}
                </h2>
                <p className="text-amber-400 text-lg font-medium">
                    {tagline || 'Dein Weg zu mehr Gesundheit'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Daily Commitment */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">⏱️</span>
                        <div>
                            <p className="text-slate-400 text-xs">Täglicher Aufwand</p>
                            <p className="text-white text-2xl font-bold">
                                ~{daily_commitment_avg} Min
                            </p>
                        </div>
                    </div>
                    {daily_commitment_range && (
                        <p className="text-slate-500 text-xs mt-2">
                            Bereich: {daily_commitment_range[0]}-{daily_commitment_range[1]} Min
                        </p>
                    )}
                </div>

                {/* Difficulty */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{diffConfig.icon}</span>
                        <div>
                            <p className="text-slate-400 text-xs">Schwierigkeit</p>
                            <p className={`text-2xl font-bold ${diffConfig.color}`}>
                                {diffConfig.label}
                            </p>
                        </div>
                    </div>
                    <div className={`${diffConfig.bg} rounded px-2 py-1 text-xs ${diffConfig.color} font-medium inline-block mt-2`}>
                        Für dich angepasst
                    </div>
                </div>

                {/* Projected Impact */}
                {projected_impact && (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">📈</span>
                            <div>
                                <p className="text-slate-400 text-xs">Geschätzte Wirkung</p>
                                <p className="text-emerald-400 text-2xl font-bold">
                                    {projected_impact}
                                </p>
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">
                            Gesunde Lebensjahre
                        </p>
                    </div>
                )}
            </div>

            {/* Motivational Message */}
            <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-slate-300 text-center italic">
                    "Kleine, konsequente Schritte führen zu großen Veränderungen" 🌟
                </p>
            </div>
        </div>
    );
}
