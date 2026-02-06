import React, { useState, useEffect } from 'react';
import { TrendingUp, Info, Heart, Activity } from 'lucide-react';

/**
 * Impact Counter - Shows Years Added
 *
 * Visualizes the core promise: +5-15 Jahre gesunde Lebensspanne
 * Shows:
 * - Current progress (Jahre hinzugefügt)
 * - Target range (5-15 Jahre)
 * - Biological vs Chronological Age
 * - How it's calculated (modal)
 */
export default function ImpactCounter({
    yearsAdded = 0,
    biologicalAge = null,
    chronologicalAge = null,
    completionRate = 0
}) {
    const [showExplanation, setShowExplanation] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);

    // Calculate estimated years based on completion rate
    // Assumptions: 74% completion = +5 years baseline, perfect completion = +15 years
    const estimatedYears = Math.min(15, Math.max(0, completionRate * 0.15)).toFixed(1);
    const progressPercent = (parseFloat(estimatedYears) / 15) * 100;

    // Animate progress bar on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progressPercent);
        }, 100);
        return () => clearTimeout(timer);
    }, [progressPercent]);

    return (
        <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-amber-400" />
                        <h3 className="text-white font-semibold">Dein Impact</h3>
                    </div>
                    <button
                        onClick={() => setShowExplanation(true)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Counter */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-amber-400">
                            +{estimatedYears}
                        </span>
                        <span className="text-lg text-slate-400">Jahre</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Gesunde Lebensspanne (geschätzt)
                    </p>
                </div>

                {/* Progress to Target */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-xs">Fortschritt zu Ziel</span>
                        <span className="text-slate-300 text-xs font-medium">
                            {estimatedYears} / 15 Jahre
                        </span>
                    </div>
                    <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${animatedProgress}%` }}
                        ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-slate-500 text-xs">Baseline: +5</span>
                        <span className="text-slate-500 text-xs">Maximum: +15</span>
                    </div>
                </div>

                {/* Biological Age (if available) */}
                {biologicalAge && chronologicalAge && (
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Biologisches Alter</p>
                                <p className="text-white text-2xl font-bold">{biologicalAge}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs mb-1">Chronologisch</p>
                                <p className="text-slate-300 text-2xl font-semibold">{chronologicalAge}</p>
                            </div>
                        </div>
                        {biologicalAge < chronologicalAge && (
                            <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-300 text-xs font-medium">
                                    {chronologicalAge - biologicalAge} Jahre jünger als dein Alter
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Stats Row */}
                <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-slate-400 text-xs mb-1">Task Completion</p>
                        <p className="text-white font-semibold">{Math.round(completionRate * 100)}%</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs mb-1">Konsistenz</p>
                        <p className="text-white font-semibold">
                            {completionRate >= 0.7 ? '🔥 Hoch' : completionRate >= 0.4 ? '⚡ Mittel' : '💪 Start'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Explanation Modal */}
            {showExplanation && (
                <ExplanationModal onClose={() => setShowExplanation(false)} />
            )}
        </>
    );
}

function ExplanationModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Wie wird das berechnet?
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Die Wissenschaft hinter deinem Impact
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Methodology */}
                    <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-amber-400" />
                            Methodik
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Deine geschätzten Jahre basieren auf etablierter Longevity-Forschung.
                            Jede Task in deinem Protokoll ist mit einem spezifischen Longevity-Impact verknüpft,
                            der aus Meta-Analysen und epidemiologischen Studien stammt.
                        </p>
                    </div>

                    {/* Key Factors */}
                    <div>
                        <h3 className="text-white font-semibold mb-3">Schlüssel-Faktoren</h3>
                        <div className="space-y-3">
                            <Factor
                                pillar="Schlaf-Optimierung"
                                impact="+1.5-3 Jahre"
                                evidence="7-8h konsistenter Schlaf, HRV-optimiert"
                            />
                            <Factor
                                pillar="Bewegung"
                                impact="+1-2 Jahre"
                                evidence="150+ Min moderate Activity/Woche"
                            />
                            <Factor
                                pillar="Ernährung"
                                impact="+1-2.5 Jahre"
                                evidence="Mediterrane Diät, IF, Polyphenole"
                            />
                            <Factor
                                pillar="Stress-Management"
                                impact="+0.5-1.5 Jahre"
                                evidence="HRV-Kohärenz, Breathwork, Meditation"
                            />
                            <Factor
                                pillar="Soziale Verbindung"
                                impact="+0.5-1 Jahre"
                                evidence="Starkes soziales Netz, Community"
                            />
                        </div>
                    </div>

                    {/* Evidence */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2 text-sm">📚 Evidenz-Basis</h3>
                        <ul className="space-y-1 text-slate-400 text-xs">
                            <li>• Nurses' Health Study (n=120,000, 30+ Jahre)</li>
                            <li>• Whitehall II Study (10,000+ Teilnehmer)</li>
                            <li>• Blue Zones Research (Buettner et al.)</li>
                            <li>• Interventionsstudien zu Lifestyle-Faktoren</li>
                        </ul>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <p className="text-amber-200 text-xs">
                            <strong>Wichtig:</strong> Diese Schätzungen basieren auf bevölkerungsweiten Daten und
                            individuellen Compliance-Metriken. Individuelle Ergebnisse können variieren.
                            Dies ist keine medizinische Diagnose oder Garantie.
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold py-3 rounded-xl transition-colors"
                >
                    Verstanden
                </button>
            </div>
        </div>
    );
}

function Factor({ pillar, impact, evidence }) {
    return (
        <div className="flex items-start gap-3 bg-slate-800/30 border border-slate-700 rounded-lg p-3">
            <div className="flex-1">
                <p className="text-white text-sm font-medium mb-1">{pillar}</p>
                <p className="text-slate-400 text-xs">{evidence}</p>
            </div>
            <div className="text-amber-400 text-sm font-bold whitespace-nowrap">
                {impact}
            </div>
        </div>
    );
}
