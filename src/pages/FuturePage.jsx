import React from 'react';

/**
 * FuturePage - Hidden page for presenting the ExtensioVitae vision to close users
 * Access: /future (not linked anywhere, shared with trusted users only)
 */
export default function FuturePage() {
    const horizons = [
        {
            number: 1,
            title: 'Context Awareness',
            subtitle: 'The Waze Effect',
            timeline: 'Months 0-6',
            status: 'IN PROGRESS',
            color: 'from-emerald-500 to-teal-500',
            description: 'Dynamische Anpassung an dein Leben. Reise, Krankheit, Deep Work – dein Protokoll passt sich an.',
            features: [
                { name: 'Emergency Modes', desc: '4 Modi: Travel, Sick, Detox, Deep Work – ein Tap', icon: '🚀' },
                { name: 'Calendar Sync', desc: 'Flug erkannt → Travel Mode aktiviert sich automatisch', icon: '📅' },
                { name: 'Smart Suppression', desc: 'Sick Mode = 72h Ruhe, keine Notifications', icon: '🔕' },
            ],
            metrics: ['60% Mode-Adoption in 30 Tagen', 'Aktivierung < 5 Sekunden', '+15% D30 Retention'],
        },
        {
            number: 2,
            title: 'The Silent Truth',
            subtitle: 'Zero-Input Layer',
            timeline: 'Months 6-12',
            status: 'PLANNING',
            color: 'from-blue-500 to-indigo-500',
            description: 'Deine Biologie spricht. Wir hören zu. Keine manuelle Eingabe – nur objektive Wahrheit.',
            features: [
                { name: 'Morning Readiness', desc: 'HRV + Sleep → Score 0-100 beim Aufwachen', icon: '⚡' },
                { name: 'Auto-Swap Engine', desc: 'Readiness < 50? HIIT wird zu Yoga Nidra', icon: '🔄' },
                { name: 'Invisible Sync', desc: 'OAuth einmal → perpetueller Background-Sync', icon: '👻' },
            ],
            metrics: ['80% Wearable-Verbindung in 14 Tagen', '>75% hilfreiche Swaps', 'Zero manuelle Eingabe'],
        },
        {
            number: 3,
            title: 'The Concierge Loop',
            subtitle: 'The Real Business',
            timeline: 'Months 12-24',
            status: 'STRATEGIC',
            color: 'from-purple-500 to-pink-500',
            description: 'Vom Wissen zum Handeln. Wir empfehlen nicht nur – wir liefern.',
            features: [
                { name: 'Lab Import', desc: 'Foto von Laborwerten → Defizite automatisch erkannt', icon: '🧪' },
                { name: 'Stack Generation', desc: 'HRV + Lab + Context → personalisierter Supplement-Stack', icon: '💊' },
                { name: 'One-Click Fulfillment', desc: 'Dein Stack kommt automatisch – jeden Monat', icon: '📦' },
            ],
            metrics: ['30% Fulfillment-Conversion', '€4,000+ LTV (24 Monate)', 'NPS > 60'],
        },
    ];

    const axioms = [
        { id: 'AX-1', name: 'Zero Cognitive Load', metric: '< 3 min/Tag', icon: '🧠' },
        { id: 'AX-2', name: 'Context Sovereignty', metric: '> 85% Accuracy', icon: '🎯' },
        { id: 'AX-3', name: 'Execution Primacy', metric: '> 70% Fulfillment', icon: '✅' },
        { id: 'AX-4', name: 'Discretion Protocol', metric: 'Zero Social', icon: '🤫' },
        { id: 'AX-5', name: 'Biological Truth', metric: '< 10% Manual Input', icon: '🔬' },
    ];

    const quickWins = [
        { name: 'Protocol Packs', score: 25, time: '2-3 Wo', desc: 'Vorgefertigte Bundles für häufige Szenarien' },
        { name: 'Circadian Light', score: 20, time: '1-2 Wo', desc: 'Automatische Licht-Exposure-Empfehlungen' },
        { name: 'Supplement Timing', score: 20, time: '3-4 Wo', desc: 'Wann welches Supplement nehmen' },
        { name: 'Fasting Window', score: 16, time: '2-3 Wo', desc: 'Automatische Essensfenster-Berechnung' },
        { name: 'Recovery Score', score: 15, time: '3-4 Wo', desc: 'Morning Readiness ohne Wearable' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-24 px-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.15),transparent_70%)]"></div>
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm mb-8">
                        <span className="animate-pulse">●</span>
                        Exklusiver Einblick für enge Partner
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent">
                        Die Zukunft von ExtensioVitae
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Vom Content-Provider zum{' '}
                        <span className="text-amber-400 font-semibold">Biologischen Family Office</span>
                    </p>

                    <div className="mt-12 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 max-w-2xl mx-auto">
                        <p className="text-lg italic text-slate-300">
                            "ExtensioVitae transformiert statisches Bio-Hacking in ein autonomes OS,
                            das High-Performer-Biologie in Echtzeit managed – ohne kognitiven Aufwand."
                        </p>
                    </div>
                </div>
            </section>

            {/* Core Axioms */}
            <section className="py-16 px-6 border-t border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4">Core Axioms</h2>
                    <p className="text-slate-400 text-center mb-12">Die 5 unveränderlichen Prinzipien, die jede Entscheidung leiten</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {axioms.map((axiom) => (
                            <div
                                key={axiom.id}
                                className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors text-center"
                            >
                                <div className="text-3xl mb-2">{axiom.icon}</div>
                                <div className="text-amber-400 text-xs font-mono mb-1">{axiom.id}</div>
                                <div className="text-sm font-medium text-white mb-2">{axiom.name}</div>
                                <div className="text-xs text-slate-400">{axiom.metric}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Three Horizons */}
            <section className="py-20 px-6 border-t border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4">Die Drei Horizonte</h2>
                    <p className="text-slate-400 text-center mb-16">Unser strategischer Pfad von heute zum Biologischen Family Office</p>

                    <div className="space-y-12">
                        {horizons.map((horizon, idx) => (
                            <div
                                key={horizon.number}
                                className="relative group"
                            >
                                {/* Connection Line */}
                                {idx < horizons.length - 1 && (
                                    <div className="absolute left-12 top-full h-12 w-0.5 bg-gradient-to-b from-slate-600 to-transparent"></div>
                                )}

                                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden hover:border-slate-500 transition-colors">
                                    {/* Header */}
                                    <div className={`bg-gradient-to-r ${horizon.color} p-6`}>
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
                                                    {horizon.number}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold">{horizon.title}</h3>
                                                    <p className="text-white/80">{horizon.subtitle}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                                    {horizon.timeline}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${horizon.status === 'IN PROGRESS' ? 'bg-green-500/30 text-green-200' :
                                                        horizon.status === 'PLANNING' ? 'bg-blue-500/30 text-blue-200' :
                                                            'bg-purple-500/30 text-purple-200'
                                                    }`}>
                                                    {horizon.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <p className="text-slate-300 text-lg mb-6">{horizon.description}</p>

                                        {/* Features */}
                                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                                            {horizon.features.map((feature) => (
                                                <div
                                                    key={feature.name}
                                                    className="p-4 bg-slate-900/50 rounded-xl border border-slate-700"
                                                >
                                                    <div className="text-2xl mb-2">{feature.icon}</div>
                                                    <h4 className="font-semibold text-white mb-1">{feature.name}</h4>
                                                    <p className="text-sm text-slate-400">{feature.desc}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Metrics */}
                                        <div className="flex flex-wrap gap-2">
                                            {horizon.metrics.map((metric, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-slate-900 rounded-full text-xs text-slate-400 border border-slate-700"
                                                >
                                                    ✓ {metric}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Wins - What's Next */}
            <section className="py-20 px-6 border-t border-slate-800 bg-slate-900/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4">Quick Wins — Was kommt als Nächstes</h2>
                    <p className="text-slate-400 text-center mb-12">Die Module mit dem höchsten ROI, gerankt nach Einfachheit × Impact</p>

                    <div className="grid md:grid-cols-5 gap-4">
                        {quickWins.map((module, idx) => (
                            <div
                                key={module.name}
                                className="relative p-5 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all hover:-translate-y-1"
                            >
                                {/* Rank Badge */}
                                <div className="absolute -top-3 -left-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/30">
                                    {idx + 1}
                                </div>

                                {/* Score */}
                                <div className="text-right mb-3">
                                    <span className="text-2xl font-bold text-emerald-400">{module.score}</span>
                                    <span className="text-xs text-slate-500">/25</span>
                                </div>

                                <h4 className="font-semibold text-white mb-2">{module.name}</h4>
                                <p className="text-xs text-slate-400 mb-3">{module.desc}</p>

                                <div className="text-xs text-slate-500">
                                    ⏱ {module.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Trojan Horse */}
            <section className="py-20 px-6 border-t border-slate-800">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm mb-8">
                        🐴 Strategic Insight
                    </div>

                    <h2 className="text-3xl font-bold mb-6">The Trojan Horse</h2>
                    <p className="text-slate-300 text-lg mb-8">
                        Calendar Health Sync sieht aus wie eine Convenience-Feature.
                        In Wirklichkeit baut es einen <span className="text-amber-400">12-Monate Daten-Moat</span> für predictive Fulfillment.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="text-2xl mb-3">📅</div>
                            <h4 className="font-semibold text-white mb-2">Surface Value</h4>
                            <p className="text-sm text-slate-400">
                                "Wir erkennen deinen Flug und aktivieren Travel Mode automatisch."
                            </p>
                        </div>
                        <div className="p-6 bg-amber-500/10 rounded-xl border border-amber-500/30">
                            <div className="text-2xl mb-3">📊</div>
                            <h4 className="font-semibold text-amber-400 mb-2">Hidden Value</h4>
                            <p className="text-sm text-slate-300">
                                Behavioral patterns → Predictive fulfillment timing model → Pre-shipment zu deinem Hotel.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="text-2xl mb-3">🏰</div>
                            <h4 className="font-semibold text-white mb-2">Competitive Moat</h4>
                            <p className="text-sm text-slate-400">
                                12+ Monate longitudinale Daten. Wearable-Korrelation. Nicht replizierbar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strategic Constraints */}
            <section className="py-20 px-6 border-t border-slate-800 bg-slate-900/50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Was wir NICHT bauen</h2>

                    <div className="space-y-4">
                        {[
                            { constraint: 'Kein AI Chatbot als Kern', reason: 'Conversational Friction violiert AX-1' },
                            { constraint: 'Keine Social/Community Feeds', reason: 'Violiert AX-4 (Discretion Protocol)' },
                            { constraint: 'Kein Content Hub/Magazine', reason: 'Information ≠ Execution, violiert AX-3' },
                        ].map((item) => (
                            <div
                                key={item.constraint}
                                className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl"
                            >
                                <div className="text-2xl">❌</div>
                                <div>
                                    <div className="font-medium text-white">{item.constraint}</div>
                                    <div className="text-sm text-slate-400">{item.reason}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-800 text-center">
                <div className="text-slate-500 text-sm">
                    <p className="mb-2">🔒 Dieses Dokument ist vertraulich und nur für ausgewählte Partner bestimmt.</p>
                    <p>ExtensioVitae Vision Kernel v2.0 | Last Update: 2026-02-03</p>
                </div>
            </footer>
        </div>
    );
}
