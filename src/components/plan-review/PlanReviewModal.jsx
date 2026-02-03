import React from 'react';
import PlanOverview from './PlanOverview';
import FocusBreakdownChart from './FocusBreakdownChart';
import PhaseTimeline from './PhaseTimeline';
import ActivityPreview from './ActivityPreview';
import ScoreGauge from '../ScoreGauge';
import ShareScoreCard from '../ShareScoreCard';


/**
 * Plan Review Modal
 * Shows comprehensive overview of generated plan before user confirms
 */
export default function PlanReviewModal({ planOverview, onConfirm, onBack }) {
    if (!planOverview) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-8 py-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                ✨ Dein Plan ist fertig!
                            </h2>
                            <p className="text-slate-400">
                                Schau dir die Details an und starte, wenn du bereit bist
                            </p>
                        </div>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="text-slate-400 hover:text-white transition-colors"
                                aria-label="Zurück"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-8">
                    {/* Longevity Score Hero */}
                    {planOverview.longevity_score !== undefined && (
                        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 flex flex-col items-center">
                            <ScoreGauge score={planOverview.longevity_score} />

                            <div className="mt-6 text-center max-w-lg">
                                <h3 className="text-white font-semibold text-lg mb-2">
                                    Dein Startpunkt
                                </h3>
                                <p className="text-slate-400 mb-6">
                                    Dies ist deine geschätzte biologische Ausgangsbasis basierend auf deinen Antworten.
                                    Dein neuer Plan ist darauf ausgelegt, diesen Wert in den nächsten 30 Tagen zu verbessern.
                                </p>

                                {/* Share Score Button */}
                                <div className="max-w-xs mx-auto">
                                    <ShareScoreCard
                                        score={planOverview.longevity_score}
                                        userName={planOverview.title?.includes('Your') ? null : planOverview.title}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Plan Overview Card */}
                    <PlanOverview overview={planOverview} />

                    {/* Health Impact Check */}
                    <HealthImpactCheck health={planOverview.health} />

                    {/* Focus Breakdown */}
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-4">
                            📊 Deine Schwerpunkte
                        </h3>
                        <FocusBreakdownChart focusBreakdown={planOverview.focus_breakdown} />
                    </div>

                    {/* Phase Timeline */}
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-4">
                            📅 Deine Reise in 3 Phasen
                        </h3>
                        <PhaseTimeline phases={planOverview.phases} />
                    </div>

                    {/* Activity Preview */}
                    {planOverview.sample_activities && planOverview.sample_activities.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">
                                👀 Beispiel-Aktivitäten
                            </h3>
                            <ActivityPreview samples={planOverview.sample_activities} />
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">💡</span>
                            <div>
                                <h4 className="text-amber-400 font-semibold mb-2">
                                    Hinweis
                                </h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Dieser Plan wurde speziell für dich erstellt, basierend auf deinen Angaben.
                                    Du kannst jederzeit Aufgaben anpassen oder überspringen, wenn sie nicht zu
                                    deinem Alltag passen. Das Wichtigste ist, dass du dranbleibst!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-8 py-6">
                    <div className="flex gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="px-6 py-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                            >
                                ← Zurück
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-8 py-4 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-lg hover:from-amber-500 hover:to-amber-600 transition-all hover:scale-105 hover:shadow-xl shadow-amber-500/50"
                        >
                            🚀 Los geht's - Plan starten!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthImpactCheck({ health }) {
    if (!health || !health.hasProfile) return null;

    return (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                <span>🩺</span> Medizinischer Check
            </h3>

            <div className="space-y-3">
                {health.intensityCap && (
                    <div className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="text-emerald-400 mt-1">✓</span>
                        <span>
                            <strong>Intensität angepasst:</strong> Dein Plan wurde auf
                            <span className="text-white mx-1 font-medium bg-emerald-500/20 px-2 py-0.5 rounded">
                                {health.intensityCap === 'gentle' ? 'Sanft' : 'Moderat'}
                            </span>
                            begrenzt.
                        </span>
                    </div>
                )}

                {health.tasksFiltered > 0 && (
                    <div className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="text-emerald-400 mt-1">✓</span>
                        <span>
                            <strong>Sicherheitsfilter:</strong> {health.tasksFiltered} Übungen wurden automatisch ausgetauscht,
                            um deine Gesundheit zu schützen.
                        </span>
                    </div>
                )}

                {health.warnings && health.warnings.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Wichtige Hinweise</p>
                        <ul className="space-y-2">
                            {health.warnings.map((w, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-emerald-500">•</span>
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
