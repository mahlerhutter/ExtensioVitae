import React from 'react';

export default function PillarsExplanationModal({ isOpen, onClose, needs }) {
    if (!isOpen) return null;

    const pillarsInfo = [
        {
            id: 'sleep_recovery',
            name: 'Schlaf & Erholung',
            icon: '🌙',
            color: 'bg-indigo-500',
            description: 'Optimale Schlafqualität ist die Grundlage für Regeneration, Hormonbalance und kognitive Leistung. Hier geht es um Schlafdauer, -qualität und Erholungsroutinen.',
            science: 'Studien zeigen: 7-8h Schlaf reduzieren Alzheimer-Risiko um 30% und verbessern Gedächtniskonsolidierung.'
        },
        {
            id: 'circadian_rhythm',
            name: 'Circadianer Rhythmus',
            icon: '☀️',
            color: 'bg-amber-500',
            description: 'Dein innerer Tagesrhythmus steuert Energie, Hormone und Stoffwechsel. Morgenlicht, Koffein-Timing und Mahlzeiten-Rhythmus sind die Hebel.',
            science: 'Morgens 2-10 Min Tageslicht erhöht Cortisol-Awakening-Response um 50% und verbessert nächtliches Melatonin.'
        },
        {
            id: 'mental_resilience',
            name: 'Mentale Resilienz',
            icon: '🧠',
            color: 'bg-purple-500',
            description: 'Stressmanagement durch Atemtechniken, Mindfulness und Downregulation. Chronischer Stress verkürzt Telomere und beschleunigt Alterung.',
            science: 'Box Breathing senkt Cortisol um 23% und aktiviert den Parasympathikus innerhalb von 4 Minuten.'
        },
        {
            id: 'nutrition_metabolism',
            name: 'Ernährung & Metabolismus',
            icon: '🥗',
            color: 'bg-orange-500',
            description: 'Protein-Timing, Blutzucker-Kontrolle und metabolische Flexibilität. Was, wann und wie du isst beeinflusst Energie und Langlebigkeit.',
            science: 'Protein-First bei Mahlzeiten reduziert Blutzucker-Spikes um 40% und erhöht Sättigung.'
        },
        {
            id: 'movement_muscle',
            name: 'Bewegung & Muskulatur',
            icon: '💪',
            color: 'bg-emerald-500',
            description: 'Krafttraining, NEAT (Alltagsbewegung) und Zone-2-Cardio. Muskelmasse ist der stärkste Prädiktor für gesundes Altern.',
            science: 'Jedes Kilo Muskelmasse senkt das Mortalitätsrisiko um 3%. Schon 8.000 Schritte/Tag reduzieren Sterblichkeit um 51%.'
        },
        {
            id: 'supplements',
            name: 'Supplements',
            icon: '💊',
            color: 'bg-cyan-500',
            description: 'Gezielte Ergänzung von Vitamin D, Omega-3, Magnesium etc. wo nötig. Supplements sind Optimierung, nicht Ersatz.',
            science: 'Vitamin D3 (2000-4000 IU) bei Mangel verbessert Immunfunktion und reduziert Infektrisiko um 12%.'
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Die 6 Säulen der Langlebigkeit</h2>
                        <p className="text-slate-400 text-sm mt-1">Wissenschaftsbasierte Hebel für ein längeres, gesünderes Leben</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
                    {pillarsInfo.map((pillar) => {
                        const needScore = needs ? Math.round(needs[pillar.id] || 0) : null;
                        return (
                            <div key={pillar.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${pillar.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                                        {pillar.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                            <h3 className="text-white font-semibold">{pillar.name}</h3>
                                            {needScore !== null && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 text-xs">Dein Bedarf:</span>
                                                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${pillar.color} transition-all`}
                                                            style={{ width: `${needScore}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-400 w-8">{needScore}%</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-slate-300 text-sm mb-2">{pillar.description}</p>
                                        <p className="text-slate-500 text-xs italic">📊 {pillar.science}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-5 border-t border-slate-700 flex justify-end">
                    <button onClick={onClose} className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Verstanden
                    </button>
                </div>
            </div>
        </div>
    );
}
