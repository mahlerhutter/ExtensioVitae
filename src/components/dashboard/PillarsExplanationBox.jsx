import React, { useState } from 'react';

export default function PillarsExplanationBox({ needs }) {
    const [expanded, setExpanded] = useState(false);

    const pillarsInfo = [
        {
            id: 'sleep_recovery',
            name: 'Schlaf & Erholung',
            icon: '🌙',
            color: 'bg-indigo-500',
            shortDesc: 'Regeneration, Hormonbalance, Gehirngesundheit'
        },
        {
            id: 'circadian_rhythm',
            name: 'Circadianer Rhythmus',
            icon: '☀️',
            color: 'bg-amber-500',
            shortDesc: 'Morgenlicht, Koffein-Timing, Tagesrhythmus'
        },
        {
            id: 'mental_resilience',
            name: 'Mentale Resilienz',
            icon: '🧠',
            color: 'bg-purple-500',
            shortDesc: 'Stressmanagement, Atemtechniken, Achtsamkeit'
        },
        {
            id: 'nutrition_metabolism',
            name: 'Ernährung & Metabolismus',
            icon: '🥗',
            color: 'bg-orange-500',
            shortDesc: 'Protein-Timing, Blutzucker-Kontrolle'
        },
        {
            id: 'movement_muscle',
            name: 'Bewegung & Muskulatur',
            icon: '💪',
            color: 'bg-emerald-500',
            shortDesc: 'Krafttraining, NEAT, Zone-2-Cardio'
        },
        {
            id: 'supplements',
            name: 'Supplements',
            icon: '💊',
            color: 'bg-cyan-500',
            shortDesc: 'Vitamin D, Omega-3, Magnesium'
        }
    ];

    // Sort by need score to show most relevant first
    const sortedPillars = [...pillarsInfo].sort((a, b) => {
        const needA = needs?.[a.id] || 0;
        const needB = needs?.[b.id] || 0;
        return needB - needA;
    });

    const displayPillars = expanded ? sortedPillars : sortedPillars.slice(0, 3);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Die 6 Säulen der Langlebigkeit</h3>
                <span className="text-xs text-slate-500">Sortiert nach deinem Bedarf</span>
            </div>

            <div className="space-y-3">
                {displayPillars.map((pillar) => {
                    const needScore = needs ? Math.round(needs[pillar.id] || 0) : 0;
                    return (
                        <div key={pillar.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                            <div className={`w-10 h-10 rounded-lg ${pillar.color} flex items-center justify-center text-lg flex-shrink-0`}>
                                {pillar.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-white text-sm font-medium">{pillar.name}</span>
                                    <span className="text-xs text-slate-400">{needScore}%</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${pillar.color} transition-all`}
                                            style={{ width: `${needScore}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-slate-500 text-xs mt-1 truncate">{pillar.shortDesc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-4 text-center text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
                {expanded ? '↑ Weniger anzeigen' : `↓ Alle 6 Säulen anzeigen`}
            </button>
        </div>
    );
}
