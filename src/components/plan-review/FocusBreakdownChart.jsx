import React from 'react';

/**
 * Focus Breakdown Chart
 * Visual representation of pillar distribution
 */
export default function FocusBreakdownChart({ focusBreakdown }) {
    if (!focusBreakdown) return null;

    const pillarConfig = {
        movement: {
            label: 'Bewegung',
            color: 'bg-orange-500',
            textColor: 'text-orange-400',
            icon: '🏃',
        },
        nutrition: {
            label: 'Ernährung',
            color: 'bg-green-500',
            textColor: 'text-green-400',
            icon: '🥗',
        },
        sleep: {
            label: 'Schlaf',
            color: 'bg-blue-500',
            textColor: 'text-blue-400',
            icon: '😴',
        },
        stress: {
            label: 'Stress',
            color: 'bg-teal-500',
            textColor: 'text-teal-400',
            icon: '🧘',
        },
        cognitive: {
            label: 'Kognition',
            color: 'bg-yellow-500',
            textColor: 'text-yellow-400',
            icon: '🧠',
        },
        social: {
            label: 'Soziales',
            color: 'bg-pink-500',
            textColor: 'text-pink-400',
            icon: '🤝',
        },
    };

    // Filter out pillars with 0%
    const activePillars = Object.entries(focusBreakdown)
        .filter(([, percentage]) => percentage > 0)
        .sort(([, a], [, b]) => b - a);

    return (
        <div className="space-y-4">
            {/* Horizontal Stacked Bar */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                <div className="flex h-12 rounded-lg overflow-hidden">
                    {activePillars.map(([pillar, percentage]) => {
                        const config = pillarConfig[pillar];
                        if (!config) return null;

                        return (
                            <div
                                key={pillar}
                                className={`${config.color} flex items-center justify-center text-white font-bold text-sm transition-all hover:opacity-80 cursor-pointer group relative`}
                                style={{ width: `${percentage}%` }}
                                title={`${config.label}: ${percentage}%`}
                            >
                                {percentage >= 10 && (
                                    <span className="drop-shadow-lg">
                                        {percentage}%
                                    </span>
                                )}
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl border border-slate-700 z-10">
                                    {config.icon} {config.label}: {percentage}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activePillars.map(([pillar, percentage]) => {
                    const config = pillarConfig[pillar];
                    if (!config) return null;

                    return (
                        <div
                            key={pillar}
                            className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{config.icon}</span>
                                <span className="text-white font-medium text-sm">
                                    {config.label}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-bold ${config.textColor}`}>
                                    {percentage}%
                                </span>
                                <span className="text-slate-500 text-xs">
                                    deiner Zeit
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Insight */}
            {activePillars.length > 0 && (
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800">
                    <p className="text-slate-400 text-sm">
                        <span className="text-amber-400 font-semibold">Hauptfokus:</span>{' '}
                        {pillarConfig[activePillars[0][0]]?.icon}{' '}
                        {pillarConfig[activePillars[0][0]]?.label} ({activePillars[0][1]}%)
                        {activePillars.length > 1 && (
                            <>
                                {' '}und {pillarConfig[activePillars[1][0]]?.icon}{' '}
                                {pillarConfig[activePillars[1][0]]?.label} ({activePillars[1][1]}%)
                            </>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}
