/**
 * Features Page - Hidden Roadmap
 * 
 * Shows all available and upcoming features in ExtensioVitae style.
 * Hidden page at /features for internal use.
 */

import React from 'react';
import { Link } from 'react-router-dom';

// Current Features (Live)
const LIVE_FEATURES = [
    {
        id: 'personalized-plan',
        icon: '📋',
        title: '30-Tage Longevity Blueprint',
        description: 'Dein personalisierter Plan basierend auf wissenschaftlichen Erkenntnissen, erstellt in unter 3 Minuten.',
        category: 'core',
        pillar: 'Execution'
    },
    {
        id: 'emergency-modes',
        icon: '🚨',
        title: 'Emergency Mode Selector',
        description: 'Travel, Sick, Detox, Deep Work – ein Tipp und dein gesamtes Protokoll passt sich an.',
        category: 'context',
        pillar: 'Context Awareness'
    },
    {
        id: 'protocol-packs',
        icon: '📦',
        title: 'One-Tap Protocol Packs',
        description: 'Jet Lag Killer, Deep Work Stack, Immune Shield – vorkonfigurierte Protokolle für häufige Szenarien.',
        category: 'context',
        pillar: 'Execution'
    },
    {
        id: 'modular-system',
        icon: '🧩',
        title: 'Modulares Tracking System',
        description: 'Aktiviere einzelne Longevity-Module wie Fasten, Schlaf-Protokoll oder Stress Reset.',
        category: 'tracking',
        pillar: 'Personalization'
    },
    {
        id: 'longevity-score',
        icon: '📊',
        title: 'Longevity Score',
        description: 'Dein persönlicher Score basierend auf aktuellen Gesundheitsdaten und Lebensstil.',
        category: 'analytics',
        pillar: 'Motivation'
    },
    {
        id: 'circadian-widget',
        icon: '🌅',
        title: 'Circadian Intelligence',
        description: 'Biologischer Rhythmus-Tracker mit Solar-Timing und aktiven Fenstern.',
        category: 'context',
        pillar: 'Context Awareness'
    },
    {
        id: 'task-dashboard',
        icon: '✅',
        title: 'Unified Dashboard',
        description: 'Deine täglichen Aufgaben, Module und Fortschritte – alles auf einen Blick.',
        category: 'core',
        pillar: 'Execution'
    },
    {
        id: 'readiness-system',
        icon: '💪',
        title: 'Readiness Score',
        description: 'Automatische Anpassung der Protokollintensität basierend auf deinem aktuellen Zustand.',
        category: 'intelligence',
        pillar: 'Context Awareness'
    },
    {
        id: 'whatsapp-integration',
        icon: '💬',
        title: 'WhatsApp Integration',
        description: 'Lass dir deinen Plan und Erinnerungen direkt auf WhatsApp senden.',
        category: 'delivery',
        pillar: 'Execution'
    },
    {
        id: 'health-profile',
        icon: '❤️',
        title: 'Gesundheitsprofil',
        description: 'Speichere deine Gesundheitsdaten für optimierte Planempfehlungen.',
        category: 'data',
        pillar: 'Personalization'
    },
    {
        id: 'blood-check-ocr',
        icon: '🩸',
        title: 'Blood Check OCR',
        description: 'Lade deine Laborergebnisse hoch – KI erkennt Biomarker und empfiehlt Anpassungen.',
        category: 'intelligence',
        pillar: 'Biological Truth'
    },
    {
        id: 'melatonin-guard',
        icon: '🌙',
        title: 'Melatonin Guard',
        description: 'Automatischer Nacht-Modus ab 21:00 Uhr für besseren Schlaf.',
        category: 'context',
        pillar: 'Context Awareness'
    },
    {
        id: 'biological-supplies',
        icon: '🔬',
        title: 'Biological Supplies Widget',
        description: 'Medical Lab UI für Supplement-Inventar mit prädiktiver Depletion und Smart Refill.',
        category: 'fulfillment',
        pillar: 'Execution Primacy'
    },
    {
        id: 'morning-bio-check',
        icon: '🧬',
        title: 'Morning Bio-Check',
        description: '10-Sekunden Selbst-Assessment – Schlaf, Mental Energy, Physical Readiness.',
        category: 'intelligence',
        pillar: 'Biological Truth'
    },
    {
        id: 'concierge-card',
        icon: '🎯',
        title: 'Concierge Card',
        description: 'Priority Inbox für proaktive Protokoll-Vorschläge vom Predictive Context Engine.',
        category: 'intelligence',
        pillar: 'Zero Cognitive Load'
    },
    {
        id: 'predictive-engine',
        icon: '🔮',
        title: 'Predictive Context Engine',
        description: 'Erkennt Flüge, Focus Blocks und Late-Night Events automatisch aus dem Kalender.',
        category: 'intelligence',
        pillar: 'Zero Cognitive Load'
    },
    {
        id: 'progress-analytics',
        icon: '📈',
        title: 'Progress Analytics',
        description: 'Streak-Tracking, Achievements und Pillar-Breakdown für deine Longevity-Reise.',
        category: 'analytics',
        pillar: 'Motivation'
    },
    {
        id: 'life-in-weeks',
        icon: '⏳',
        title: 'Life in Weeks',
        description: 'Visualisierung deiner Lebenswochen – Memento Mori als Inspiration.',
        category: 'analytics',
        pillar: 'Motivation'
    }
];


// Upcoming Features
const UPCOMING_FEATURES = [
    {
        id: 'calendar-api',
        icon: '📅',
        title: 'Calendar Auto-Detection',
        description: 'Google/Apple Kalender-Sync erkennt Flüge, Meetings und aktiviert automatisch den passenden Modus.',
        category: 'intelligence',
        pillar: 'Zero Cognitive Load',
        eta: 'Februar 2026',
        priority: 'critical'
    },
    {
        id: 'circadian-light',
        icon: '☀️',
        title: 'Circadian Light Protocol',
        description: 'Automatische Lichtexpositions-Empfehlungen basierend auf Aufwachzeit und Standort.',
        category: 'context',
        pillar: 'Biological Truth',
        eta: 'März 2026',
        priority: 'high'
    },
    {
        id: 'supplement-timing',
        icon: '💊',
        title: 'Supplement Timing Optimizer',
        description: 'Personalisierter Zeitplan für Supplements basierend auf Mahlzeiten und Aufwachzeit.',
        category: 'execution',
        pillar: 'Execution Primacy',
        eta: 'März 2026',
        priority: 'high'
    },
    {
        id: 'oura-integration',
        icon: '💍',
        title: 'Oura Ring Integration',
        description: 'Direkte Verbindung zu Oura für HRV, Schlafphasen und automatische Protokollanpassung.',
        category: 'intelligence',
        pillar: 'Silent Truth',
        eta: 'Mai 2026',
        priority: 'medium'
    },
    {
        id: 'whoop-integration',
        icon: '⌚',
        title: 'Whoop & Apple Health',
        description: 'Multi-Device Fusion für einen einheitlichen Readiness Score.',
        category: 'intelligence',
        pillar: 'Silent Truth',
        eta: 'Juli 2026',
        priority: 'medium'
    },
    {
        id: 'protocol-swap',
        icon: '🔄',
        title: 'Auto-Swap Engine',
        description: 'HRV-getriggerte Protokoll-Substitution: HIIT → Yoga Nidra bei niedrigem Readiness Score.',
        category: 'intelligence',
        pillar: 'Context Sovereignty',
        eta: 'Juni 2026',
        priority: 'high'
    },
    {
        id: 'fasting-manager',
        icon: '⏰',
        title: 'Fasting Window Manager',
        description: 'Automatische Essenszeit-Berechnung basierend auf Kalender und Training.',
        category: 'execution',
        pillar: 'Context Awareness',
        eta: 'April 2026',
        priority: 'medium'
    },
    {
        id: 'lab-parser',
        icon: '🧬',
        title: 'Lab Result Parser (Full)',
        description: 'Vollständige Laborwert-Analyse mit Deficiency Mapping und Stack-Empfehlungen.',
        category: 'intelligence',
        pillar: 'Biological Truth',
        eta: 'September 2026',
        priority: 'medium'
    },
    {
        id: 'predictive-fulfillment',
        icon: '📬',
        title: 'Predictive Reorder Engine',
        description: 'Supplements werden automatisch vor Verbrauch nachbestellt – auch zum Hotel auf Reisen.',
        category: 'fulfillment',
        pillar: 'Execution Primacy',
        eta: '2027',
        priority: 'future'
    },
    {
        id: 'one-click-fulfillment',
        icon: '🚚',
        title: 'One-Click Fulfillment',
        description: 'Done-For-You Subscription: Personalisierte Stacks direkt zu dir geliefert.',
        category: 'fulfillment',
        pillar: 'Execution Primacy',
        eta: '2027',
        priority: 'future'
    },
    {
        id: 'b2b-wellness',
        icon: '🏢',
        title: 'B2B Executive Wellness',
        description: 'ExtensioVitae als Premium-Benefit für C-Level Executives.',
        category: 'business',
        pillar: 'Scaling',
        eta: 'Q4 2026',
        priority: 'low'
    }
];

// Category colors
const CATEGORY_COLORS = {
    core: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    context: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
    tracking: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
    analytics: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    intelligence: 'from-violet-500/20 to-pink-500/20 border-violet-500/30',
    delivery: 'from-green-500/20 to-teal-500/20 border-green-500/30',
    data: 'from-rose-500/20 to-red-500/20 border-rose-500/30',
    execution: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
    fulfillment: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    business: 'from-slate-500/20 to-gray-500/20 border-slate-500/30'
};

// Priority badges
const PRIORITY_BADGES = {
    critical: { label: 'Kritisch', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
    high: { label: 'Hoch', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    medium: { label: 'Mittel', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    low: { label: 'Niedrig', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    future: { label: 'Zukunft', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
};

function FeatureCard({ feature, isUpcoming = false }) {
    const colorClass = CATEGORY_COLORS[feature.category] || CATEGORY_COLORS.core;
    const priorityBadge = isUpcoming ? PRIORITY_BADGES[feature.priority] : null;

    return (
        <div className={`
      relative bg-gradient-to-br ${colorClass} border rounded-2xl p-5 
      transition-all duration-300 group
      ${isUpcoming ? 'opacity-60 grayscale hover:opacity-80 hover:grayscale-0' : 'hover:scale-[1.02] hover:shadow-lg'}
    `}>
            {/* Status Badge */}
            {!isUpcoming && (
                <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[10px] font-bold text-green-400 uppercase">
                        Live
                    </span>
                </div>
            )}

            {/* Priority & ETA for upcoming */}
            {isUpcoming && (
                <div className="absolute top-3 right-3 flex gap-2">
                    {priorityBadge && (
                        <span className={`px-2 py-1 border rounded-full text-[10px] font-bold uppercase ${priorityBadge.class}`}>
                            {priorityBadge.label}
                        </span>
                    )}
                </div>
            )}

            {/* Icon & Title */}
            <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-2xl flex-shrink-0">
                    {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight">
                        {feature.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {feature.pillar}
                    </span>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {feature.description}
            </p>

            {/* ETA for upcoming */}
            {isUpcoming && feature.eta && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Geplant: <strong className="text-slate-300">{feature.eta}</strong></span>
                </div>
            )}
        </div>
    );
}

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/dashboard" className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-2">
                        ← Zurück zum Dashboard
                    </Link>
                    <div className="text-xs text-slate-500">
                        Interne Übersicht
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Page Title */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-3">
                        ExtensioVitae Features
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Dein autonomes biologisches Betriebssystem – aktuelle Features und kommende Meilensteine.
                    </p>
                </div>

                {/* Vision Quote */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 mb-12 text-center">
                    <p className="text-amber-200 text-lg italic">
                        „ExtensioVitae transformiert statisches Bio-Hacking in ein autonomes OS, das High-Performer-Biologie in Echtzeit managt – ohne kognitiven Aufwand."
                    </p>
                    <p className="text-amber-500/60 text-sm mt-2">— Vision Kernel v2.0</p>
                </div>

                {/* Live Features Section */}
                <section className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <h2 className="text-2xl font-bold text-white">
                            Live Features
                        </h2>
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
                            {LIVE_FEATURES.length} Features
                        </span>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {LIVE_FEATURES.map(feature => (
                            <FeatureCard key={feature.id} feature={feature} isUpcoming={false} />
                        ))}
                    </div>
                </section>

                {/* Upcoming Features Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-amber-500 rounded-full" />
                        <h2 className="text-2xl font-bold text-white">
                            Kommende Features
                        </h2>
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
                            {UPCOMING_FEATURES.length} geplant
                        </span>
                    </div>

                    <p className="text-slate-400 text-sm mb-6">
                        Diese Features sind in Entwicklung oder Planung. Zeitangaben sind geschätzt und können sich ändern.
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {UPCOMING_FEATURES.map(feature => (
                            <FeatureCard key={feature.id} feature={feature} isUpcoming={true} />
                        ))}
                    </div>
                </section>

                {/* Horizon Timeline */}
                <section className="mt-16">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        Three Horizons Roadmap
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Horizon 1 */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">🎯</span>
                                <div>
                                    <h3 className="font-bold text-white">Horizon 1</h3>
                                    <p className="text-xs text-slate-500">Monate 0-6</p>
                                </div>
                            </div>
                            <h4 className="text-amber-400 font-medium mb-2">Context Awareness</h4>
                            <p className="text-sm text-slate-400">
                                Das System reagiert auf deinen biologischen Zustand: Reisen, Krankheit, Fokus-Phasen.
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 text-xs text-green-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    In Arbeit
                                </div>
                            </div>
                        </div>

                        {/* Horizon 2 */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 opacity-70">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">🔬</span>
                                <div>
                                    <h3 className="font-bold text-white">Horizon 2</h3>
                                    <p className="text-xs text-slate-500">Monate 6-12</p>
                                </div>
                            </div>
                            <h4 className="text-amber-400 font-medium mb-2">Silent Truth</h4>
                            <p className="text-sm text-slate-400">
                                Zero-Input Layer: Wearable-Daten ersetzen subjektive Eingaben. Das System weiß es besser.
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-2 h-2 bg-slate-600 rounded-full" />
                                    Geplant: Mai 2026
                                </div>
                            </div>
                        </div>

                        {/* Horizon 3 */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 opacity-50">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">🚀</span>
                                <div>
                                    <h3 className="font-bold text-white">Horizon 3</h3>
                                    <p className="text-xs text-slate-500">Monate 12-24</p>
                                </div>
                            </div>
                            <h4 className="text-amber-400 font-medium mb-2">Concierge Loop</h4>
                            <p className="text-sm text-slate-400">
                                One-Click Fulfillment: Supplements und Stacks werden automatisch geliefert.
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-2 h-2 bg-slate-600 rounded-full" />
                                    Geplant: 2027
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Note */}
                <div className="mt-16 text-center text-xs text-slate-600">
                    <p>ExtensioVitae v0.3.2 • Vision Kernel v2.0</p>
                    <p className="mt-1">Diese Seite ist nur für interne Zwecke.</p>
                </div>
            </main>
        </div>
    );
}
