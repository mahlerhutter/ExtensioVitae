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
 * Full Plan Modal Component
 * Complete 30-day plan view with all tasks
 */
export default function FullPlanModal({ isOpen, onClose, plan, progress }) {
    if (!isOpen || !plan) return null;

    const phaseColors = {
        stabilize: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        build: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        optimize: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        consolidate: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    const phaseLabels = {
        stabilize: 'Stabilisieren',
        build: 'Aufbauen',
        optimize: 'Optimieren',
        consolidate: 'Festigen'
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Dein 30-Tage Plan</h2>
                        <p className="text-slate-400 text-sm mt-1">{plan.plan_summary}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
                    {plan.days.map((dayData) => {
                        const dayProgress = progress[dayData.day] || {};
                        const completedCount = dayData.tasks.filter(t => dayProgress[t.id]).length;
                        const isComplete = completedCount === dayData.tasks.length;

                        return (
                            <div key={dayData.day} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white font-semibold text-sm">
                                            {dayData.day}
                                        </span>
                                        <div>
                                            <span className={`text-xs px-2 py-0.5 rounded border ${phaseColors[dayData.phase]}`}>
                                                {phaseLabels[dayData.phase]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 text-xs">{dayData.total_time_minutes} min</span>
                                        {isComplete && (
                                            <span className="text-amber-400 text-xs flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Erledigt
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {dayData.tasks.map((task) => {
                                        const pillarInfo = PILLARS[task.pillar] || { label: task.pillar, color: 'bg-slate-500', textColor: 'text-slate-400' };
                                        const isDone = dayProgress[task.id];
                                        return (
                                            <div key={task.id} className={`flex items-start gap-3 p-2 rounded-lg ${isDone ? 'bg-slate-800/30' : 'bg-slate-800/60'}`}>
                                                <span className={`w-2 h-2 rounded-full mt-1.5 ${pillarInfo.color}`} />
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-xs ${pillarInfo.textColor}`}>{pillarInfo.label}</span>
                                                    <p className={`text-sm ${isDone ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                                        {task.task}
                                                    </p>
                                                </div>
                                                <span className="text-slate-500 text-xs whitespace-nowrap">{task.time_minutes} min</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-5 border-t border-slate-700 flex justify-end">
                    <button onClick={onClose} className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
}
