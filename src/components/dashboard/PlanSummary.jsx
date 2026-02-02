import React from 'react';

// Pillar configuration
const PILLARS = {
    sleep: { label: 'Sleep', color: 'bg-indigo-500', textColor: 'text-indigo-400' },
    movement: { label: 'Movement', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    nutrition: { label: 'Nutrition', color: 'bg-orange-500', textColor: 'text-orange-400' },
    stress: { label: 'Stress', color: 'bg-rose-500', textColor: 'text-rose-400' },
    connection: { label: 'Connection', color: 'bg-blue-500', textColor: 'text-blue-400' },
    mental: { label: 'Mental', color: 'bg-purple-500', textColor: 'text-purple-400' },
    supplements: { label: 'Supplements', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
};

/**
 * Plan Summary Component
 * Displays plan metadata, focus pillars, and action buttons
 */
export default function PlanSummary({ plan, onShowFullPlan, onShowHistory }) {
    // Dedupe and filter valid pillars
    const focusPillars = [...new Set(plan.primary_focus_pillars || [])].filter(p => PILLARS[p]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Dein Plan</h3>
                <p className="text-xs text-slate-500 italic mt-1">
                    Erstellt am {new Date(plan.created_at || plan.meta?.created_at || Date.now()).toLocaleString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr
                </p>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">{plan.plan_summary}</p>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-slate-500 text-sm">Fokus-Bereiche:</span>
                {focusPillars.map((pillar, idx) => (
                    <span
                        key={`${pillar}-${idx}`}
                        className={`px-2 py-1 rounded text-xs font-medium ${PILLARS[pillar].color} text-white`}
                    >
                        {PILLARS[pillar].label}
                    </span>
                ))}
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                    <button
                        onClick={onShowFullPlan}
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        30-Tage Plan ansehen →
                    </button>
                    <button className="text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors">
                        Download PDF →
                    </button>
                </div>
                <button
                    onClick={onShowHistory}
                    className="text-slate-500 hover:text-slate-300 text-xs font-medium flex items-center gap-2 self-start"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Vergangene Pläne ansehen
                </button>
            </div>
        </div>
    );
}
